import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { ExtensionName, ExtensionPriority } from 'notebookEditor/model';

import { wrapAndLiftListItemChildrenPlugin } from './plugin';

// ********************************************************************************
// == Extension ===================================================================
export const WrapAndLiftListItemChildren = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.WRAP_AND_LIFT_LIST_ITEM_CHILDREN,
  priority: ExtensionPriority.WRAP_AND_LIFT_LIST_ITEM_CHILDREN,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [wrapAndLiftListItemChildrenPlugin()],
});
