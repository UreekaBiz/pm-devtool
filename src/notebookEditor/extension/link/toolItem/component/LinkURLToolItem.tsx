import { FormControl, FormErrorMessage, Input } from '@chakra-ui/react';
import { useFormik, Field, FormikProvider } from 'formik';
import { KeyboardEventHandler } from 'react';
import * as Validate from 'yup';

import { getMarkAttributes, isLinkMarkAttributes, urlSchema, AttributeType, LinkTarget, ExtendMarkRangeDocumentUpdate, MarkName, SetTextSelectionDocumentUpdate } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { EditorToolComponentProps, TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';
import { InputToolItemContainer } from 'notebookEditor/extension/shared/InputToolItemContainer';

import { SetLinkDocumentUpdate } from '../../command';

// ********************************************************************************
// == Schema ======================================================================
// TODO: move to a better place
const LinkDialog_Create_Schema = Validate.object({
  /*the src of the Link*/
  href: urlSchema
      .required(),
});
type LinkDialog_Create = Validate.InferType<typeof LinkDialog_Create_Schema>;

// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const LinkURLToolItem: React.FC<Props> = ({ editor }) => {
  const attrs = getMarkAttributes(editor.view.state, MarkName.LINK);
  const initialValue = attrs[AttributeType.Href] ?? ''/*default*/;

  const formik = useFormik<LinkDialog_Create>({
    initialValues: { href: initialValue },
    validationSchema: LinkDialog_Create_Schema,

    // REF: https://github.com/jaredpalmer/formik/issues/811
    // explicitly re-initialize when the values change
    enableReinitialize: true,

    // NOTE: not using onSubmit since the way the input is submitted must be handled
    //       by the caller in order to control the focus of the User
    onSubmit: () => {/*do nothing*/},
  });

  if(!isLinkMarkAttributes(attrs)) return null/*nothing to render*/;


  // == Handler ===================================================================
  // -- Form ----------------------------------------------------------------------
  // update the Attributes and select the previous position
  const handleSubmit = ({ href }: LinkDialog_Create, focusEditor: boolean) => {
    const { anchor: prevPos } = editor.view.state.selection;

    applyDocumentUpdates(editor, [
      new ExtendMarkRangeDocumentUpdate(MarkName.LINK, {/*no attributes*/}),
      new SetLinkDocumentUpdate({ ...attrs, [AttributeType.Href]: href, [AttributeType.Target]: LinkTarget.BLANK }),
      new SetTextSelectionDocumentUpdate({ from: prevPos, to: prevPos }),
    ]);

    // focus the editor again
    if(focusEditor) editor.view.focus();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    // save changes when user presses Enter
    if(event.key !== 'Enter') return/*nothing to do*/;
    if(!formik.isValid) return/*nothing to do*/;

    // prevent defaults so that PM does not handle the event
    event.preventDefault();
    event.stopPropagation();
    handleSubmit(formik.values, true/*focus editor*/);
  };

  const handleBlur = () => {
    if(formik.isValid) {
      handleSubmit(formik.values, false/*don't focus the editor*/);
      return;/*nothing else to do*/
    } /* else -- form is invalid */

    // reset to previous value
    formik.resetForm();
  };

  // == UI ========================================================================
  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} style={{ width:'100%' }}>
        <FormControl isInvalid={!!formik.errors.href}>
          <InputToolItemContainer name='URL'>
            <Field
              as={Input}
              id='href'
              name='href'
              datatype={TOOL_ITEM_DATA_TYPE/*(SEE: notebookEditor/toolbar/type )*/}
              value={formik.values.href ?? ''/*explicit controlled component*/}
              autoComplete='off'
              placeholder='href'
              variant='outline'
              size='sm'
              width='full'
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            />
            <FormErrorMessage>{formik.errors.href}</FormErrorMessage>
          </InputToolItemContainer>
        </FormControl>
      </form>
    </FormikProvider>
  );
};
