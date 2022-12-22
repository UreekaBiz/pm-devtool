import { parser as CSSHighlighter } from '@lezer/css';
import { parser as HTMLHighlighter } from '@lezer/html';
import { parser as jsHighlighter } from '@lezer/javascript';
import prettier from 'prettier';
import cssFormatter from 'prettier/parser-postcss';
import jsFormatter from 'prettier/parser-babel';
import htmlFormatter from 'prettier/parser-html';
import typeScriptFormatter from 'prettier/parser-typescript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
const languageInfo = {
  [CodeBlockLanguage.CSS]: {
    formatter: cssFormatter,
    highlighter: CSSHighlighter,
    parser: CodeBlockLanguage.CSS,
  },

  [CodeBlockLanguage.HTML]: {
    formatter: htmlFormatter,
    highlighter: HTMLHighlighter,
    parser: CodeBlockLanguage.HTML,
  },
  [CodeBlockLanguage.JavaScript]: {
    formatter: jsFormatter,
    highlighter: jsHighlighter,
    parser: 'babel',
  },

  [CodeBlockLanguage.TypeScript]: {
    formatter: typeScriptFormatter,
    highlighter: jsHighlighter.configure({ dialect: 'ts' }),
    parser: CodeBlockLanguage.TypeScript,
  },
};
export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  prettier.format(textContent, { parser: languageInfo[codeBlockLanguage].parser, plugins: [languageInfo[codeBlockLanguage].formatter] });

// == Highlight ===================================================================
export const getCodeBlockChildHighlightTree = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  languageInfo[codeBlockLanguage].highlighter.parse(textContent);
