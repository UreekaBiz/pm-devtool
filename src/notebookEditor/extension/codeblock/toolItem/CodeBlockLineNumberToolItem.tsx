import { Checkbox } from '@chakra-ui/react';

import { isCodeBlockNode, updateSingleNodeAttributesCommand, AttributeType, NodeName, AncestorDepth, CODEBLOCK_DEFAULT_LINES } from 'common';
import { InputToolItemContainer } from 'notebookEditor/extension/shared/InputToolItemContainer';

import { EditorToolComponentProps, TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const CodeBlockLineNumberToolItem: React.FC<Props> = ({ editor  }) => {
  const { $from } = editor.view.state.selection;
  const codeBlock = $from.node(AncestorDepth.GrandParent),
        codeBlockPos = $from.before(AncestorDepth.GrandParent);
  if(!isCodeBlockNode(codeBlock)) throw new Error('Invalid CodeBlock WrapTool Render');

  const showLines = codeBlock.attrs[AttributeType.Lines] ?? CODEBLOCK_DEFAULT_LINES;

  // -- Handler -------------------------------------------------------------------
  const handleChange = (showLines: boolean) => {
    updateSingleNodeAttributesCommand(NodeName.CODEBLOCK, codeBlockPos, { [AttributeType.Lines]: showLines })(editor.view.state, editor.view.dispatch);
    editor.view.focus();
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <InputToolItemContainer name='Line Numbers'>
      <Checkbox
        isChecked={showLines}
        datatype={TOOL_ITEM_DATA_TYPE/*(SEE: notebookEditor/sidebar/toolbar/type )*/}
        onChange={() => handleChange(!showLines)}
      >
        Line Numbers
      </Checkbox>
    </InputToolItemContainer>
  );
};
