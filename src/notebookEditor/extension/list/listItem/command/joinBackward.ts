import { Transaction } from 'prosemirror-state';

import { isListNode, DocumentUpdate, JoinBackwardDocumentUpdate } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { applyDocumentUpdates } from 'notebookEditor/command/update';

// ********************************************************************************
// NOTE: this is a regular function since it calls applyDocumentUpdates
export const joinBackwardToEndOfClosestListItem = (editor: Editor) => {
  const { doc, selection } = editor.view.state,
        { empty, $from, from } = selection,
        { parent } = $from;

  if(!empty) return false/*do not allow if Selection is not empty*/;
  if(!parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
  if($from.before()+1/*inside the TextBlock*/ !== from) return false/*Selection is not at the start of the parent TextBlock*/;

  const parentIndex =  $from.index(0/*direct Doc depth*/),
        previousChildIndex = parentIndex-1/*by definition*/;
  if(parentIndex === 0/*first direct child of Doc*/) return false/*no previous child by definition*/;

  const previousChild = doc.child(previousChildIndex);
  if(!isListNode(previousChild)) return false/*no List to join into*/;

  let lastChildOfList = doc/*default*/,
      lastChildOfListPos = 0/*default*/;
  previousChild.descendants((node, pos) => {
    lastChildOfList = node;
    lastChildOfListPos = (pos+1/*inside the Node*/) + node.nodeSize;
  });

  if(!(parent.type === lastChildOfList.type)) return false/*Node cannot be joined*/;

  let updatedState = editor.view.state,
      updatedTr: Transaction | false = editor.view.state.tr;
  let updateAmount = 0/*default*/;

  // compute the required amount of times that Nodes must be JoinedBackward
  while(updatedTr.selection.from !== lastChildOfListPos) {
    updatedTr = new JoinBackwardDocumentUpdate().update(updatedState, updatedTr, editor.view);
    if(updatedTr) {
      updatedState = updatedState.apply(updatedTr);
      updateAmount++;
    } else { break/*could not join backward*/; }
  }

  const updates: DocumentUpdate[] = [/*default empty*/];
  for(let i=0; i<updateAmount; i++) { updates.push(new JoinBackwardDocumentUpdate()); }
  return applyDocumentUpdates(editor, updates);
};
