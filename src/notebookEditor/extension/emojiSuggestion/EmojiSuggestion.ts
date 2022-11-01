
import { ExtensionName, ExtensionPriority } from 'notebookEditor/model/type';
import { suggestionPlugin } from 'notebookEditor/plugin/suggestion/suggestionPlugin';

import { Extension } from '../type';
import { emojiSuggestionOptions } from './EmojiSuggestionOptions';

// ********************************************************************************
// displays a Suggestion component so that the User can choose an Emoji Symbol,
// which gets inserted as Text into the Editor

// == Extension ===================================================================
export const EmojiSuggestion = new Extension({
  name: ExtensionName.EMOJI_SUGGESTION,
  priority: ExtensionPriority.EMOJI_SUGGESTION,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [suggestionPlugin({ editor, ...emojiSuggestionOptions })],
});
