import { parser as CSSParser } from '@lezer/css';
import { parser as HTMLParser } from '@lezer/html';
import { parser as JSParser } from '@lezer/javascript';

import { CodeBlockLanguage } from 'common';

// ********************************************************************************
// == Formatter ===================================================================
const parsers = {
  [CodeBlockLanguage.CSS]: CSSParser,
  [CodeBlockLanguage.HTML]: HTMLParser,
  [CodeBlockLanguage.JavaScript]: JSParser,
  [CodeBlockLanguage.TypeScript]: JSParser.configure({ dialect: 'ts' }),
};

export const formatCodeBlockChild = (codeBlockLanguage: CodeBlockLanguage, textContent: string) => {
  return '';
};

// == Highlight ===================================================================
export const getCodeBlockChildTree = (codeBlockLanguage: CodeBlockLanguage, textContent: string) =>
  parsers[codeBlockLanguage].parse(textContent);
