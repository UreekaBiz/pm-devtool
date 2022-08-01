import { Node } from '@tiptap/core';
import { Slice } from 'prosemirror-model';
import { NodeSelection, Plugin, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { getNodesAffectedByStepMap, AttributeType, NodeName, MarkHolderNodeSpec, SetAttributeType, NotebookSchemaType, isMarkHolderNode } from 'common';

import { getNodeOutputSpec, setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';
import { NoOptions, NoStorage } from 'notebookEditor/model/type';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-paragraph/src/paragraph.ts

// == Node ========================================================================
export const MarkHolder = Node.create<NoOptions, NoStorage>({
  ...MarkHolderNodeSpec,

  // -- Attribute -----------------------------------------------------------------
  addAttributes() { return { [AttributeType.StoredMarks]: setAttributeParsingBehavior(AttributeType.StoredMarks, SetAttributeType.ARRAY) }; },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() {
    return [
      new Plugin<NotebookSchemaType>({
        // -- Transaction ---------------------------------------------------------
        props: {
          // .. Handler ...............................................................
          // When this returns true, the keyboard is manually handled (PM won't interfere)
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const { dispatch } = view,
            { tr } = view.state,
            pos = view.state.selection.$anchor.pos - 1/*selection will be past the MarkHolder*/;

            const markHolder = view.state.doc.nodeAt(pos);
            if(!markHolder || !isMarkHolderNode(markHolder)) {
              return false/*let PM handle the event*/;
            }/* else -- handle event */

            if(event.key === 'Backspace') {
              const parentPos = pos - 1/*by contract*/;
              tr.setSelection(new TextSelection(tr.doc.resolve(parentPos), tr.doc.resolve(parentPos + view.state.selection.$anchor.parent.nodeSize)))
                .deleteSelection();
              dispatch(tr);
              return true/*event handling done*/;
            }/* else -- not handling backspace */

            if(event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
              return false/*do not handle event*/;
            }/* else -- handle event */

            tr.setSelection(new NodeSelection(tr.doc.resolve(pos)))
              .setStoredMarks(markHolder.attrs.storedMarks)
              .replaceSelectionWith(this.editor.schema.text(event.key));
            dispatch(tr);
            return true/*event handled*/;
          },

          handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
            const { dispatch } = view,
                  { tr } = view.state,
            pos = view.state.selection.$anchor.pos - 1/*selection will be past the MarkHolder*/;

            const markHolder = view.state.doc.nodeAt(pos);
            if(!markHolder || !isMarkHolderNode(markHolder)) {
              return false/*let PM handle the event*/;
            }/* else -- handle event */

            tr.setSelection(new NodeSelection(tr.doc.resolve(pos)))
              .replaceSelection(slice);
            markHolder.attrs.storedMarks?.forEach(storedMark => {
              tr.addMark(pos, pos + slice.size, storedMark);
            });
            dispatch(tr);
            return true/*event handled*/;
          },
        },
      }),
    ];
  },

  // -- Transaction ---------------------------------------------------------------
  // TODO: Document
  onTransaction({ transaction }) {
    const { maps } = transaction.mapping;
    for(let stepMapIndex = 0; stepMapIndex < maps.length; stepMapIndex++) {
      maps[stepMapIndex].forEach((unmappedOldStart, unmappedOldEnd) => {
        const { oldNodeObjs, newNodeObjs } = getNodesAffectedByStepMap(transaction, stepMapIndex, unmappedOldStart, unmappedOldEnd, new Set([NodeName.HEADING, NodeName.PARAGRAPH]));
        if(oldNodeObjs.length !== newNodeObjs.length) return;

        for(let i = 0; i < newNodeObjs.length; i++) {
          if(oldNodeObjs[i].node.content.size > 0 && newNodeObjs[i].node.content.size < 1) {
            if(!transaction.storedMarks) {
              continue/*do not insert MarkHolder*/;
            }/* else -- there are stored marks, insert MarkHolder */

            this.editor.chain().command((props) => {
              const { tr, dispatch } = props;
              if(!dispatch) throw new Error('dispatch undefined when it should not');

              tr.insert(newNodeObjs[i].position + 1/*inside the parent*/, this.type.create({ storedMarks: transaction.storedMarks }));
              dispatch(tr);
              return true;
            }).run();
          }
        }
      });
    }
  },

  // -- View ----------------------------------------------------------------------
  parseHTML() { return [{ tag: NodeName.MARK_HOLDER }]; },
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes); },
});
