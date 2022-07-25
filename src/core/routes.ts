import { coreRoutes } from './coreRoutes';

// ********************************************************************************
const root = coreRoutes.notebook;

export const notebookRoutes = {
  root,
  router: `${root}/${coreRoutes.matchAny}`,

  notebook: ':notebookId',

  editPrefix: 'edit',
} as const;
