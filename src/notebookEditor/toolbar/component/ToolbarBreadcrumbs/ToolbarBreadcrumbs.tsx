import { Flex } from '@chakra-ui/react';

import { getAllAscendantsFromSelection, getMarkName, getNodeName, isTextNode, SelectionDepth } from 'common';

import { useValidatedEditor } from 'notebookEditor/hook/useValidatedEditor';
import { buildMarkToolbar } from 'notebookEditor/toolbar/toolbar/buildMarkToolbar';
import { buildNodeToolbar } from 'notebookEditor/toolbar/toolbar/buildNodeToolbar';
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

  const marks = editor.view.state.selection.$from.marks();
  marks.forEach((mark, i) => {
    if(!mark) return /*nothing to do*/;
    const markName = getMarkName(mark);
    const depth = undefined;/*leaf node by definition*/
    const toolbar = buildMarkToolbar(mark);

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

  const { state } = editor.view;
  const ascendantsNodes = getAllAscendantsFromSelection(state);
  ascendantsNodes.forEach((node, i) => {
    if(!node || isTextNode(node)/*don't display text nodes*/) return/*nothing to do*/;
    const nodeName = getNodeName(node);
    const depth = i === 0 ? undefined/*leaf node*/ : ascendantsNodes.length - i - 1;
    const toolbar = buildNodeToolbar(node, depth, state.selection);

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
