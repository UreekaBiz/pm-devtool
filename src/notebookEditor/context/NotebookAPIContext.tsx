import { createContext } from 'react';

import { NotebookAPI } from 'notebookEditor/API/NotebookAPI';

// ********************************************************************************
// == State =======================================================================
export type NotebookEditorState = Readonly<{ notebookAPI: NotebookAPI | null/*not initialized*/; }>;

// == Context =====================================================================
export const NotebookAPIContext = createContext<NotebookEditorState>({ notebookAPI: null/*not initialized by default*/ });
             NotebookAPIContext.displayName = 'NotebookAPIContext';
