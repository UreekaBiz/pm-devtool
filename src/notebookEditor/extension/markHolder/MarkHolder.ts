import { ChainedCommands, Editor, Node } from '@tiptap/core';
import { Fragment, Mark, MarkType, Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import { Plugin, Selection, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { getNodesAffectedByStepMap, getNodeOutputSpec, isMarkHolderNode, AttributeType, JSONMark, MarkHolderNodeSpec, MarkHolderNodeType, MarkName, NodeName, NotebookSchemaType, SchemaV1 } from 'common';

import { NoOptions, NoStorage, ParseRulePriority } from 'notebookEditor/model/type';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-paragraph/src/paragraph.ts

// == Constant ====================================================================
// the Inclusion Set of Nodes that must maintain marks after their Content was
// deleted, if any marks were active when said Content was deleted
const blockNodesThatPreserveMarks = new Set([NodeName.HEADING, NodeName.PARAGRAPH]);

// == Node ========================================================================
export const MarkHolder = Node.create<NoOptions, NoStorage>({
  ...MarkHolderNodeSpec,

  // -- Attribute -----------------------------------------------------------------
  // NOTE: custom parseHTML being used to correctly parse the Mark array of the
  //       MarkHolder
  addAttributes() {
    return {
      [AttributeType.StoredMarks]: {
        default: [/*empty*/],
        parseHTML: (element): Mark[] => {
          const stringifiedArray = element.getAttribute(AttributeType.StoredMarks);
          if(!stringifiedArray) return [/*default empty*/];
          const JSONMarkArray = JSON.parse(stringifiedArray) as JSONMark[]/*by contract*/;

          const markArray: Mark[] = JSONMarkArray.map(markName => Mark.fromJSON(SchemaV1, markName));
          return markArray;
        },
      },
    };
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() {
    return [
      new Plugin<NotebookSchemaType>({
        // -- Transaction ---------------------------------------------------------
        // when a BlockNode that must preserve Marks (SEE:
        // blockNodesThatPreserveMarks Set above) gets its Content removed but
        // the Node is not deleted (i.e., the Content's length was greater than
        // zero and now its -exactly- zero), and there were activeMarks,
        // insert a MarkHolder Node that contains the respective Marks
        appendTransaction(transactions, oldState, newState) {
          if(oldState === newState) return/*no changes*/;
          const { tr } = newState;

          // NOTE: this transaction has to step through all stepMaps without leaving
          //       early since any of them can leave a Block Node of the inclusion
          //       Set empty, and none should be missed, regardless of whether or not
          //       they had Content before (i.e. what matters is that there are Marks
          //       to store in the MarkHolder)
          for(let i = 0; i < transactions.length; i++) {
            const { maps } = transactions[i].mapping;

            for(let stepMapIndex = 0; stepMapIndex < maps.length; stepMapIndex++) {
              // NOTE: see NOTE above
              maps[stepMapIndex].forEach((unmappedOldStart, unmappedOldEnd) => {
                const { newNodeObjs } = getNodesAffectedByStepMap(transactions[i], stepMapIndex, unmappedOldStart, unmappedOldEnd, blockNodesThatPreserveMarks);

                for(let j = 0; j < newNodeObjs.length; j++) {
                  if(newNodeObjs[j].node.content.size < 1) {
                    if(!transactions[i].storedMarks) {
                      continue/*do not insert MarkHolder since there were no stored marks*/;
                    }/* else -- there are stored marks, insert MarkHolder */

                    tr.insert(newNodeObjs[i].position + 1/*inside the parent*/, newState.schema.nodes[NodeName.MARK_HOLDER].create({ storedMarks: transactions[i].storedMarks }));
                  }/* else -- new content is greater than zero, no need to add MarkHolder */
                }
              });
            }
          }

          return tr;
        },

        // -- Props ---------------------------------------------------------------
        props: {
          // When these return true, the event is manually handled (PM won't interfere)

          // .. Handler ...............................................................
          // when the User types something and the cursor is currently past a
          // MarkHolder, delete the MarkHolder and ensure the User's input gets the
          // MarkHolder marks applied to it
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const { dispatch, tr, pos } = getUtilsFromView(view),
                  markHolder = view.state.doc.nodeAt(pos);
            if(!markHolder || !isMarkHolderNode(markHolder)) {
              return false/*let PM handle the event*/;
            }/* else -- handle event */

            if(event.key === 'Backspace') {
              const parentPos = pos - 1/*by contract since MarkHolder gets inserted at start of parent Node*/;
              tr.setSelection(new TextSelection(tr.doc.resolve(parentPos), tr.doc.resolve(parentPos + view.state.selection.$anchor.parent.nodeSize)))
                .deleteSelection();
              dispatch(tr);
              return true/*event handling done*/;
            }/* else -- not handling backspace */

            if(event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
              return false/*do not handle event*/;
            }/* else -- handle event */
            tr.setSelection(new TextSelection(tr.doc.resolve(pos), tr.doc.resolve(pos + markHolder.nodeSize)))
              .setStoredMarks(markHolder.attrs.storedMarks)
              .replaceSelectionWith(this.editor.schema.text(event.key));
            dispatch(tr);
            return true/*event handled*/;
          },

          // ..........................................................................
          // when the User pastes something and the cursor is currently past a
          // MarkHolder, delete the MarkHolder and ensure the pasted slice gets the
          // MarkHolder marks applied to it
          handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
            const { dispatch, tr, pos } = getUtilsFromView(view),
                  markHolder = view.state.doc.nodeAt(pos);
            if(!markHolder || !isMarkHolderNode(markHolder)) {
              return false/*let PM handle the event*/;
            }/* else -- handle event */

            tr.setSelection(new TextSelection(tr.doc.resolve(pos), tr.doc.resolve(pos + markHolder.nodeSize)))
              .replaceSelection(slice);
            markHolder.attrs.storedMarks?.forEach(storedMark => tr.addMark(pos, pos + slice.size, storedMark));
            dispatch(tr);
            return true/*event handled*/;
          },

          // ensure no MarkHolders ever get pasted in places they should not be
          transformPasted(slice: Slice) {
            slice.content.descendants(descendantBlockNode => {
              if(!descendantBlockNode.isBlock) {
                return/*nothing to do*/;
              }/* else -- Node can have MarkHolders */

              const canHaveMarkHolder = descendantBlockNode.content.size < 1/*pasted Node is empty*/;
              if(canHaveMarkHolder) {
                return/*nothing to do*/;
              }/* else -- ensure there are no MarkHolders present in the Block Node */

              const filteredContent: ProseMirrorNode<NotebookSchemaType>[] = [];
              descendantBlockNode.content.descendants(descendantInlineNode => {
                if(!isMarkHolderNode(descendantInlineNode)) {
                  filteredContent.push(descendantInlineNode);
                }/* else -- do not add to filteredContent */
              });

              descendantBlockNode.content = Fragment.fromArray(filteredContent);
            });
            return slice;
          },
        },
      }),
    ];
  },

  // -- View ----------------------------------------------------------------------
  parseHTML() { return [{ tag: `div[data-node-type="${NodeName.MARK_HOLDER}"]`, priority: ParseRulePriority.MARK_HOLDER/*(SEE: ParseRulePriority)*/ }];
},
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes, true/*not a Leaf node, but do -not- add a content hole (SEE: MarkHolderNodeSpec)*/); },
});

// == Util ========================================================================
// creates a MarkHolder Node holding the Marks corresponding to the given MarkNames
export const createMarkHolder = (editor: Editor, markNames: MarkName[]) =>
  editor.schema.nodes[NodeName.MARK_HOLDER].create({ storedMarks: markNames.map(markName => editor.schema.marks[markName].create()) }).toJSON();

/**
 * Checks to see whether or not the first child of the parent of the current
 * Editor {@link Selection} is a MarkHolderNode. It returns it if it is, and
 * otherwise it returns false
 */
export const isMarkHolderPresent = (editor: Editor) => {
  const { firstChild } = editor.state.selection.$anchor.parent;
  if(firstChild && isMarkHolderNode(firstChild)) {
    return firstChild;
  }/* else -- firstChild does not exist or is not a MarkHolder */

  return false;
};

/**
 * Ensure that toggling of Marks whenever a MarkHolder is present on a BlockNode
 * modifies the Marks that it has inside of it
 */
// NOTE: the parameters of this function are set specifically such that
//       the function can be used both by ToolItems and commands.
//       Since editor.chain is not of the same type as the chain returned by
//       CommandProps, not doing this causes a 'MismatchedTransaction' error
export const handleMarkHolderPresence = (editorSelection: Selection, chain: () => ChainedCommands, markHolder: MarkHolderNodeType, appliedMarkType: MarkType): boolean => {
  let newMarksArray: Mark[] = [];
  if(markHolder.attrs.storedMarks?.some(mark => mark.type.name === appliedMarkType.name)) {
    // mark already included, remove it
    newMarksArray = [...markHolder.attrs.storedMarks!/*defined by contract*/.filter(mark => mark.type.name !== appliedMarkType.name)];
  } else {
    // mark not included yet, add it
    newMarksArray = [...markHolder.attrs.storedMarks!/*defined by contract*/, appliedMarkType.create()];
  }

  return chain().focus().command((props) => {
    const { dispatch, tr } = props;
    if(!dispatch) throw new Error('dispatch undefined when it should not');

    const startOfParentNodePos = tr.doc.resolve(editorSelection.$anchor.pos - editorSelection.$anchor.parentOffset);
    const { pos: startingPos } = tr.selection.$anchor;

    tr.setSelection(new TextSelection(startOfParentNodePos, tr.doc.resolve(startOfParentNodePos.pos + markHolder.nodeSize)))
      .setNodeMarkup(tr.selection.$anchor.pos, undefined/*maintain type*/, { storedMarks: newMarksArray })
      .setSelection(new TextSelection(tr.doc.resolve(startingPos)));
    dispatch(tr);
    return true;
  }).run();
};

// Utility function to return dispatch, tr and pos in the same object
const getUtilsFromView = (view: EditorView) => {
  const { dispatch } = view,
          { tr } = view.state,
          pos = view.state.selection.$anchor.pos - 1/*selection will be past the MarkHolder*/;

  return { dispatch, tr, pos };
};
