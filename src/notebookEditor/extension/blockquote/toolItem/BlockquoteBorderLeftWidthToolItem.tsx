import { isBlockquoteNode, AttributeType, NodeName } from 'common';

import { InputWithUnitNodeToolItem } from 'notebookEditor/extension/shared/component/InputWithUnitToolItem';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
export const BlockquoteBorderLeftWidthToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.view.state;
  const { $anchor } = selection;
  if(!isBlockquoteNode($anchor.node(depth))) throw new Error(`Invalid BlockquoteBorderLeftWidthToolItem render: ${JSON.stringify(selection)}`);

  // == UI ========================================================================
  return (
    <InputWithUnitNodeToolItem
      name='Border Width'
      nodeName={NodeName.BLOCKQUOTE}
      attributeType={AttributeType.BorderLeft}
      editor={editor}
      depth={depth}
    />
  );
};
