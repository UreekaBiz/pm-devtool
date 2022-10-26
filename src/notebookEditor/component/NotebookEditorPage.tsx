import { SideBarLayout } from 'core/layout/SideBarLayout';

// ********************************************************************************
export const NotebookEditorPage = () => (
  // <NotebookEditorProvider>
  //   <EditorValidator>
      <SideBarLayout sidebar={<div>sidebar</div>}>
        {/* <Editor /> */}
      </SideBarLayout>
  //   </EditorValidator>
  // </NotebookEditorProvider>
);
