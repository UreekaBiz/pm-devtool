import { SideBarLayout } from 'core/layout/SideBarLayout';
import { NotebookEditorProvider } from 'notebookEditor/context/NotebookEditorProvider';
import { SideBar } from 'notebookEditor/toolbar/component/SideBar';

import { Editor } from './Editor';
import { EditorValidator } from './EditorValidator';

// ********************************************************************************
export const NotebookEditorPage = () => (
  <NotebookEditorProvider>
    <EditorValidator>
      <SideBarLayout sidebar={<SideBar />}>
        <Editor />
      </SideBarLayout>
    </EditorValidator>
  </NotebookEditorProvider>
);
