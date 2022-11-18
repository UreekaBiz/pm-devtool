import { createContext } from 'react';

import { Editor } from 'notebookEditor/editor/Editor';

// ********************************************************************************
// == State =======================================================================
export type EditorState = Readonly<{ editor: Editor | null/*not initialized*/; }>;

// == Context =====================================================================
export const EditorContext = createContext<EditorState>({ editor: null/*not initialized by default*/ });
             EditorContext.displayName = 'EditorContext';
