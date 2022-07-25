import { Flex, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

// ********************************************************************************
interface Props {
  toolTitle: string;
  width: string;
  children: ReactNode;
}
export const ToolContainer = ({ toolTitle, width, children }: Props) =>
  <Flex flexDir={'column'} width={width}>
    <Text fontSize={'14px'}>{toolTitle}</Text>
    <Flex gap={1}>
      {children}
    </Flex>
  </Flex>;
