import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { Selection } from 'prosemirror-state';

import { getCodeBlockNodeType, generateNodeId, getNodeOutputSpec, isCodeBlockNode, isGapCursorSelection, AttributeType, CodeBlockNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { toggleBlock } from 'notebookEditor/command/node';
import { Editor } from 'notebookEditor/editor/Editor';
import { ExtensionPriority } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockAttrs } from './attribute';
import './codeBlock.css';
import { getCodeBlockViewStorage, CodeBlockStorage, CodeBlockController } from './nodeView';
import { codeBlockOnTransaction } from './transaction';

// ********************************************************************************
// == Constant ====================================================================
const codeBlockRegEx = /```([a-z]+)?[\s\n]$/;

// == Node ========================================================================
export const CodeBlock = new NodeExtension({
  name: NodeName.CODEBLOCK,
  priority: ExtensionPriority.CODEBLOCK,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getCodeBlockAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...CodeBlockNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.CODEBLOCK}"]`, preserveWhitespace: 'full'/*preserve new lines when parsing the content of the codeBlock*/ }], getCodeBlockAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getCodeBlockAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new CodeBlockStorage(),

  // -- Transaction ---------------------------------------------------------------
  transactionListener: (editor, tr) => codeBlockOnTransaction(editor, tr), 

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<CodeBlockController>(editor, node, NodeName.CODEBLOCK, getPos, isCodeBlockNode, CodeBlockController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [textblockTypeInputRule(codeBlockRegEx, getCodeBlockNodeType(editor.view.state.schema), () => ({ [AttributeType.Id]: generateNodeId() }))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // toggle a CodeBlock
      'Shift-Mod-c': () => toggleCodeBlock(editor),
      'Shift-Mod-C': () => toggleCodeBlock(editor),

      // select a CodeBlock if arrow traversal would put the cursor inside it
      'ArrowLeft': () => goIntoCodeBlock(editor, 'left'),
      'ArrowRight': () => goIntoCodeBlock(editor, 'right'),
      'ArrowUp': () => goIntoCodeBlock(editor, 'up'),
      'ArrowDown': () => goIntoCodeBlock(editor, 'down'),
    }),
  ],
});

// == Util ========================================================================
// NOTE: not a Command since storage must be accessed
const toggleCodeBlock = (editor: Editor) => {
  const id = generateNodeId(),
        commandResult = toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: id });

  const { selection } = editor.view.state;
  if(!isCodeBlockNode(selection.$from.parent)) return commandResult/*no need to focus CodeBlock, it was toggled*/;

  const storage = getCodeBlockViewStorage(editor);
  const codeBlockView = storage.getNodeView(id);
  if(!codeBlockView) return false/*not setup yet*/;

  setTimeout(() => codeBlockView.nodeView.codeMirrorView?.focus(), 0/*after View has been created, T&E*/);
  return true/*handled*/;
};

// NOTE: not a Command since storage must be accessed
const goIntoCodeBlock = (editor: Editor, direction: 'left' | 'right' | 'up' | 'down') => {
  const { view } = editor,
        { state } = view;
  if(isGapCursorSelection(state.selection)) return false/*do not handle*/;

  const wouldLeaveTextBlock = view.endOfTextblock(direction);
  if(!wouldLeaveTextBlock) return false/*would not leave TextBlock*/;

  const resultingSelectionSide = direction === 'left' || direction === 'up' ? -1/*left/upwards*/ : 1/*right/downwards*/,
        { $head } = state.selection,
        nextPos = Selection.near(state.doc.resolve(resultingSelectionSide < 0/*left/upwards*/ ? $head.before() : $head.after()), resultingSelectionSide);
  if(!isCodeBlockNode(nextPos.$head.parent)) return false/*no CodeBlock to select after moving in direction*/;

  const { [AttributeType.Id]: id } = nextPos.$head.parent.attrs;
  if(!id) return false/*no CodeBlock to select after moving in direction*/;

  const storage = getCodeBlockViewStorage(editor);
  const codeBlockView = storage.getNodeView(id);
  if(!codeBlockView) return false/*no CodeBlockView to select after moving in direction*/;

  // sync outerView selection
  const { tr } = state;
  tr.setSelection(nextPos);
  view.dispatch(tr);

  // sync codeMirrorView selection
  if((direction === 'right' || direction === 'down')) {
    codeBlockView.nodeView.codeMirrorView?.focus();
  } else {
    // set Selection at end of CodeBlock
    codeBlockView.nodeView.codeMirrorView?.focus();
    codeBlockView.nodeView.codeMirrorView?.dispatch({ selection: { anchor: nextPos.$anchor.parent.nodeSize - 2/*account for start and end of CodeBlock*/ } });
  }
  return true/*handled*/;
};
