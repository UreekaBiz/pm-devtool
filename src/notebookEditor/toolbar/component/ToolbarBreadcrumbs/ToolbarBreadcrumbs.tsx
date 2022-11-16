import { Flex } from '@chakra-ui/react';

import { getAllAscendantsFromSelection, getMarkName, getNodeName, isTextNode, SelectionDepth } from 'common';

import { getAllMarksFromSelection } from 'notebookEditor/extension/util';
import { useValidatedEditor } from 'notebookEditor/hook/useValidatedEditor';
import { getMarkToolbar, getNodeToolbar } from 'notebookEditor/toolbar/toolbar';
import { shouldShowToolbarOrBreadcrumb } from 'notebookEditor/toolbar/util';

import { ToolbarBreadcrumbItem } from './ToolbarBreadcrumbItem';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  onSelection: (depth: SelectionDepth) => void;
  selectedDepth: SelectionDepth;
}

// == Component ===================================================================
export const ToolbarBreadcrumbs: React.FC<Props> = ({ onSelection, selectedDepth }) => {
  const editor = useValidatedEditor();

  const breadCrumbItems: JSX.Element[] = [];

  const marks = getAllMarksFromSelection(editor.view.state);
  marks.forEach((mark, i) => {
    if(!mark) return /*nothing to do*/;
    const markName = getMarkName(mark);
    const depth = undefined;/*leaf node by definition*/
    const toolbar = getMarkToolbar(mark);

    if(!toolbar) return/*no corresponding toolbar for this mark*/;

    breadCrumbItems.push(
      <ToolbarBreadcrumbItem
        key={`${markName}-${i}`}/*expected to be unique*/
        depth={depth}
        isSelected={selectedDepth === depth}
        toolbar={toolbar}
        onSelection={onSelection}
      />
    );
    return/*nothing else to do*/;
  });

  const ascendantsNodes = getAllAscendantsFromSelection(editor.view.state);
  ascendantsNodes.forEach((node, i) => {
    if(!node || isTextNode(node)/*don't display text nodes*/) return/*nothing to do*/;
    const nodeName = getNodeName(node);
    const depth = i === 0 ? undefined/*leaf node*/ : ascendantsNodes.length - i - 1;
    const toolbar = getNodeToolbar(node);

    if(!toolbar) return/*no corresponding toolbar for this node*/;

    if(!shouldShowToolbarOrBreadcrumb(editor, toolbar, depth)) return/*continue*/;

    breadCrumbItems.push(
      <ToolbarBreadcrumbItem
        key={`${nodeName}-${i}`}/*expected to be unique*/
        depth={depth}
        isSelected={selectedDepth === depth}
        toolbar={toolbar}
        onSelection={onSelection}
      />
    );
    return/*nothing else to do*/;
  });

  return <Flex width='100%' overflowX='auto' padding={2}>{breadCrumbItems}</Flex>;
};
