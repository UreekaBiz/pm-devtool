import { Mark as ProseMirrorMark } from 'prosemirror-model';

import { camelToTitleCase, MarkName } from 'common';

import { Toolbar, ToolItem } from '../type';
import { UNIQUE_TOOL_ITEMS } from './uniqueToolItem';

// ********************************************************************************
/** get a {@link Toolbar} for the given {@link ProseMirrorMark} */
export const buildMarkToolbar = (mark: ProseMirrorMark): Toolbar | null => {
  const toolCollections = buildMarkToolCollections(mark);
  if(toolCollections.length < 1) return null/*do not show on Toolbar*/;

  return {
    title: camelToTitleCase(mark.type.name),
    name: mark.type.name as MarkName/*by definition*/,
    toolsCollections: buildMarkToolCollections(mark).filter(collection => collection.length > 0/*not empty*/),
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorMark}
 * based on its characteristics
 */
const buildMarkToolCollections = (mark: ProseMirrorMark): ToolItem[][] => {
  const toolCollections: ToolItem[][] = [];
  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[mark.type.name as MarkName/*by definition*/];

  if(uniqueToolItemsObj && uniqueToolItemsObj.items.length > 0) {
    toolCollections.push(uniqueToolItemsObj.items);
  } /* else -- no unique ToolItems for Mark or entry is empty */

  return toolCollections;
};

