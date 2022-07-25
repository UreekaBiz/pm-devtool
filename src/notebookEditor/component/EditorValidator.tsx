import { Loading } from 'core/component/Loading';
import { useNotebook } from 'notebookEditor/hook/useNotebook';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const EditorValidator: React.FC<Props> = ({ children }) => {
  const { editor } = useNotebook();
  if(!editor) return <Loading />/*not initialized yet*/;

  return <>{ children }</>;
};
