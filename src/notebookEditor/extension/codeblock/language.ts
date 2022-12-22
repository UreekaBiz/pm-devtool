import { parser as CSSParser } from '@lezer/css';
import { parser as HTMLParser } from '@lezer/html';
import { parser as JSParser } from '@lezer/javascript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
// == Formatter ===================================================================
const parsers = {
  [CodeBlockLanguage.CSS]: CSSParser,
  [CodeBlockLanguage.HTML]: HTMLParser,
  [CodeBlockLanguage.JavaScript]: JSParser
};

export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {
  const parser = parsers[codeBlockLanguage];
  const tree = parser.parse(textContent);
  return tree;
};

// == Highlight ===================================================================
export const highlightCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {

};
