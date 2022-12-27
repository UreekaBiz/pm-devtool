import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { useEffect, useRef } from 'react';

import { defaultExcalidrawAppState, defaultExcalidrawElements, AttributeType, ExcalidrawNodeType, EXCALIDRAW_WRAPPER_CLASS } from 'common';

// ********************************************************************************
// == Interface ===================================================================
interface Props { node: ExcalidrawNodeType; }

// == Component ===================================================================
export const ExcalidrawApp: React.FC<Props> = ({ node }) => {
  // -- Ref -----------------------------------------------------------------------
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null/*default*/),
        excalidrawRef = useRef<ExcalidrawImperativeAPI>(null/*default*/);

  // -- Effect --------------------------------------------------------------------
  useEffect(() => {
    const { current } = excalidrawRef;
    if(!current) return;

    current.updateScene(getExcalidrawElements(node));

  }, [excalidrawRef, node]);

  // -- UI -------------------------------------------------------------------
  return (
    <div
      className={EXCALIDRAW_WRAPPER_CLASS}
      ref={excalidrawWrapperRef}
    >
      <Excalidraw
        ref={excalidrawRef}
        initialData={getExcalidrawElements(node)}
        zenModeEnabled={true/*do not show left-controls*/}
      />
    </div>
  );
};

// == Util ========================================================================
// TODO: move somewhere else
export const getExcalidrawElements = (node: ExcalidrawNodeType) => {
  return {
    elements: JSON.parse(node.attrs[AttributeType.ExcalidrawElements] ?? defaultExcalidrawElements),
    appState: JSON.parse(node.attrs[AttributeType.ExcalidrawState] ?? defaultExcalidrawAppState),
  };
};
