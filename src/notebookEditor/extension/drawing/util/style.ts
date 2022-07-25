import { Options as RoughOptions } from 'roughjs/bin/core';

import { CircleStyle, CSSStyle, ShapeStyle } from '../type';

// ********************************************************************************
// == RoughJS =====================================================================
export const computeDashedLineDashed = (strokeWidth: number) => [8, 8 + strokeWidth];
export const computeDottedLineDashed = (strokeWidth: number) => [1.5, 6 + strokeWidth];

// == General Styling =============================================================
// FIXME: refactor into reduce to get into one-liner
export const toStyleString = (style: CSSStyle, excludeStyles?: string[]) => {
  let styleString = '';
  Object.entries(style).forEach(([key, value]) => {
    if(excludeStyles && excludeStyles.includes(key)) return/*skip style*/;
    styleString += `${key}: ${value}; `;
  });
  return styleString;
};

export const toCSSString = (style: ShapeStyle | CircleStyle, excludeStyles?: string[]) => {
  // TODO: refactor into reduce to get into one-liner
  let styleString = '';
  Object.entries(style).forEach(([key, value]) => {
    if(excludeStyles && excludeStyles.includes(key)) return/*skip style*/;
    styleString += `${key}: ${value}; `;
  });
  return styleString;
};

export const styleToCSSString = (style: ShapeStyle) =>
  `stroke-linecap: round;` +
  `stroke-linejoin: round;` +
  `opacity: ${style.opacity}`;

export const styleToRoughJS = (style: ShapeStyle): RoughOptions =>
({
  ...style,

  // disable multi-stroke for for non-solid strokes (T&E visual)
  disableMultiStroke: (style.strokeStyle !== 'solid'),

  // for non-solid strokes, increase the width a bit to make it visually
  // similar to solid strokes, because we're also disabling multiStroke
  // increase the stroke width for non-solid strokes (T&E visual)
  strokeWidth: (style.strokeStyle !== 'solid')
                  ? style.strokeWidth + 0.5
                  : style.strokeWidth,
  strokeLineDash: (style.strokeStyle === 'dashed')
                    ? computeDashedLineDashed(style.strokeWidth)
                    : (style.strokeStyle === 'dotted')
                        ? computeDottedLineDashed(style.strokeWidth)
                        : undefined/*solid*/,

  // T&E visual
  fillWeight: style.strokeWidth / 2,
  hachureGap: style.strokeWidth * 4,
});

export const cssVisible = (visible: boolean) => visible ? 'visible' : 'hidden';
export const colorToHexColor = (color: string): string => '#'.concat(color);
export const hexColorToColor = (hexColor: string): string => hexColor.substring(1)/*remove 1st char ('#')*/;
