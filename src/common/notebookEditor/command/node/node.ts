import { Fragment, NodeType } from 'prosemirror-model';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { canSplit, findWrapping, liftTarget } from 'prosemirror-transform';

import { isBlank, isNotNullOrUndefined } from '../../../util';
import { Attributes } from '../../attribute';
import { isMarkHolderNode } from '../../extension/markHolder';
import { isTextNode } from '../../extension/text';
import { isNodeActive, NodeName } from '../../node';
import { isGapCursorSelection, isNodeSelection, isTextSelection } from '../../selection';
import { AbstractDocumentUpdate } from '../type';
import { defaultBlockAt } from '../util';

// ********************************************************************************
// -- Create ----------------------------------------------------------------------
/** Creates a Block Node below the current Selection */
export const createBlockNodeCommand = (blockNodeName: NodeName, attributes: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new CreateBlockNodeDocumentUpdate(blockNodeName, attributes), state, dispatch);
export class CreateBlockNodeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly blockNodeName: NodeName, private readonly attributes: Partial<Attributes>) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that a Bloc Node is created
   * below the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { schema } = editorState;
    if(isGapCursorSelection(tr.selection)) return false/*do not allow creation when selection is GapCursor*/;

    const { $anchor, $head } = tr.selection;
    const blockNodeType = schema.nodes[this.blockNodeName];

    // if the current Block and the Selection are both empty
    // (or only a MarkHolder is present), replace the
    // parent Block with the desired Block
    const { content, firstChild } = $anchor.parent;
    const { size: contentSize } = content;

    let onlyContainsEmptyTextNodes = true/*default*/;
    $anchor.parent.content.forEach(child => {
      if(!isTextNode(child) || !isBlank(child.textContent)) {
        onlyContainsEmptyTextNodes = false;
      } /* else -- do not change default */
    });

    if(tr.selection.empty/*empty implies parent($anchor) === parent($head)*/
      && (contentSize < 1/*parent has no content*/
        || onlyContainsEmptyTextNodes/*the content is only white space and there are no atom nodes*/
        || contentSize === 1 && firstChild && isMarkHolderNode(firstChild)/*parent only has a MarkHolder*/)
    ) {
      const parentBlockRange = $anchor.blockRange($anchor);
      if(!parentBlockRange) return false/*no parent Block Range*/;

      const { $from, $to } = parentBlockRange;
      tr.setBlockType($from.pos, $to.pos, blockNodeType, this.attributes)
        .setSelection(Selection.near(tr.doc.resolve($to.pos - 1/*inside the new Block*/)));

      return tr/*nothing left to do*/;
    } /* else -- not the same parent (multiple Selection) or content not empty, insert Block below */

    const above = $head.node(-1/*document level*/),
          after = $head.indexAfter(-1/*document level*/);

    if(!blockNodeType || !above.canReplaceWith(after, after, blockNodeType)) return false/*cannot replace Node above*/;

    const creationPos = $head.after();
    const newBlockNode = blockNodeType.createAndFill(this.attributes);
    if(!newBlockNode) return false/*no valid wrapping was found*/;

    tr.replaceWith(creationPos, creationPos, newBlockNode)
      .setSelection(Selection.near(tr.doc.resolve(creationPos + 1/*inside the new Block*/), 1/*look forwards first*/));

    return tr/*updated*/;
  }
}

// -- Insert ----------------------------------------------------------------------
// replace the Selection with a newline character. Must be set for Block Nodes
// whose behavior should match the one provided by specifying 'code' in the
// NodeSpec, without the need of declaring it, thus getting rid of the ProseMirror
// induced constraints that come with it (e.g. not being able to paste Marks)
export const insertNewlineCommand = (nodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new InsertNewlineDocumentUpdate(nodeName), state, dispatch);
export class InsertNewlineDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly nodeName: NodeName) {/*nothing additional*/}

  /*
   * modify the given Transaction such that the Selection is replaced with a
   * newline character
   */
  public update(editorState: EditorState, tr: Transaction) {
    let { $head, $anchor } = editorState.selection;
    if(!$head.sameParent($anchor)) return false/*do not allow on multiple Node Selection*/;
    if($head.parent.type.name !== this.nodeName) return false/*should not be handled by this Node*/;

    tr.insertText('\n').scrollIntoView();
    return tr;
  }
}

// -- Leave -----------------------------------------------------------------------
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts#L246
// create a default Block Node after the one at the current Selection and
// move the cursor there
export const leaveBlockNodeCommand = (nodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LeaveBlockNodeDocumentUpdate(nodeName), state, dispatch);
export class LeaveBlockNodeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly nodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that a default Block Node is created
   * after the one at the current Selection and the cursor is moved there
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { $head, $anchor } = editorState.selection;
    if(!$head.sameParent($anchor)) return false/*Selection spans multiple Blocks*/;
    if(!($head.parent.type.name === this.nodeName)) return false/*this Node should not handle the call*/;

    const grandParentOfHead = $head.node(-1/*grandParent*/),
          indexAfterGrandParentOfHead = $head.indexAfter(-1/*grandParent depth*/);
    const defaultBlockType = defaultBlockAt(grandParentOfHead.contentMatchAt(indexAfterGrandParentOfHead));

    if(!defaultBlockType) return false/*no valid type was found*/;
    if(!grandParentOfHead.canReplaceWith(indexAfterGrandParentOfHead, indexAfterGrandParentOfHead, defaultBlockType)) return false/*invalid replacement*/;

    const newBlockNode = defaultBlockType.createAndFill();
    if(!newBlockNode) return false/*no valid wrapping was found*/;

    const posAfterReplacement = $head.after();
    tr.replaceWith(posAfterReplacement, posAfterReplacement, newBlockNode)
      .setSelection(Selection.near(tr.doc.resolve(posAfterReplacement), 1/*look forwards first*/))
      .scrollIntoView();

    return tr/*updated*/;
  }
}

// -- Split -----------------------------------------------------------------------
// split the Block at the Selection
export const splitBlockCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SplitBlockDocumentUpdate(), state, dispatch);
export class SplitBlockDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts#L295
  /**
   * modify the given Transaction such that the Block at
   * the current Selection is split
   */
  public update(editorState: EditorState, tr: Transaction) {
    const selectionReference = editorState.selection;
    const { $from, $to } = selectionReference;

    if(isNodeSelection(editorState.selection) && editorState.selection.node.isBlock) {
      if(!$from.parentOffset || !canSplit(editorState.doc, $from.pos)) {
        return false/*cannot split*/;
      } /* else -- no offset into $from's parent or can split Node */

      tr.split($from.pos).scrollIntoView();
      return tr/*updated*/;
    } /* else -- not splitting a Block Node Selection */

    if(!$from.parent.isBlock) {
      return false/*cannot split a non- Block Node*/;
    } /* else -- try to split */

    // create a default Block if no content in the parent or when at the end of the parent
    let needToCreateDefaultBlock = false/*default*/;
    if($from.parent.type === editorState.doc.type.contentMatch.defaultType) {
      if(!$from.parent.textContent) {
        needToCreateDefaultBlock = true;
      } /* else -- the parent has content, do not change default */
    } else {
      if($to.parentOffset === $to.parent.content.size/*at the end of the parent's content*/) {
        needToCreateDefaultBlock = true;
      } /* else -- not at the end of the parent's content, no need to create */
    }

    if(isTextSelection(editorState.selection)) {
      tr.deleteSelection();
    } /* else -- not a TextSelection, no need to delete anything */

    let defaultTypeAtDepth = undefined/*default*/;
    if($from.depth !== 0/*not pointing directly at the root node*/) {
      defaultTypeAtDepth = $from.node(-1/*grand parent*/).contentMatchAt($from.indexAfter(-1/*grand parent depth*/)).defaultType;
    } /* else -- pointing directly at the root node */

    let typesAfterSplit = undefined/*default*/;
    if(needToCreateDefaultBlock && defaultTypeAtDepth) {
      typesAfterSplit = [{ type: defaultTypeAtDepth }];
    } /* else -- keep default */

    // check if canSplit with the types from above
    let canPerformSplit = canSplit(tr.doc, tr.mapping.map($from.pos), 1/*direct child of Doc depth*/, typesAfterSplit);

    // check if canSplit with defaultTypeAtDepth
    if(!typesAfterSplit /*could not split with the types from above*/
        && !canPerformSplit /*could not split with the types from above*/
        && defaultTypeAtDepth /*there exist a default type at this depth*/
        && canSplit(tr.doc, tr.mapping.map($from.pos), 1/*direct child of Doc depth*/, [{ type: defaultTypeAtDepth }]) /*can perform split*/
      ) {
      typesAfterSplit = [{ type: defaultTypeAtDepth }];
      canPerformSplit = true;
    }

    if(canPerformSplit && defaultTypeAtDepth) {
      tr.split(tr.mapping.map($from.pos), 1/*depth*/, typesAfterSplit);

      if(!needToCreateDefaultBlock
        && !$from.parentOffset/*parent has no content*/
        && $from.parent.type !== defaultTypeAtDepth
        && $from.node(-1/*grandParent*/).canReplace($from.index(-1), $from.indexAfter(-1), Fragment.from(defaultTypeAtDepth.create()))
      ) {
        tr.setNodeMarkup(tr.mapping.map($from.before()), defaultTypeAtDepth);
      }
    } /* else -- cannot perform split or there is no default type at depth */

    tr.scrollIntoView();
    return tr/*updated*/;
  }
}

/** split the Block at the Selection keeping active Marks */
export const splitBlockKeepMarksCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SplitBlockKeepMarksDocumentUpdate(), state, dispatch);
export class SplitBlockKeepMarksDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the Block at
   * the current Selection is split and the Marks are kept
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    if(isGapCursorSelection(selection)) return false/*do not allow, enforce typing to create new block of default type*/;

    const startingMarks = editorState.storedMarks || (editorState.selection.$to.parentOffset && editorState.selection.$from.marks());
    const updatedTr = new SplitBlockDocumentUpdate().update(editorState, tr);

    if(updatedTr) {
      if(startingMarks) {
        updatedTr.ensureMarks(startingMarks);
      } /* else -- there were no Marks before splitting the block */
      return updatedTr;
    } /* else -- return default */

    return false/*default*/;
  }
}

// -- Wrap ------------------------------------------------------------------------
export const toggleWrapCommand = (nodeType: NodeType, attrs: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleWrapDocumentUpdate(nodeType, attrs), state, dispatch);
export class ToggleWrapDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly nodeType: NodeType, private readonly attrs: Partial<Attributes>) {/*nothing additional*/}
  /*
    * modify the given Transaction such that the Selection is wrapped in a Node
    * of the given type with the given Attributes
    */
  public update(editorState: EditorState, tr: Transaction) {
    const { $from, $to } = editorState.selection;

    const nodeActive = isNodeActive(editorState, this.nodeType.name as NodeName/*by definition*/, this.attrs);
    if(nodeActive) {
      // lift the Node
      const liftRange = $from.blockRange($to);
      if(!liftRange) return false/*no range to lift*/;

      const targetDepth = liftTarget(liftRange);
      if(!isNotNullOrUndefined<number>(targetDepth)) return false/*no depth at which to lift the Block*/;

      return tr.lift(liftRange, targetDepth).scrollIntoView();
    } /* else -- wrap */

    const wrapRange = $from.blockRange($to);
    if(!wrapRange) return false/*no range to wrap*/;

    const wrapping = findWrapping(wrapRange, this.nodeType, this.attrs);
    if(!wrapping) return false/*no valid wrapping was found*/;

    return tr.wrap(wrapRange, wrapping).scrollIntoView();
  }
}
