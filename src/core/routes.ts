import { coreRoutes } from './coreRoutes';

// ********************************************************************************
const root = coreRoutes.notebook;

export const notebookRoutes = {
  root,
  router: `${root}/${coreRoutes.matchAny}`,

  notebook: ':notebookId',

  editPrefix: 'edit',
} as const;

export const notebookRoute = (notebookId: string/*Temporary*/) =>
  // NOTE: '#' has to be inserted at the end since including it in the edit prefix
  //       does not count as a valid route by react router
  `/${notebookRoutes.root}/${notebookId}/${notebookRoutes.editPrefix}#`;
