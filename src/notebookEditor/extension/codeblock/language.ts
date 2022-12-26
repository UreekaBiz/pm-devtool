import { LanguageSupport } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { Tree } from '@lezer/common';
import { format } from 'prettier';
import cssFormatter from 'prettier/parser-postcss';
import jsFormatter from 'prettier/parser-babel';
import htmlFormatter from 'prettier/parser-html';
import typeScriptFormatter from 'prettier/parser-typescript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
// == Type ========================================================================
type LanguageInfo = {
  languageSupport: LanguageSupport | null/*not loaded yet*/;
  prettierParser: string;
  prettierPlugin: any/*varies per formatter*/;
}
type CodeBlockLanguages = { [key in CodeBlockLanguage]: LanguageInfo; }

// == Constant ====================================================================
const codeBlockLanguages: CodeBlockLanguages = {
  [CodeBlockLanguage.CSS]: {
    languageSupport: null/*default*/,
    prettierParser: CodeBlockLanguage.CSS.toLowerCase(),
    prettierPlugin: cssFormatter,
  },

  [CodeBlockLanguage.HTML]: {
    languageSupport: null/*default*/,
    prettierParser: CodeBlockLanguage.HTML.toLowerCase(),
    prettierPlugin: htmlFormatter,
  },
  [CodeBlockLanguage.JavaScript]: {
    languageSupport: null/*default*/,
    prettierParser: 'babel',
    prettierPlugin: jsFormatter,
  },

  [CodeBlockLanguage.TypeScript]: {
    languageSupport: null/*default*/,
    prettierParser: CodeBlockLanguage.TypeScript.toLowerCase(),
    prettierPlugin: typeScriptFormatter,
  },
};
(async () => {
  Object.values(CodeBlockLanguage).forEach(async (codeBlockLanguage) => {
    const languageDescription = languages.find((l) => l.name === codeBlockLanguage);
    if(!languageDescription) throw new Error(`No language description found for ${codeBlockLanguage}`);

    const languageSupport = await languageDescription.load();
    codeBlockLanguages[codeBlockLanguage].languageSupport = languageSupport;
  });
})(/*load on start*/);

// == Format ====================================================================
export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  format(textContent, { parser: codeBlockLanguages[codeBlockLanguage].prettierParser, plugins: [codeBlockLanguages[codeBlockLanguage].prettierPlugin] });

// == Highlight ===================================================================
export const getCodeBlockChildHighlightTree = (codeBlockLanguage: CodeBlockLanguage, textContent: string): Tree => {
  const tree = codeBlockLanguages[codeBlockLanguage].languageSupport?.language.parser.parse(textContent);
  if(!tree) throw new Error(`No Language Support found for ${codeBlockLanguage}`);

  return tree;
};

