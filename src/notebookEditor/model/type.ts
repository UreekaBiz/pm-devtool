import { EditorState, Transaction } from 'prosemirror-state';

// ********************************************************************************
// == Option & Storage ============================================================
export type NoOptions = unknown/*alias*/;
export type NoStorage = unknown/*alias*/;

// == Plugin ======================================================================
export class NoPluginState {
  constructor() {/*currently nothing*/ }
  apply(tr: Transaction, thisPluginState: NoPluginState, oldEditorState: EditorState, newEditorState: EditorState) { return this; }
}

// == Extension ===================================================================
export enum ExtensionName {
  BASIC_KEYMAP = 'basicKeymap',
  DEFAULT_INPUT_RULES = 'defaultInputRules',
  EMOJI_SUGGESTION = 'emojiSuggestion',
  GAP_CURSOR = 'gapCursor',
  HISTORY = 'history',
  SELECTION_HANDLING = 'selectionHandling',
}

// == Priority ====================================================================
// NOTE: priority can affect Extensions, Nodes and Marks

// -- Extension -------------------------------------------------------------------
// NOTE: if Extension priority is left unspecified, it defaults to 100
// NOTE: names match Extension, Node or Mark names for sanity
export enum ExtensionPriority {
  // NOTE: Paragraph must have a higher priority than other block Nodes since it
  //       is the 'default' block Node (by convention). If its priority is left
  //       unspecified, the default block Node on document creation will be the
  //       first block Node encountered in the editor Extension array
  // SEE: notebookEditor/type.ts
  PARAGRAPH = 118,

  // NOTE: Link must have a higher priority than other marks so that it gets
  //       preference over them when creating, pasting or applying parse rules
  LINK = 117/*T&E*/,

  // NOTE: since Suggestions have specific behavior for the Enter and arrow
  //       keydown events, they must run before other Extensions with these
  //       keydown handlers run
  EMOJI_SUGGESTION = 116,

  // NOTE: since the Text Extension adds '\t' whenever Tab is pressed, but this
  //       behavior is not always guaranteed to be the desired one (e.g. when
  //       going through a list Node), the Text Extension runs last. This ensures
  //       that the shortcuts defined in the Text Extension run only if their
  //       trigger was not handled by another Extension previously
  // SEE: NOTE above for default Extension priority
  TEXT = 99,

  // -- Mark ----------------------------------------------------------------------
  // Currently nothing
}
