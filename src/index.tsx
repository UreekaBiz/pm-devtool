import { ChakraProvider } from '@chakra-ui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

// ********************************************************************************
// NOTE: if "root" does not exist then rather than throwing an explicit error, the
//       null exception is used
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ChakraProvider>
      <div>h</div>
    </ChakraProvider>
  </StrictMode>
);
