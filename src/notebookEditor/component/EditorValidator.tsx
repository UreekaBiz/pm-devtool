import { Loading } from 'core';
import { useEditor } from 'notebookEditor/hook/useEditor';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorValidator: React.FC<Props> = ({ children }) => {
  const { editor } = useEditor();
  if(!editor) return <Loading />/*not initialized yet*/;

  return <>{children}</>;
};
