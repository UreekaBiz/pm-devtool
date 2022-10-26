import { SideBarLayout } from 'core';

import { EditorProvider } from 'notebookEditor/context';

import { Editor } from './Editor';
import { EditorValidator } from './EditorValidator';

// ********************************************************************************
// == Component ===================================================================
export const EditorPage = () => (
  <EditorProvider>
    <EditorValidator>
      <SideBarLayout sidebar={<div>sidebar</div>}>
        <Editor />
      </SideBarLayout>
    </EditorValidator>
  </EditorProvider>
);
