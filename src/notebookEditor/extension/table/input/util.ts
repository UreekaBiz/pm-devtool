import { EditorView } from 'prosemirror-view';

import { cellAround, isTextSelection, TableRole, TD_NODENAME, TH_NODENAME } from 'common';

import { isValidHTMLElement } from '../../util';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L231
// check whether the cursor is at the end of a Cell (such that further
// motion would move out of it)
export const isCursorAtEndOfCell = (view: EditorView, axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/) => {
  if(!isTextSelection(view.state.selection)) return null/*nothing to do*/;

  const { $head } = view.state.selection;
  for(let depth = $head.depth - 1; depth >= 0; depth--) {
    let ancestorNode = $head.node(depth);

    let index = direction < 0 ? $head.index(depth) : $head.indexAfter(depth);
    if(index !== (direction < 0 ? 0/*first child*/ : ancestorNode.childCount)) return null/*nothing to do*/;

    if(ancestorNode.type.spec.tableRole === TableRole.Cell || ancestorNode.type.spec.tableRole == TableRole.HeaderCell) {
      const cellPos = $head.before(depth);
      const directionString: 'left' | 'right' | 'up' | 'down' = axis === 'vertical' ? (direction > 0 ? 'down' : 'up') : direction > 0 ? 'right' : 'left';

      return view.endOfTextblock(directionString) ? cellPos : null;
    } /* else -- parent is not a Cell or a HeaderCell */
  }

  return null/*not at end of Cell*/;
};

// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L251
export const getDOMNodeInCell = (view: EditorView, dom: HTMLElement | false | null) => {
  for(; dom && dom !== view.dom; dom = dom.parentNode && isValidHTMLElement(dom.parentNode) && dom.parentNode) {
    if(dom.nodeName === TD_NODENAME || dom.nodeName == TH_NODENAME) return dom/*found a Cell or HeaderCell DOMNode*/;
  } /* else -- keep looking upwards through the View */

  return/*undefined*/;
};

// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L256
export const isCellUnderMouse = (view: EditorView, event: Event | MouseEvent) => {
  if(!isValidMouseEvent(event)) return null/*not a valid Event*/;

  const mousePos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!mousePos) return null/*no valid ViewPos at mousePos*/;

  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null/*no Cell under mousePos*/;
};

// == Type Guard ==================================================================
const isValidMouseEvent = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

