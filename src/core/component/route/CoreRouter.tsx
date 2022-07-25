import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { notebookRoutes } from 'core/routes';

import { NotebookRouter } from './NotebookRouter';
import { NotFoundPage } from '../NotFoundPage';

// ********************************************************************************
export const CoreRouter: React.FC = () =>
  <BrowserRouter>
    <Routes>
      <Route index element={<Navigate to={notebookRoutes.root} />} />
      <Route path={notebookRoutes.router} element={<NotebookRouter />} />

      {/* Match any route that wast not catch be previous routes */}
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>;
