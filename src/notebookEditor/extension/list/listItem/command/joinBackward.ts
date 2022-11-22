import { isBlank, isBulletListNode, isOrderedListNode, JoinBackwardDocumentUpdate } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { Editor } from 'notebookEditor/editor/Editor';

// ********************************************************************************
// NOTE: this is a regular function since it calls applyDocumentUpdates
export const joinBackwardToEndOfClosestListItem = (editor: Editor): boolean => {
  const { selection } = editor.view.state;
  const { empty, $from, from } = selection;
  const { doc } = editor.view.state;

  if(!empty) return false/*do not allow if Selection is not empty*/;
  if(!$from.parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
  if($from.before()+1/*inside the TextBlock*/ !== from) return false/*Selection is not at the start of the parent TextBlock*/;

  const parentIndex =  $from.index(0/*direct Doc depth*/),
        previousChildIndex = parentIndex -1;
  if(parentIndex === 0/*first direct child of Doc*/) return false/*no previous child by definition*/;

  const previousChild = doc.child(previousChildIndex);
  if(!isBulletListNode(previousChild) || isOrderedListNode(previousChild)) return false/*no List to join into*/;

  let lastChildOfList = doc/*default*/,
      lastChildOfListPos = 0/*default*/;
  previousChild.descendants((node, pos) => {
    lastChildOfList = node;
    lastChildOfListPos = pos;
  });

  let { depth: lastChildOfListDepth } = doc.resolve(lastChildOfListPos);
  if(isBlank(lastChildOfList.textContent)/*no Text Nodes*/) {
    lastChildOfListDepth += 1/*ensure result is firstChild of the last ListItem*/;
  } /* else -- has Text content */

  const updates = [/*default empty*/];
  for(let i=0; i<=lastChildOfListDepth; i++) { updates.push(new JoinBackwardDocumentUpdate()); }

  return applyDocumentUpdates(editor, updates);
};
