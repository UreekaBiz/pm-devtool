import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { HeadingLevelToolItem } from './HeadingLevelToolItem';

//*********************************************************************************
// == Tool Items ==================================================================
export const headingLevelToolItem: ToolItem = {
  toolType: 'component',
  name: 'headingLevelToolItem',

  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  component: (props) => <HeadingLevelToolItem {...props}/>,
};
