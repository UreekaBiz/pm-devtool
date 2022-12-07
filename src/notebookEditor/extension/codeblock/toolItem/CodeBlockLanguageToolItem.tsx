import { isCodeBlockNode, AttributeType, CodeBlockLanguage, NodeName, SetTextSelectionDocumentUpdate, UpdateSingleNodeAttributesDocumentUpdate } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { DropdownTool, DropdownToolItemType } from 'notebookEditor/extension/shared/component/DropdownToolItem/DropdownTool';
import { InputToolItemContainer } from 'notebookEditor/extension/shared/component/InputToolItemContainer';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Constant ====================================================================
const options: DropdownToolItemType[] = Object.entries(CodeBlockLanguage).reduce<DropdownToolItemType[]>((options, currentCodeBlockLanguage) => {
  options.push({ value: currentCodeBlockLanguage[1/*the enum value*/], label: currentCodeBlockLanguage[0/*the enum name*/] });
  return options;
}, [/*default empty*/]);

// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}
export const CodeBlockLanguageToolItem: React.FC<Props> = ({ editor }) => {
  const { $anchor, anchor } = editor.view.state.selection;
  const parentNode = $anchor.parent;
  if(!isCodeBlockNode(parentNode)) throw new Error('Invalid CodeBlock WrapTool Render');

  const type = parentNode.attrs[AttributeType.Language] ?? CodeBlockLanguage.JavaScript/*default*/;

  // -- Handler -------------------------------------------------------------------
  const handleChange = (language: string) => {
    // (SEE: CodeBlock.ts)
    applyDocumentUpdates(editor, [
      new UpdateSingleNodeAttributesDocumentUpdate(NodeName.CODEBLOCK, anchor - $anchor.parentOffset - 1/*the CodeBlock itself*/, { [AttributeType.Language]: language }),
      new SetTextSelectionDocumentUpdate({ from: anchor, to: anchor }),
    ]);
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <InputToolItemContainer name='Language'>
      <DropdownTool value={type} options={options} placeholder='Type' onChange={handleChange}/>
    </InputToolItemContainer>
  );
};
