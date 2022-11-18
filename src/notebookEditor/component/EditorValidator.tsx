import { Loading } from 'core/component/Loading';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorValidator: React.FC<Props> = ({ children }) => {
  const { editor } = useEditor();
  if(!editor) return <Loading />/*not initialized yet*/;

  return <>{children}</>;
};
