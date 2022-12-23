import { format } from 'prettier';
import cssParser from 'prettier/parser-postcss';
import jsParser from 'prettier/parser-babel';
import htmlParser from 'prettier/parser-html';
import typeScriptParser from 'prettier/parser-typescript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
const languageInfo = {
  [CodeBlockLanguage.CSS]: {
    parserName: CodeBlockLanguage.CSS,
    formatter: cssParser,
    highlighter: cssParser.parsers.css,
  },

  [CodeBlockLanguage.HTML]: {
    parserName: CodeBlockLanguage.HTML,
    formatter: htmlParser,
    highlighter: htmlParser.parsers.html,
  },

  [CodeBlockLanguage.JavaScript]: {
    parserName: CodeBlockLanguage.JavaScript,
    formatter: jsParser,
    highlighter: jsParser.parsers.babel,
  },

  [CodeBlockLanguage.TypeScript]: {
    parserName: CodeBlockLanguage.TypeScript,
    formatter: typeScriptParser,
    highlighter: typeScriptParser.parsers.typescript,
  },
};
export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  format(textContent, { parser: languageInfo[codeBlockLanguage].parserName, plugins: [languageInfo[codeBlockLanguage].formatter] });

// == Highlight ===================================================================
export const getCodeBlockChildHighlightTree = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {
  const { highlighter } = languageInfo[codeBlockLanguage];
  try {
    format(textContent, { parser: 'ppp', plugins: [myCustomPlugin] });
  } catch(error) {
    return null;
  }
};

const myCustomPlugin = {
  parsers: {
    ['ppp']: {
      parse(text: string) {
        // @ts-ignore
        const ast = cssParser.parsers.scss.parse(text);
        console.log(ast);
        return ast;
      },
      astFormat: "estree",
    },
  },
};