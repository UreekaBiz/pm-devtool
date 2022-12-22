import { parser as CSSParser } from '@lezer/css';
import { classHighlighter, highlightTree } from '@lezer/highlight';
import { parser as HTMLParser } from '@lezer/html';
import { parser as JSParser } from '@lezer/javascript';
import { Decoration } from 'prosemirror-view';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
// == Formatter ===================================================================
const parsers = {
  [CodeBlockLanguage.CSS]: CSSParser,
  [CodeBlockLanguage.HTML]: HTMLParser,
  [CodeBlockLanguage.JavaScript]: JSParser,
};

export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {
  return '';
};

// == Highlight ===================================================================
export const getCodeBlockChildSyntaxDecorations = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {
  const parser = parsers[codeBlockLanguage];
  const tree = parser.parse(textContent);

  const decorations: Decoration[] = [/*default empty*/];
  highlightTree(tree, classHighlighter, (from, to, classes) => {
    decorations.push(Decoration.inline(from, to, { class: classes  }));
  });

  return decorations;
};
