import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { EditorView } from 'prosemirror-view';
import { useEffect, useRef } from 'react';

import { defaultExcalidrawElements, isNodeSelection, isExcalidrawNode, AttributeType, ExcalidrawNodeType, EXCALIDRAW_WRAPPER_CLASS } from 'common';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  view: EditorView;
  node: ExcalidrawNodeType;
}

// == Component ===================================================================
export const ExcalidrawApp: React.FC<Props> = ({ view, node }) => {
  // -- Ref -----------------------------------------------------------------------
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null/*default*/),
        excalidrawRef = useRef<ExcalidrawImperativeAPI>(null/*default*/);

  // -- Effect --------------------------------------------------------------------
  useEffect(() => {
    const { current } = excalidrawRef;
    if(!current) return;

    current.updateScene(fromNodeAttrs(node));

  }, [excalidrawRef, node]);

  // -- Handler -------------------------------------------------------------------
  const handleChange = (node: ExcalidrawNodeType, elements: readonly ExcalidrawElement[]) => {
    const { selection } = view.state;
    if(!isNodeSelection(selection) || !isExcalidrawNode(selection.node)) return/*nothing to do*/;
    view.dispatch(view.state.tr.setNodeMarkup(selection.from, undefined/*maintain type*/, { ...node.attrs, ...toNodeAttrs(elements) }));
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <div
      className={EXCALIDRAW_WRAPPER_CLASS}
      ref={excalidrawWrapperRef}
    >
      <Excalidraw
        ref={excalidrawRef}
        initialData={fromNodeAttrs(node)}
        zenModeEnabled={true/*do not show left-controls*/}
        onChange={(elements, appState) => handleChange(node, elements)}
      />
    </div>
  );
};

// == Util ========================================================================
const fromNodeAttrs = (node: ExcalidrawNodeType) => ({ elements: JSON.parse(node.attrs[AttributeType.ExcalidrawElements] ?? defaultExcalidrawElements) });
const toNodeAttrs = (elements: readonly ExcalidrawElement[]) => ({ [AttributeType.ExcalidrawElements]: JSON.stringify(elements) });
