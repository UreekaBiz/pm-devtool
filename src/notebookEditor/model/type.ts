import { EditorState, Transaction } from 'prosemirror-state';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';

// ********************************************************************************
// == Option & Storage ============================================================
export type NoStorage = unknown/*alias*/;

// == Plugin ======================================================================
export class NoPluginState {
  constructor() {/*currently nothing*/ }
  apply(tr: Transaction, thisPluginState: NoPluginState, oldEditorState: EditorState, newEditorState: EditorState) { return this; }
}

// == Extension ===================================================================
export enum ExtensionName {
  ASYNC_NODE = 'asyncNode',
  BASIC_KEYMAP = 'basicKeymap',
  DEFAULT_INPUT_RULES = 'defaultInputRules',
  EMOJI_SUGGESTION = 'emojiSuggestion',
  GAP_CURSOR = 'gapCursor',
  HISTORY = 'history',
  NESTED_VIEW_NODE = 'nestedViewNode',
  SELECTION_HANDLING = 'selectionHandling',
  WRAP_AND_LIFT_LIST_ITEM_CHILDREN = 'wrapAndLiftListItemChildren',
}

// == Priority ====================================================================
// NOTE: priority can affect Extensions, Nodes and Marks

// -- Extension -------------------------------------------------------------------
// NOTE: if Extension priority is left unspecified, it defaults to 100
// NOTE: names match Extension, Node or Mark names for sanity
export enum ExtensionPriority {

  /**
   * since MarkHolder handles removal of MarkHolder Nodes, on keydown
   * and paste, it should have a higher priority than other Extensions that are
   * not blocks
   */
  MARK_HOLDER = 120,

  /**
   * Paragraph must have a higher priority than other block Nodes since it
   * is the 'default' block Node (by convention). If its priority is left
   * unspecified, the default block Node on document creation will be the
   * first block Node encountered in the editor Extension array
   *
   * SEE: notebookEditor/type.ts
   */
  PARAGRAPH = 119,

  /**
   * since the Plugins added by Tables handle Keydown and Mouse events,
   * they should run before other Plugins
   */
  TABLE = 118,

  /**
   * Link must have a higher priority than other marks so that it gets
   * preference over them when creating, pasting or applying parse rules
   */
  LINK = 116/*T&E*/,

  /**
   * since Suggestions have specific behavior for the Enter and arrow
   * keydown events, they must run before other Extensions with these
   * keydown handlers run
   */
  EMOJI_SUGGESTION = 115,

  /**
   * asyncNodes must check if they are dirty after the codeBlocks have
   * been modified accordingly (e.g. codeBlockReferences and hashes) have
   * been recomputed. Hence this must run before other Extensions
   */
  ASYNC_NODE = 114,

  /**
   * since Blocks make use of several specific Commands, they must not
   * be executed in default order
   */
  CODEBLOCK = 113,

  /** (SEE: ExtensionPriority.CodeBlock) */
  DEMO_ASYNC_NODE_2 = 112,

  /**
   * (SEE: ExtensionPriority.CodeBlock)
   * since Blockquote shares the Mod-B keybinding with Bold, it must have
   * a priority higher than it so that it gets inserted without toggling it
   */
  BLOCKQUOTE = 111,

  /**
   * since EditableInlineNodeWithContent shares the Mod-E keybinding
   * with Code, it must have a priority higher than it so that it
   * gets inserted without toggling it
   */
  EDITABLE_INLINE_NODE_WITH_CONTENT = 110,

  /** for consistency with EditableInlineNodeWithContent */
  NESTED_VIEW_BLOCK_NODE = 109/*same as EditableInlineNodeWithContent*/,

  /**
   * ensure that UnorderedList and OrderedList have a higher priority
   * than ListItems since they are meant to wrap them
   */
  UNORDERED_LIST = 109,
  ORDERED_LIST = 108,

  /**
   * since the Commands added by Lists handle Keydown,
   * they should run before other Plugins that also do so, but after
   * other TextBlock Nodes
   */
  LIST_ITEM = 107,

  /**
   * the BasicKeymap contains Commands that represent
   * default behavior, and hence it should have the default
   * extension priority
   */
  BASIC_KEYMAP = DEFAULT_EXTENSION_PRIORITY,

  /**
   * the checks added by this Extension should be done after the default
   * behavior of other Commands has been performed (which includes the
   * basicKeymap, e.g. joining Nodes forward or backward). Hence it should
   * be below the BasicKeymap Extension
   */
  WRAP_AND_LIFT_LIST_ITEM_CHILDREN = 99,

  /**
   * since the Text Extension adds '\t' whenever Tab is pressed, but this
   * behavior is not always guaranteed to be the desired one (e.g. when
   * going through a list Node), the Text Extension runs last. This ensures
   * that the shortcuts defined in the Text Extension run only if their
   * trigger was not handled by another Extension previously
   */
  TEXT = 98,

  // -- Mark ----------------------------------------------------------------------
  // Currently nothing
}

// -- ParseRule -------------------------------------------------------------------
// REF: https://prosemirror.net/docs/ref/#model.ParseRule.priority
// NOTE: if ParseRule priority is left unspecified, it defaults to 50
//       (SEE: REF above)
// NOTE: names match Extension, Node or Mark names for sanity
export enum ParseRulePriority {
  /** ensure that UnorderedLists and OrderedLists are parsed before ListItems */
  UNORDERED_LIST = 53,
  ORDERED_LIST = 52,

  /** ensure that ListItems are parsed after Bullet and Ordered Lists */
  LIST_ITEM = 51,
}
