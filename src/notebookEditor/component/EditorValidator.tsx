import { Loading } from 'core/component/Loading';

import { useEditorContext } from 'notebookEditor/editor/component/useEditorContext';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorValidator: React.FC<Props> = ({ children }) => {
  const { editor } = useEditorContext();
  if(!editor) return <Loading />/*not initialized yet*/;

  return <>{children}</>;
};
