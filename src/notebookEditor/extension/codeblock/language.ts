
import { Span, Text } from 'lowlight/lib/core';
import cssHighlighter from 'highlight.js/lib/languages/css';
import javascriptHighlighter from 'highlight.js/lib/languages/javascript';
import typescriptHighlighter from 'highlight.js/lib/languages/typescript';
import htmlHighlighter from 'highlight.js/lib/languages/xml';
import { lowlight } from 'lowlight';
import prettier from 'prettier';
import cssFormatter from 'prettier/parser-postcss';
import babelFormatter from 'prettier/parser-babel';
import htmlFormatter from 'prettier/parser-html';
import typeScriptFormatter from 'prettier/parser-typescript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
// == Formatter ===================================================================
const formatters = {
  [CodeBlockLanguage.CSS]: {
    parserName: CodeBlockLanguage.CSS,
    formatter: cssFormatter,
  },

  [CodeBlockLanguage.HTML]: {
    parserName: CodeBlockLanguage.HTML,
    formatter: htmlFormatter,
  },
  [CodeBlockLanguage.JavaScript]: {
    parserName: 'babel',
    formatter: babelFormatter,
  },

  [CodeBlockLanguage.TypeScript]: {
    parserName: CodeBlockLanguage.TypeScript,
    formatter: typeScriptFormatter,
  },
};
const codeBlockFormatter = prettier;
export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  codeBlockFormatter.format(textContent, { parser: formatters[codeBlockLanguage].parserName, plugins: [formatters[codeBlockLanguage].formatter] });

// == Highlight ===================================================================
const codeBlockHighlighter = lowlight;
      codeBlockHighlighter.registerLanguage('html', htmlHighlighter);
      codeBlockHighlighter.registerLanguage('css', cssHighlighter);
      codeBlockHighlighter.registerLanguage('javascript', javascriptHighlighter);
      codeBlockHighlighter.registerLanguage('typescript', typescriptHighlighter);

export const highlightCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => flattenHighlighterChildren(codeBlockHighlighter.highlight(codeBlockLanguage, textContent).children);

// -- Util ------------------------------------------------------------------------
const flattenHighlighterChildren = (children: (Span | Text)[], currentClasses: string[] = []): { childValue: string; childClasses: string[]; }[] => children.map((child) => {
  const classes = [...currentClasses, ...isLowLightSpan(child) ? child.properties.className : [/*no classes*/]];
  if(isLowLightSpan(child)) {
    return flattenHighlighterChildren(child.children, classes);
  } /* else -- a regular Text Node */

  return { childValue: child.value, childClasses: classes };
}).flat();

// .. Type Guard ...............................................................
const isLowLightSpan = (node: Span | Text): node is Span => 'properties' in node;
