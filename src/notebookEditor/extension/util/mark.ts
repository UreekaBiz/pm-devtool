import { markInputRule as tiptapMarkInputRule, markPasteRule as tiptapMarkPasteRule, InputRule, PasteRule } from '@tiptap/core';
import { MarkType } from 'prosemirror-model';

// ********************************************************************************
/**
 * Utility function to create an {@link InputRule} without {@link RegExp} duplication
 * Returns a {@link InputRule} for the given {@link MarkType}
 * @param regExp The {@link RegExp} that will be turned into an {@link InputRule} for the desired {@link MarkType}
 * @param type The {@link MarkType} for which a new {@link InputRule} will be created
 * @returns The created {@link InputRule} for the corresponding {@link MarkType}
 * REF: https://tiptap.dev/guide/custom-extensions
 */
export const markInputRule = (regExp: RegExp, type: MarkType): InputRule => tiptapMarkInputRule({ find: new RegExp(regExp.source + '$'), type });

/**
 * Utility function to create an {@link PasteRule} without {@link RegExp} duplication
 * Returns a {@link PasteRule} for the given {@link MarkType}
 * @param regExp The {@link RegExp} that will be turned into an {@link PasteRule} for the desired {@link MarkType}
 * @param type The {@link MarkType} for which a new {@link PasteRule} will be created
 * @returns The created {@link PasteRule} for the corresponding {@link MarkType}
 * REF: https://tiptap.dev/guide/custom-extensions
 */
export const markPasteRule = (regExp: RegExp, type: MarkType): PasteRule => tiptapMarkPasteRule({ find: new RegExp(regExp.source, 'g'), type });
