import { AttributeType, isBlockquoteNode, NodeName, updateSingleNodeAttributesCommand } from 'common';

import { InputWithUnitTool } from 'notebookEditor/extension/shared/component/InputWithUnitToolItem/InputWithUnitTool';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
export const BlockquoteBorderLeftWidthToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.view.state;
  const { $anchor } = selection;

  const blockquoteNode = $anchor.node(depth);
  if(!isBlockquoteNode(blockquoteNode)) throw new Error(`Invalid BlockquoteBorderLeftWidthToolItem render: ${JSON.stringify(selection)}`);

  // -- Handler -------------------------------------------------------------------
  const handleChange = (value: string) => {
    updateSingleNodeAttributesCommand(NodeName.BLOCKQUOTE, $anchor.before(depth)/*the Blockquote itself*/, { [AttributeType.BorderLeft]: value })(editor.view.state, editor.view.dispatch);
    editor.view.focus();
  };

  // -- UI ------------------------------------------------------------------------
  const value = blockquoteNode.attrs[AttributeType.BorderLeft] ?? ''/*none*/;
  return (
    <InputWithUnitTool
      name='Border Width'
      value={value}
      onChange={handleChange}
    />
  );
};
