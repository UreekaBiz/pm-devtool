import { NotebookAPI } from 'notebookEditor/API';

import { NotebookAPIContext } from './NotebookAPIContext';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const NotebookAPIProvider: React.FC<Props> = ({ children }) => {
  const notebookAPI = new NotebookAPI();

  // TODO: add back
  // sets the initial Theme when the component mounts
  // useEffect(() => {
  //   setThemeStylesheet()/*sync stylesheet*/;
  // }, [/*only on mount/unmount*/]);

  return <NotebookAPIContext.Provider value={{ notebookAPI }}>{children}</NotebookAPIContext.Provider>;
};
