import { Flex, FlexProps, Spinner } from '@chakra-ui/react';

// ********************************************************************************
// == Interface ===================================================================
interface Props { inFlexContainer?: boolean; }

// == Component ===================================================================
export const Loading: React.FC<Props> = ({ inFlexContainer }) => {
  const flexContainerProps: Partial<FlexProps> = inFlexContainer ? { flex: '1 1' } : { width: 'full', height: 'full' };

  // -- UI ------------------------------------------------------------------------
  return (
    <Flex alignItems='center' {...flexContainerProps} justifyContent='center'>
      <Spinner />
    </Flex>
  );
};
