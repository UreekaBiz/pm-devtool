import { Flex, Text } from '@chakra-ui/react';

import { SelectionDepth } from 'common';

import { Toolbar } from 'notebookEditor/toolbar/type';
import { useValidatedEditor } from 'notebookEditor/hook/useValidatedEditor';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  depth: SelectionDepth;
  isSelected: boolean;
  toolbar: Toolbar;

  onSelection: (depth: SelectionDepth) => void;
}

// == Component ===================================================================
export const ToolbarBreadcrumbItem: React.FC<Props> = ({ depth, toolbar, isSelected, onSelection }) => {
  const notebookAPI = useValidatedEditor();
  if(toolbar.shouldShow && !toolbar.shouldShow(notebookAPI, depth)) return null/*don't show this breadcrumb*/;

  // -- Handler -------------------------------------------------------------------
  const handleClick = () => onSelection(depth);

  // -- UI ------------------------------------------------------------------------
  return (
    <Flex onClick={handleClick}>
      <Text textTransform='capitalize' fontWeight={isSelected ? 600 : 400}>{toolbar.title}</Text>
      {depth !== 0 && <Text marginX={1}>{'>'}</Text>}
    </Flex>
  );
};
