import { Loading } from 'core/component/Loading';
import { useNotebookEditor } from 'notebookEditor/hook/useNotebookEditor';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const EditorValidator: React.FC<Props> = ({ children }) => {
  const { editor } = useNotebookEditor();
  if(!editor) return <Loading />/*not initialized yet*/;

  return <>{ children }</>;
};
