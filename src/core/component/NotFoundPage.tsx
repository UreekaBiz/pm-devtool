import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { notebookRoutes } from 'core/routes';

// ******************************************************************************************
interface Props { warningMessage?: string; }
export const NotFoundPage: React.FC<Props> = ({ warningMessage }) => {
  const navigate = useNavigate();
  return (
    <Flex alignItems='center' flexDirection='column' justifyContent='center' width='100wh' height='105vh' backgroundColor='gray.200'>
      <Box textAlign='center' paddingX={6} paddingY={10}>
        {/* WIP: Commented while removing chakra-ui/icons <WarningTwoIcon boxSize='50px' color='orange.300' /> */}
        <Heading as='h2' marginBottom={2} marginTop={6} size='xl'>404</Heading>
        <Text color='gray.500'>{warningMessage ? warningMessage : 'The Requested URL was not found on this server'}</Text>
        <Button marginTop={5} onClick={() => navigate(`/${notebookRoutes.root}`)}>Go back to main page</Button>
      </Box>
    </Flex>
  );
};
