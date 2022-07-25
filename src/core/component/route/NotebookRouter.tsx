import { Route, Routes } from 'react-router-dom';

import { NotebookEditorPage } from 'notebookEditor/component/NotebookEditorPage';

// ********************************************************************************
export const NotebookRouter = () =>
  <Routes>
    <Route index element={<NotebookEditorPage />} />
  </Routes>;
