import { ChakraProvider } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';

import ErrorBoundary from 'core/component/ErrorBoundary';
import { CoreRouter } from 'core/component/route/CoreRouter';
import { FullPageLayout } from 'core/layout/FullPageLayout';

import './index.css';

// ********************************************************************************
// NOTE: if "root" does not exist then rather than throwing an explicit error, the
//       null exception is used
const root = createRoot(document.getElementById('root')!);
root.render(
  // REF: https://github.com/chakra-ui/chakra-ui/pull/6303
  // FIXME: Add StrictMode back when Chakra UI fixes the REF above, since it
  //        currently causes the tooltips and other portals to not show properly
  // NOTE:  ChakraProvider is before ErrorBoundary
  //        to ensure that error pages have consistent style
  <ChakraProvider>
    <ErrorBoundary>
      <FullPageLayout>
        <CoreRouter />
      </FullPageLayout>
    </ErrorBoundary>
  </ChakraProvider>
);
