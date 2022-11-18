
import { SideBarLayout } from 'core/layout/SideBarLayout';
import { EditorProvider } from 'notebookEditor/context/EditorProvider';
import { SideBar } from 'notebookEditor/toolbar/component/SideBar';

import { Editor } from './Editor';
import { EditorValidator } from './EditorValidator';

// ********************************************************************************
// == Component ===================================================================
export const EditorPage = () => (
  <EditorProvider>
    <EditorValidator>
      <SideBarLayout sidebar={<SideBar />}>
        <Editor />
      </SideBarLayout>
    </EditorValidator>
  </EditorProvider>
);
