import { isNodeSelection, AttributeType, NodeName, SetNodeSelectionDocumentUpdate, UpdateAttributesDocumentUpdate, VerticalAlign } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { Editor } from 'notebookEditor/editor/Editor';

// ********************************************************************************
// .. Vertical Align ..............................................................
// NOTE: this is an utility and not a Command since it
//       makes use of applyDocumentUpdates
// sets the vertical alignment Attribute for a Node if it is not currently bottom,
// or sets it to 'bottom' if the desiredAlignment is the same it already has
export const setVerticalAlign = (editor: Editor, desiredAlignment: VerticalAlign): boolean => {
  const { selection } = editor.view.state;
  const nodePos = selection.anchor;
  if(!isNodeSelection(selection)) return false/*do not handle*/;

  const { name: nodeName } = selection.node.type,
        shouldSetBottom = selection.node.attrs[AttributeType.VerticalAlign] === desiredAlignment;

  return applyDocumentUpdates(editor, [
    new UpdateAttributesDocumentUpdate(nodeName as NodeName/*guaranteed by above check*/, { [AttributeType.VerticalAlign]: shouldSetBottom ? VerticalAlign.bottom : desiredAlignment }),
    new SetNodeSelectionDocumentUpdate(nodePos),
  ]);
};
