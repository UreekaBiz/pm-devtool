import { Box } from '@chakra-ui/react';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const FullPageLayout: React.FC<Props> = ({ children }) =>
  <Box
    position='relative'
    width='100vw'
    height='100vh'
    overflowX='auto'
    overflowY='auto'
  >
    {children}
  </Box>;
