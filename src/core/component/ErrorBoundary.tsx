import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { notebookRoutes } from 'core/routes';

// ********************************************************************************
// REF: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/error_boundaries/
interface Props {
  /**
   * Component to display when children had an error. If no value is provided a
   * default screen with a message is displayed.
   */
  errorComponent?: ReactNode;
  children: ReactNode; }
interface State { hasError: boolean; redirect: boolean; }
class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false/*no error by default*/, redirect: false/*no redirection by default*/ };

  // ==============================================================================
  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true/*by definition*/, redirect: false/*set to true on button click*/ };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('Error rendering react component:', error, errorInfo); }

  // == Visuals ===================================================================
  public render() {
    if(!this.state.hasError) return this.props.children;

    // Return error component if present on the props.
    if(this.props.errorComponent !== undefined) return this.props.errorComponent;

    // Use default screen
    return (
      <Flex alignItems='center' flexDirection='column' justifyContent='center' width='100wh' height='105vh' backgroundColor='gray.200'>
        <Box textAlign='center' paddingX={6} paddingY={10}>
          {/* WIP: Commented while removing chakra-ui/icons <WarningTwoIcon boxSize='50px' color='red' /> */}
          <Heading as='h1' marginBottom={2} marginTop={6} size='xl'>Error</Heading>
          <Text color='gray.500'>There was an error loading the App</Text>
          <Button marginTop={5} onClick={ () => this.setState({ hasError: true, redirect: true })}>Go back to main page</Button>
          { this.state.redirect && <Navigate to={`/${notebookRoutes.root}`} replace={true} />/*will redirect when rendered*/ }
        </Box>
      </Flex>
    );
  }
}

export default ErrorBoundary;
