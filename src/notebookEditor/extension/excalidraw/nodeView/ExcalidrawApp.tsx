import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { EditorView } from 'prosemirror-view';
import { useEffect, useRef } from 'react';

import { defaultExcalidrawElements, getPosType, AttributeType, ExcalidrawNodeType, EXCALIDRAW_WRAPPER_CLASS } from 'common';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  view: EditorView;
  getPos: getPosType;
  node: ExcalidrawNodeType;
}

// == Component ===================================================================
export const ExcalidrawApp: React.FC<Props> = ({ view, getPos, node }) => {
  // -- Ref -----------------------------------------------------------------------
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null/*default*/),
        excalidrawRef = useRef<ExcalidrawImperativeAPI>(null/*default*/);

  // -- Effect --------------------------------------------------------------------
  useEffect(() => {
    const { current } = excalidrawRef;
    if(!current) return;

    current.updateScene(fromNodeAttrs(node));

  }, [excalidrawRef, node]);

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
      />
    </div>
  );
};

// == Util ========================================================================
const fromNodeAttrs = (node: ExcalidrawNodeType) => ({ elements: JSON.parse(node.attrs[AttributeType.ExcalidrawElements] ?? defaultExcalidrawElements) });
