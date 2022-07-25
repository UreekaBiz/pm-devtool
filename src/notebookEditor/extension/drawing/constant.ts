import { Color, CSSStyle, ShapeStyle } from './type';

// ********************************************************************************
// == Constant ====================================================================
// -- General ---------------------------------------------------------------------
export const DRAWING_LAYER = 'drawingLayer';
export const SELECTION_LAYER = 'selectionLayer';
export const SVGNS = 'http://www.w3.org/2000/svg';

export const MOUSE = 'Mouse';
export const MOUSEDOWN = 'mousedown';
export const MOUSEMOVE = 'mousemove';
export const MOUSEUP = 'mouseup';
export const MOUSELEAVE = 'mouseleave';
export const MOUSE_CURSOR_CLASS = 'cursorAuto';
export const MOUSE_MOVE_CURSOR_CLASS = 'cursorMove';
export const MOUSE_GRAB_CURSOR_CLASS = 'cursorGrab';
export const MOUSE_TOOL_ID = 'mouseButton';

export const SHAPE_CURSOR = 'cursorCrosshair';

// -- Shape -----------------------------------------------------------------------
export const SHAPE_G = 'shapeG';
export const SELECTION_G = 'selectionG';
export const SELECTION_RECT = 'selectionRect';

// == Attribute ===================================================================
export const HACHURE_FILL_STYLE = 'hachure';
export const CROSS_HATCH_FILL_STYLE = 'cross-hatch';
export const SOLID_FILL_STYLE = 'solid';

export const THIN_STROKE_WIDTH = 3/*px*/;
export const BOLD_STROKE_WIDTH = 5/*px*/;
export const EXTRA_BOLD_STROKE_WIDTH = 10/*px*/;

export const SOLID_STROKE_STYLE = 'solid'/*stroke-dasharray units*/;
export const DASHED_STROKE_STYLE = 'dashed'/*stroke-dasharray units*/;
export const DOTTED_STROKE_STYLE = 'dotted'/*stroke-dasharray units*/;

export const ARCHITECT_ROUGHNESS = 0/*roughjs units*/;
export const ARTIST_ROUGHNESS = 1/*roughjs units*/;
export const CARTOONIST_ROUGHNESS = 2/*roughjs units*/;

// .. Sizes .......................................................................
export const SHAPE_SELECTION_PADDING = 10/*svgViewBoxUnits*/;
export const MIN_RESIZER_DISTANCE = 100/*svgViewBoxUnits - T&E*/;
export const RESIZER_SIDE_LENGTH = 7.5/*T&E*/;
export const ROTATOR_DISTANCE = RESIZER_SIDE_LENGTH + (2 * SHAPE_SELECTION_PADDING)/*T&E*/;
export const ROTATOR_RADIUS = 4/*T&E*/;

// -- Style -----------------------------------------------------------------------
export const visibleSelectionStyle: CSSStyle = {
  'visibility': 'visible',

  'fill': 'transparent',
  'stroke': 'black',
  'stroke-width': '2px',
  'stroke-dasharray': '9',
  'opacity': '1',
} as const;

export const hiddenSelectionStyle: CSSStyle = {
  ...visibleSelectionStyle,

  // NOTE: because hit-testing is performed against the selection layer
  //       (specifically, this style), the selection *must* remain 'visible'
  //       so that hit-testing occurs but is transparent
  'stroke': 'transparent',
} as const;

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  roughness: ARTIST_ROUGHNESS,

  stroke: '#000000'/*black*/,
  strokeWidth: THIN_STROKE_WIDTH,
  strokeStyle: 'solid',

  fill: '#000000'/*black*/,
  fillStyle: 'hachure',

  opacity: 0.5,
} as const;


export const strokeColors: Color[][] = [
  [
    { name: 'black', hexCode: '#000000', hslCode: '0% 0% 0%', key: '1' },
    { name: 'blackGrey1', hexCode: '#343A40', hslCode: '210, 10%, 23%', key: '2' },
    { name: 'blackGrey2', hexCode: '#495057', hslCode: '210, 9%, 31%', key: '3' },
    { name: 'red1', hexCode: '#C92A2A', hslCode: '0, 65%, 48%', key: '4' },
    { name: 'purple1', hexCode: '#A61E4D', hslCode: '339, 69%, 38%', key: '5' },
  ],
  [
    { name: 'purple2', hexCode: '#862E9C', hslCode: '288, 54%, 40%', key: 'q' },
    { name: 'purple3', hexCode: '#5F3DC4', hslCode: '255, 53%, 50%', key: 'w' },
    { name: 'blue1', hexCode: '#364FC7', hslCode: '230, 57%, 50%', key: 'e' },
    { name: 'blue2', hexCode: '#1864AB', hslCode: '209, 75%, 38%', key: 'r' },
    { name: 'cyan1', hexCode: '#0B7285', hslCode: '189, 85%, 28%', key: 't' },
  ],
  [
    { name: 'green1', hexCode: '#087F5B', hslCode: '162, 88%, 26%', key: 'a' },
    { name: 'green2', hexCode: '#2B8A3E', hslCode: '132, 52%, 35%', key: 's' },
    { name: 'green3', hexCode: '#5C940D', hslCode: '85, 84%, 32%', key: 'd' },
    { name: 'orange1', hexCode: '#E67700', hslCode: '31, 100%, 45%', key: 'f' },
    { name: 'orange2', hexCode: '#D9480F', hslCode: '17, 87%, 45%', key: 'g' },
  ],
];

export const fillColors: Color[][] = [
  [
    { name: 'transparent', hexCode: 'transparent', hslCode: '0% 0% 0%', key: '1' },
    { name: 'grey1', hexCode: '#CED4DA', hslCode: '210, 14%, 83%', key: '2' },
    { name: 'grey2', hexCode: '#868E96', hslCode: '210, 9%, 31%', key: '3' },
    { name: 'pink1', hexCode: '#FA5252', hslCode: '0, 94%, 65%', key: '4' },
    { name: 'pink2', hexCode: '#E64980', hslCode: '339, 76%, 59%', key: '5' },
  ],
  [
    { name: 'purple1', hexCode: '#BE4BDB', hslCode: '288, 67%, 58%', key: 'q' },
    { name: 'purple2', hexCode: '#7950F2', hslCode: '255, 86%, 63%', key: 'w' },
    { name: 'blue1', hexCode: '#4C6EF5', hslCode: '228, 89%, 63%', key: 'e' },
    { name: 'blue2', hexCode: '#228BE6', hslCode: '208, 80%, 52%', key: 'r' },
    { name: 'cyan', hexCode: '#15AABF', hslCode: '187, 80%, 42%', key: 't' },
  ],
  [
    { name: 'green1', hexCode: '#12B886', hslCode: '162, 82%, 40%', key: 'a' },
    { name: 'green2', hexCode: '#40C057', hslCode: '131, 50%, 50%', key: 's' },
    { name: 'green3', hexCode: '#82C91E', hslCode: '85, 74%, 45%', key: 'd' },
    { name: 'orange1', hexCode: '#FAB005', hslCode: '42, 96%, 50%', key: 'f' },
    { name: 'orange2', hexCode: '#FD7E14', hslCode: '27, 98%, 54%', key: 'g' },
  ],
];

// -- RoughJS ---------------------------------------------------------------------
export const ROUGHJS_SEED = 870349/*no particular significance -- just must be >0*/;

