import Prism from 'prismjs';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, AttributeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { NoPluginState } from 'notebookEditor/model';

import { getCodeBlockViewStorage, CodeBlockController } from './nodeView';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Plugin ======================================================================
export const codeBlockPlugin = (editor: Editor) =>
  new Plugin<NoPluginState>({
    // -- Definition --------------------------------------------------------------
    key: new PluginKey<NoPluginState>('codeBlockPluginKey'),

    // -- Props -------------------------------------------------------------------
    props: {
      decorations: (state) => {
        const codeBlockControllers: CodeBlockController[] = [/*default empty*/];
        const storage = getCodeBlockViewStorage(editor);
              storage.forEachNodeView(controller => codeBlockControllers.push(controller));

        const decorations: Decoration[] = [/*default empty*/];
        for(let i=0; i<codeBlockControllers.length; i++) {
          const codeBlock = state.doc.nodeAt(codeBlockControllers[i].getPos());
          if(!codeBlock || !isCodeBlockNode(codeBlock)) continue/*does not exist anymore*/;

          const codeBlockDecorations = getDecorations(codeBlockControllers[i]);
          if(!codeBlockDecorations?.length) continue/*no decorations added*/;

          decorations.push(...codeBlockDecorations);
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });

// == Util ========================================================================
const getDecorations = (codeBlockController: CodeBlockController) => {
  const decorations: Decoration[] = [/*default empty*/];
  const { node } = codeBlockController,
        { [AttributeType.Language]: language } = node.attrs;
  if(!language) return/*no language set in the CodeBlock*/;

  const prismGrammar = Prism.languages[language];
  if(!prismGrammar) return/*no prismGrammar exists for given language*/;

  const tokenOrStrings = Prism.tokenize(node.textContent, prismGrammar);

  let absolutePos = codeBlockController.getPos() + 1/*skip the CodeBlock node itself*/;
  for(let i=0; i<tokenOrStrings.length; i++) {
    const tokenOrString = tokenOrStrings[i];
    if(isPrismToken(tokenOrString)) {
      const from = absolutePos,
            to = absolutePos + tokenOrString.content.length;
      decorations.push(Decoration.inline(from, to, { class: `token` }));
      absolutePos += tokenOrString.content.length;
    } else /*found a Token*/ {
      absolutePos += tokenOrString.length;
    }
  }

  return decorations;
};

const isPrismToken = (tokenOrString: any): tokenOrString is Prism.Token => typeof tokenOrString !== 'string';
