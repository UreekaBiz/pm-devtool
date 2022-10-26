import { Loading } from 'core/component/Loading';
import { useNotebookAPI } from 'notebookEditor/hook/useNotebookAPI';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const NotebookAPIValidator: React.FC<Props> = ({ children }) => {
  const { notebookAPI } = useNotebookAPI();
  if(!notebookAPI) return <Loading />/*not initialized yet*/;

  return <>{ children }</>;
};
