import { SideBarLayout } from 'core/layout/SideBarLayout';
import { NotebookProvider } from 'notebookEditor/context/NotebookProvider';
import { SideBar } from 'notebookEditor/toolbar/component/SideBar';

import { Editor } from './Editor';
import { EditorValidator } from './EditorValidator';

// ********************************************************************************
export const NotebookEditorPage = () => (
  <NotebookProvider>
    <EditorValidator>
      <SideBarLayout sidebar={<SideBar />}>
        <Editor />
      </SideBarLayout>
    </EditorValidator>
  </NotebookProvider>
);
