import { AiOutlineSmallDash } from 'react-icons/ai';
import { BiMinus, BiPencil, BiSquareRounded } from 'react-icons/bi';
import { BsBrush } from 'react-icons/bs';
import { CgBorderStyleDashed, CgFormatSlash } from 'react-icons/cg';
import { FaMinus } from 'react-icons/fa';
import { GiSquare } from 'react-icons/gi';
import { IoMdSquare } from 'react-icons/io';
import { MdArchitecture, MdOutlineClose } from 'react-icons/md';
import { TiMinus } from 'react-icons/ti';

import { NodeName, RECTANGLE_STROKE_TOOL, RECTANGLE_BACKGROUND_TOOL, RECTANGLE_FILL_TOOL, RECTANGLE_STROKE_WIDTH_TOOL, RECTANGLE_STROKE_STYLE_TOOL, RECTANGLE_SLOPPINESS_TOOL, RECTANGLE_EDGE_TOOL, RECTANGLE_OPACITY_TOOL } from 'common';
import { getNodeIDFromSelection, isNodeSelection, selectionIsOfType } from 'notebookEditor/extension/util/node';
import { isHexColorRegex } from 'notebookEditor/extension/util/parse';
import { Toolbar } from 'notebookEditor/toolbar/type';

import { fillColors, strokeColors, ARCHITECT_ROUGHNESS, ARTIST_ROUGHNESS, BOLD_STROKE_WIDTH, CARTOONIST_ROUGHNESS, CROSS_HATCH_FILL_STYLE, DASHED_STROKE_STYLE, DOTTED_STROKE_STYLE, EXTRA_BOLD_STROKE_WIDTH, HACHURE_FILL_STYLE, SOLID_STROKE_STYLE, THIN_STROKE_WIDTH, SOLID_FILL_STYLE } from '../../constant';
import { isFillStyle, isRoughness, isStrokeStyle, Color } from '../../type';
import { ChangeColorToolUI } from '../component/changeColorUI/ChangeColorToolUI';
import { OpacityToolUI } from '../component/OpacityToolUI';
import { ShapeToolContainerUI } from '../component/ShapeToolContainerUI';

//*********************************************************************************
export const RectangleToolbar: Toolbar = {
  nodeName: NodeName.RECTANGLE,
  toolsCollections: [
    [
      // == Stroke ==============================================================
      {
        toolType: 'component',
        name: RECTANGLE_STROKE_TOOL,

        component: ({ editor }) =>
          <ChangeColorToolUI
            toolTitle={'Stroke'}
            toolName={RECTANGLE_STROKE_TOOL}
            leftAddonText={'#'}
            currentColor={isNodeSelection(editor.state.selection) && editor.state.selection.node.attrs.stroke}
            colors={strokeColors}
            buttonCallback={(color: Color) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE)) return;
              /* else -- modify rect attrs */

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), stroke: color.hexCode.substring(1/*remove '#'*/) });
            }}
            inputCallback={(event: React.ChangeEvent<HTMLInputElement>) => {
              const { selection } = editor.state;

              if(!selectionIsOfType(selection, NodeName.RECTANGLE) ||
                !isHexColorRegex(event.target.value)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), stroke: event.target.value });
            }}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Background ==========================================================
      {
        toolType: 'component',
        name: RECTANGLE_BACKGROUND_TOOL,

        component: ({ editor }) =>
          <ChangeColorToolUI
            toolTitle={'Background'}
            toolName={RECTANGLE_BACKGROUND_TOOL}
            leftAddonText={'#'}
            currentColor={isNodeSelection(editor.state.selection) && editor.state.selection.node.attrs.fill}
            colors={fillColors}
            buttonCallback={(color: Color) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE)) return;
              /* else -- modify rect attrs */

              const fill = color.hexCode === 'transparent' ? color.hexCode : color.hexCode.substring(1/*remove '#'*/);
              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection),  fill });
            }}
            inputCallback={(event: React.ChangeEvent<HTMLInputElement>) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE) ||
                !isHexColorRegex(event.target.value)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection),  fill: event.target.value });
            }}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Fill ===============================================================
      {
        toolType: 'component',
        name: RECTANGLE_FILL_TOOL,

        component: ({ editor }) =>
          <ShapeToolContainerUI
            toolTitle={'Fill'}
            buttonLabels={['Hachure', 'Cross-Hatch', 'Solid']}
            callback={(fillStyle) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE) || !(typeof fillStyle === 'string') || !isFillStyle(fillStyle)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), fillStyle });
            }}
            callbackArguments={[HACHURE_FILL_STYLE, CROSS_HATCH_FILL_STYLE, SOLID_FILL_STYLE]}
            buttonIcons={[<CgFormatSlash key={'hachureIcon'} />, <MdOutlineClose key={'crossHatchIcon'} />, <IoMdSquare key={'solidFillIcon'} />]}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Stroke Width ========================================================
      {
        toolType: 'component',
        name: RECTANGLE_STROKE_WIDTH_TOOL,

        component: ({ editor }) =>
          <ShapeToolContainerUI
            toolTitle={'Stroke Width'}
            buttonLabels={['Thin', 'Bold', 'Extra Bold']}
            callback={(strokeWidth) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE) || !(typeof strokeWidth === 'number')) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection),  strokeWidth });
            }}
            callbackArguments={[THIN_STROKE_WIDTH, BOLD_STROKE_WIDTH, EXTRA_BOLD_STROKE_WIDTH]}
            buttonIcons={[<BiMinus key={'thinIcon'} />, <TiMinus key={'boldIcon'} />, <FaMinus key={'extraBoldIcon'} />]}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Stroke Style ========================================================
      {
        toolType: 'component',
        name: RECTANGLE_STROKE_STYLE_TOOL,

        component: ({ editor }) =>
          <ShapeToolContainerUI
            toolTitle={'Stroke Style'}
            buttonLabels={['Solid', 'Dashed', 'Dotted']}
            callback={(strokeStyle) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE) || !(typeof strokeStyle === 'string') || !isStrokeStyle(strokeStyle)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), strokeStyle });
            }}
            callbackArguments={[SOLID_STROKE_STYLE, DASHED_STROKE_STYLE, DOTTED_STROKE_STYLE]}
            buttonIcons={[<BiMinus key={'solidIcon'} />, <CgBorderStyleDashed key={'dashedIcon'} />, <AiOutlineSmallDash key={'dottedIcon'} />]}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Sloppiness ==========================================================
      {
        toolType: 'component',
        name: RECTANGLE_SLOPPINESS_TOOL,

        component: ({ editor }) =>
          <ShapeToolContainerUI
            toolTitle={'Sloppiness'}
            buttonLabels={['Architect', 'Artist', 'Cartoonist']}
            callback={(roughness) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE) || !(typeof roughness === 'number') || !isRoughness(roughness)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), roughness });
            }}
            callbackArguments={[ARCHITECT_ROUGHNESS, ARTIST_ROUGHNESS, CARTOONIST_ROUGHNESS]}
            buttonIcons={[<MdArchitecture key={'architectIcon'} />, <BsBrush key={'artistIcon'} />, <BiPencil key={'cartoonistIcon'} />]}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Edge ================================================================
      {
        toolType: 'component',
        name: RECTANGLE_EDGE_TOOL,

        component: ({ editor }) =>
          <ShapeToolContainerUI
            toolTitle={'Edges'}
            buttonLabels={[]}
            callback={(/*TODO: Implement Edges*/) => {
              if(!selectionIsOfType(editor.state.selection, NodeName.RECTANGLE)) return;

            }}
            callbackArguments={[]}
            buttonIcons={[<GiSquare key={'sharpIcon'} />, <BiSquareRounded key={'roundIcon'} />]}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },

      // == Opacity =============================================================
      {
        toolType: 'component',
        name: RECTANGLE_OPACITY_TOOL,

        component: ({ editor }) =>
          <OpacityToolUI
            toolTitle={'Opacity'}
            nodeAttrs={isNodeSelection(editor.state.selection) ? editor.state.selection.node.attrs : {/*nothing*/}}
            currentOpacity={isNodeSelection(editor.state.selection) && editor.state.selection.node.attrs.opacity}
            callback={(opacity) => {
              const { selection } = editor.state;
              if(!selectionIsOfType(selection, NodeName.RECTANGLE)) return;

              editor.commands.updateShapeAttributes({ id: getNodeIDFromSelection(selection), opacity });
            }}
          />,
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
        shouldBeDisabled: () => false,
      },
    ],
  ],
};
