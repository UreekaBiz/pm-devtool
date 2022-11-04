import { ExtensionName, ExtensionPriority } from 'notebookEditor/model/type';

import { Extension } from '../type';
import { checkDirty } from './transaction';

// ********************************************************************************
// NOTE: AsyncNodes are meant to be an abstraction for all async nodes. As such,
//       any functionality that is common to all of them is implemented here.
// NOTE: All common attributes shared across asyncNodes are defined in its
//       corresponding common file
//       (SEE: src/common/notebookEditor/extension/asyncNode.ts)
// == Extension ===================================================================
export const AsyncNode = new Extension({
  name: ExtensionName.ASYNC_NODE,
  priority: ExtensionPriority.ASYNC_NODE,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Transaction ---------------------------------------------------------------
  transactionListener: (editor, tr) => checkDirty(editor, tr),

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});
