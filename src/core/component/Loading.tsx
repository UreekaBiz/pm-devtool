import { Flex, FlexProps, Spinner } from '@chakra-ui/react';

// ********************************************************************************
interface Props { inFlexContainer?: boolean; }
export const Loading: React.FC<Props> = ({ inFlexContainer }) => {
  const flexContainerProps: Partial<FlexProps> = inFlexContainer ? { flex: '1 1' } : { width: 'full', height: 'full' };

  return (
    <Flex alignItems='center' {...flexContainerProps} justifyContent='center'>
      <Spinner />
    </Flex>
  );
};
