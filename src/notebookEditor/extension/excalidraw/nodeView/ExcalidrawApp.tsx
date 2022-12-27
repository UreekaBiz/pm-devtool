import { Excalidraw } from '@excalidraw/excalidraw';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { EditorView } from 'prosemirror-view';
import { useRef } from 'react';

import { ExcalidrawNodeType, EXCALIDRAW_WRAPPER_CLASS } from 'common';

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

  // -- UI ------------------------------------------------------------------------
  return (
    <div
      className={EXCALIDRAW_WRAPPER_CLASS}
      ref={excalidrawWrapperRef}
    >
      <Excalidraw
        ref={excalidrawRef}
        zenModeEnabled={true/*do not show left-controls*/}
      />
    </div>
  );
};
