import { SideBarLayout } from 'core';

import { NotebookAPIProvider } from 'notebookEditor/context';

import { Editor } from './Notebook';
import { NotebookAPIValidator } from './NotebookAPIValidator';

// ********************************************************************************
export const NotebookEditorPage = () => (
  <NotebookAPIProvider>
    <NotebookAPIValidator>
      <SideBarLayout sidebar={<div>sidebar</div>}>
        <Editor />
      </SideBarLayout>
    </NotebookAPIValidator>
  </NotebookAPIProvider>
);
