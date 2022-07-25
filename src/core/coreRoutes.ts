// ******************************************************************************************
const root = '/' as const;

export const coreRoutes = {
  root,
  matchAny: '*',

  notebook: 'notebook',
} as const;
