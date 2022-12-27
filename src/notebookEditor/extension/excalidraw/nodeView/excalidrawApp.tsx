import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { EditorView } from 'prosemirror-view';
import { useEffect, useRef } from 'react';

import { defaultExcalidrawAppState, defaultExcalidrawElements, AttributeType, ExcalidrawNodeType, EXCALIDRAW_WRAPPER_CLASS, isNodeSelection, isExcalidrawNode } from 'common';

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
  const handleChange = (elements: readonly ExcalidrawElement[], appState: AppState) => {
    const { selection } = view.state;
    if(!isNodeSelection(selection) || !isExcalidrawNode(selection.node)) return;
    view.dispatch(view.state.tr.setNodeMarkup(selection.from, undefined/*maintain type*/, toNodeAttrs(elements, appState)));
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
        onChange={(elements, appState) => handleChange(elements, appState)}
      />
    </div>
  );
};

// == Util ========================================================================
const fromNodeAttrs = (node: ExcalidrawNodeType) => {
  return {
    elements: JSON.parse(node.attrs[AttributeType.ExcalidrawElements] ?? defaultExcalidrawElements),
    appState: JSON.parse(node.attrs[AttributeType.ExcalidrawState] ?? defaultExcalidrawAppState),
  };
};

const toNodeAttrs = (elements: readonly ExcalidrawElement[], appState: AppState) => {
  return {
    [AttributeType.ExcalidrawElements]: JSON.stringify(elements),
    [AttributeType.ExcalidrawState]: JSON.stringify(appState),
  };
};
