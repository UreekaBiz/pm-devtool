import { BiRectangle } from 'react-icons/bi';
import { ImSvg } from 'react-icons/im';

import { NodeName } from 'common';

import { parentIsOfType, selectionIsOfType } from 'notebookEditor/extension/util/node';
import { Toolbar, ToolItem } from 'notebookEditor/toolbar/type';

import { RectangleToolDefinition } from '../tool/tool';

//*********************************************************************************
// == Tool Items ==================================================================
export const drawing: ToolItem = {
  toolType: 'button',

  name: NodeName.DRAWING,
  label: NodeName.DRAWING,

  icon: <ImSvg size={16} />,
  tooltip: 'Add a Drawing',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.state;
    if(selectionIsOfType(selection, NodeName.DRAWING)) return true;
    /* else -- drawing not selected */

    if(selection.$anchor.parent.type.name === NodeName.DRAWING) return true;
    /* else -- selection is not an drawing child */

    return false;
  },
  onClick: (editor) => editor.chain().focus().insertDrawing().run(),
};

// == Toolbar =====================================================================
export const DrawingToolbar: Toolbar = {
  nodeName: NodeName.DRAWING,
  toolsCollections: [
    [
      {
        toolType: 'button',

        name: NodeName.RECTANGLE,
        label: NodeName.RECTANGLE,

        icon: <BiRectangle size={16} />,
        tooltip: 'Add a Rectangle',

        shouldBeDisabled: (editor) => {
          const { selection } = editor.state;
          if(selectionIsOfType(selection, NodeName.RECTANGLE)) return true;
          /* else -- rect not selected, check if drawing selected */

          if(selectionIsOfType(selection, NodeName.RECTANGLE)) {/*currently only 1 rect per editor*/
            let rectExists = false;
            selection.node.content.forEach(node => { if(node.type.name === NodeName.RECTANGLE) rectExists = true; });
            if(rectExists) return true;
          }
          /* else -- drawing not selected */

          return false;
        },
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.DRAWING) || parentIsOfType(editor.state.selection, NodeName.DRAWING),
        onClick: (editor) => editor.chain().focus().setDrawingTool(RectangleToolDefinition).run(),
      },
    ],
  ],
};
