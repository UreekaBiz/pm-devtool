import { isHorizontalRuleNode, isNodeSelection, AttributeType, NodeName } from 'common';

import { InputWithUnitNodeToolItem } from 'notebookEditor/extension/shared/component/InputWithUnitToolItem';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const HorizontalRuleHeightToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.view.state;
  if(!isNodeSelection(selection) || !isHorizontalRuleNode(selection.node)) throw new Error(`Invalid HorizontalRuleHeightToolItem render: ${JSON.stringify(selection)}`);

  // -- UI ------------------------------------------------------------------------
  return (
    <InputWithUnitNodeToolItem
      name='Height'
      nodeName={NodeName.HORIZONTAL_RULE}
      attributeType={AttributeType.Height}
      editor={editor}
      depth={depth}
    />
  );
};
