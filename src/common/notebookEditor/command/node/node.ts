import { NodeType } from 'prosemirror-model';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { findWrapping, liftTarget } from 'prosemirror-transform';

import { isBlank, isNotNullOrUndefined } from '../../../util';
import { Attributes } from '../../attribute';
import { isMarkHolderNode } from '../../extension/markHolder';
import { isTextNode } from '../../extension/text';
import { isNodeActive, NodeName } from '../../node';
import { isGapCursorSelection, AncestorDepth } from '../../selection';
import { AbstractDocumentUpdate } from '../type';
import { getDefaultBlockFromContentMatch } from '../util';

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
    const { content, firstChild } = $anchor.parent,
          { size: contentSize } = content;

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

    const nodeAbove = $head.node(AncestorDepth.GrandParent),
          indexAfter = $head.indexAfter(AncestorDepth.GrandParent);
    if(!blockNodeType || !nodeAbove.canReplaceWith(indexAfter, indexAfter, blockNodeType)) return false/*cannot replace Node above*/;

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

    const grandParent = $head.node(AncestorDepth.GrandParent),
          indexAfterGrandParent = $head.indexAfter(AncestorDepth.GrandParent);
    const defaultBlockType = getDefaultBlockFromContentMatch(grandParent.contentMatchAt(indexAfterGrandParent));

    if(!defaultBlockType) return false/*no valid type was found*/;
    if(!grandParent.canReplaceWith(indexAfterGrandParent, indexAfterGrandParent, defaultBlockType)) return false/*invalid replacement*/;

    const newBlockNode = defaultBlockType.createAndFill();
    if(!newBlockNode) return false/*no valid wrapping was found*/;

    const posAfterReplacement = $head.after();
    tr.replaceWith(posAfterReplacement, posAfterReplacement, newBlockNode)
      .setSelection(Selection.near(tr.doc.resolve(posAfterReplacement), 1/*look forwards first*/))
      .scrollIntoView();

    return tr/*updated*/;
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
