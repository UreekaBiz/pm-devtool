import { getMarkAttributes, isLinkMarkAttributes, AttributeType, ExtendMarkRangeDocumentUpdate, LinkTarget, MarkName, SetTextSelectionDocumentUpdate } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { DropdownTool, DropdownToolItemType } from 'notebookEditor/extension/shared/component/DropdownToolItem/DropdownTool';
import { InputToolItemContainer } from 'notebookEditor/extension/shared/InputToolItemContainer';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

import { SetLinkDocumentUpdate } from '../../command';
import { getReadableLinkTarget } from '../../util';

// ********************************************************************************
// == Constant ====================================================================
const targetOptions: DropdownToolItemType[] = Object.entries(LinkTarget).map(([key, value]) => ({ label: getReadableLinkTarget(value), value: value }));

// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
// NOTE: Using custom ToolItem Component instead of using the DropdownToolItem
//       since the Link must be updated with custom meta tags and cannot work with
//       default behavior.
export const LinkTargetToolItem: React.FC<Props> = ({ editor }) => {
  const attrs = getMarkAttributes(editor.view.state, MarkName.LINK);
  if(!isLinkMarkAttributes(attrs)) return null/*nothing to render*/;
  const value = attrs[AttributeType.Target] ?? ''/*default none*/;

  // == Handler ===================================================================
  const handleChange = (target: string) => {
    const { anchor: prevPos } = editor.view.state.selection;

    applyDocumentUpdates(editor, [
      new ExtendMarkRangeDocumentUpdate(MarkName.LINK, {/*no attributes*/}),
      new SetLinkDocumentUpdate({ ...attrs, [AttributeType.Target]: target as LinkTarget/*as defined above*/ }),
      new SetTextSelectionDocumentUpdate({ from: prevPos, to: prevPos }),
    ]);

    // focus the editor again
    editor.view.focus();
  };

  // == UI ========================================================================
  return (
    <InputToolItemContainer name='Target'>
      <DropdownTool value={value} options={targetOptions} placeholder='Target' onChange={handleChange}/>
    </InputToolItemContainer>
  );
};
