import { Flex, FlexProps, Text } from '@chakra-ui/react';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends FlexProps { name: string; }

// == Component ===================================================================
export const ToolContainer: React.FC<Props> = ({ name, width, marginTop, children }) =>
  <Flex flexDir='column' width={width} marginTop={marginTop}>
    <Text fontSize='16px'>{name}</Text>
    <Flex gap={1}>
      {children}
    </Flex>
  </Flex>;
