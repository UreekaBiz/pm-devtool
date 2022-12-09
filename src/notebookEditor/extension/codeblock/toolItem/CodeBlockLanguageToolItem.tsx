import { isCodeBlockNode, AttributeType, NodeName, CodeBlockLanguage, updateAttributesCommand } from 'common';

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

// == Component ===================================================================
export const CodeBlockLanguageToolItem: React.FC<Props> = ({ editor }) => {
  const { $anchor } = editor.view.state.selection;
  const parentNode = $anchor.parent;
  if(!isCodeBlockNode(parentNode)) throw new Error('Invalid CodeBlock WrapTool Render');

  const language = parentNode.attrs[AttributeType.Language] ?? CodeBlockLanguage.JavaScript/*default*/;

  // -- Handler -------------------------------------------------------------------
  const handleChange = (language: string) => {
    // NOTE: not using SingleAttributesDocumentUpdate since a new affected
    //       CodeBlock range change must be triggered (SEE: ../plugin.ts)
    updateAttributesCommand(NodeName.CODEBLOCK, { [AttributeType.Language]: language })(editor.view.state, editor.view.dispatch);
    editor.view.focus();
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <InputToolItemContainer name='Language'>
      <DropdownTool value={language} options={options} placeholder='Language' onChange={handleChange}/>
    </InputToolItemContainer>
  );
};


