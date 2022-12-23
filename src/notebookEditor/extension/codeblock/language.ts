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
  prettierPlugin: any/*varies per formatter*/;
  prettierParser: string;
}
type CodeBlockLanguages = { [key in CodeBlockLanguage]: LanguageInfo; }

// == Constant ====================================================================
const codeBlockLanguages: CodeBlockLanguages = {
  [CodeBlockLanguage.CSS]: {
    prettierPlugin: cssFormatter,
    prettierParser: CodeBlockLanguage.CSS.toLowerCase(),
    languageSupport: null/*default*/,
  },

  [CodeBlockLanguage.HTML]: {
    prettierPlugin: htmlFormatter,
    prettierParser: CodeBlockLanguage.HTML.toLowerCase(),
    languageSupport: null/*default*/,
  },
  [CodeBlockLanguage.JavaScript]: {
    prettierPlugin: jsFormatter,
    prettierParser: 'babel',
    languageSupport: null/*default*/,
  },

  [CodeBlockLanguage.TypeScript]: {
    prettierPlugin: typeScriptFormatter,
    prettierParser: CodeBlockLanguage.TypeScript.toLowerCase(),
    languageSupport: null/*default*/,
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

