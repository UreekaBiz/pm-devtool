import { MarkType, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { AbstractDocumentUpdate } from '../type';

import { MarkName, getMarkAttributes, getRangeCoveredByMark, doesMarkApplyToRanges } from '../../../notebookEditor/mark';
import { Attributes } from '../../../notebookEditor/attribute';

// ********************************************************************************
// == Setter ======================================================================
/** set a Mark across the current Selection */
export const setMarkCommand = (markName: MarkName, attributes: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SetMarkDocumentUpdate(markName, attributes), state, dispatch);
export class SetMarkDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly markName: MarkName, private readonly attributes: Partial<Attributes>) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/17a41da5a7a14879cf490c81914084791c4c494c/packages/core/src/commands/setMark.ts
  /*
   * modify the given Transaction such that a Mark
   * is set across the current Selection, and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { empty, ranges } = tr.selection,
          markType = editorState.schema.marks[this.markName];
    if(empty) {
      const oldAttributes = getMarkAttributes(editorState, this.markName);
      tr.addStoredMark(markType.create({ ...oldAttributes, ...this.attributes }));
    } else {
      ranges.forEach(range => {
        const from = range.$from.pos,
              to = range.$to.pos;

        editorState.doc.nodesBetween(from, to, (node, pos) => {
          const trimmedFrom = Math.max(pos, from);
          const trimmedTo = Math.min(pos + node.nodeSize, to);
          const markTypeIsPresent = node.marks.find(mark => mark.type === markType);

          // if a Mark of the given type is already present, merge its
          // attributes. Otherwise add a new one
          if(markTypeIsPresent) {
            node.marks.forEach(mark => {
              if(markType === mark.type) {
                tr.addMark(trimmedFrom, trimmedTo, markType.create({ ...mark.attrs, ...this.attributes }));
              } /* else -- Mark of type not present */
            });
          } else {
            tr.addMark(trimmedFrom, trimmedTo, markType.create(this.attributes));
          }
        });
      });
    }
    return tr/*updated*/;
  }
}

// --------------------------------------------------------------------------------
/**
 * Remove all Marks across the current Selection. If extendEmptyMarkRange,
 * is true, they will be removed even across (i.e. past) it
 */
export const unsetMarkCommand = (markName: MarkName, extendEmptyMarkRange: boolean): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new UnsetMarkDocumentUpdate(markName, extendEmptyMarkRange), state, dispatch);
export class UnsetMarkDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly markName: MarkName, private readonly extendEmptyMarkRange: boolean) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/commands/unsetMark.ts
  /**
   * modify the given Transaction such that all Marks are removed
   * across the current Selection. If extendEmptyMarkRange,
   * is true, they will be removed even across (i.e. past) it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState,
          { $from, empty, ranges } = selection;
    const markType = editorState.schema.marks[this.markName];

    if(empty && this.extendEmptyMarkRange) {
      let { from, to } = selection;
      const markAttrs = $from.marks().find(mark => mark.type === markType)?.attrs,
            markRange = getRangeCoveredByMark($from, markType, markAttrs);

      if(markRange) {
        from = markRange.from;
        to = markRange.to;
      } /* else -- use Selection from and to */

      tr.removeMark(from, to, markType);
    } else {
      ranges.forEach(range => tr.removeMark(range.$from.pos, range.$to.pos, markType));
    }

    tr.removeStoredMark(markType);
    return tr/*updated*/;
  }
}

// --------------------------------------------------------------------------------
/** Toggle the given Mark with the given name */
export const toggleMarkCommand = (markType: MarkType, attributes: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleMarkDocumentUpdate(markType, attributes), state, dispatch);
export class ToggleMarkDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly markType: MarkType, private readonly attributes: Partial<Attributes>) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts#L514
  /**
   * modify the given Transaction such that Mark with the given
   * Name is toggled
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { empty, $cursor, ranges } = editorState.selection as TextSelection/*explicitly looking for $cursor property*/;
    if((empty && !$cursor) || !doesMarkApplyToRanges(editorState.doc, ranges, this.markType)) return false/*invalid state to toggle Mark*/;

    if($cursor) /* there is an empty TextSelection */ {
      if(this.markType.isInSet(editorState.storedMarks || $cursor.marks())) { tr.removeStoredMark(this.markType); }
      else { tr.addStoredMark(this.markType.create(this.attributes)); }
    } else /* non-empty TextSelection */ {
      let rangeHasMark = false/*default*/;
      for(let i = 0; !rangeHasMark && i < ranges.length; i++) {
        let { $from, $to } = ranges[i];
        rangeHasMark = editorState.doc.rangeHasMark($from.pos, $to.pos, this.markType);
      }

      for(let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i];
        if(rangeHasMark) {
          tr.removeMark($from.pos, $to.pos, this.markType);
        } else {
          const { from, to } = getMarkRangeAccountingForWhiteSpace($from, $to);
          tr.addMark(from, to, this.markType.create(this.attributes));
        }
      }

      tr.scrollIntoView();
    }

    return tr/*updated*/;
  }
}

/**
 * given two {@link ResolvedPos}itions, return the range inside
 * them that contains Text Nodes, removing the ranges that contain
 * leading or trailing whitespace
 */
const getMarkRangeAccountingForWhiteSpace = ($from: ResolvedPos, $to: ResolvedPos) => {
  const nodeAfter$From = $from.nodeAfter,
        nodeBefore$To = $to.nodeBefore;
  let from = $from.pos,
      to = $to.pos;

  // account for leading white-space
  let spaceStart = 0/*default no space to account for*/;
  if(nodeAfter$From && nodeAfter$From.text) {
    spaceStart = nodeAfter$From.text.length - nodeAfter$From.text.trimStart().length;
  } /* else -- there is no Node after $from or said Node has no Text */

  // account for trailing white-space
  let spaceEnd = 0/*default no space to account for*/;
  if(nodeBefore$To && nodeBefore$To.text) {
    spaceEnd = nodeBefore$To.text.length - nodeBefore$To.text.trimEnd().length;
  } /*  there is no Node before $to or said Node has no Text */

  // update the Ranges
  if((from + spaceStart) < to) {
    from += spaceStart;
    to -= spaceEnd;
  } /* else -- do not modify Range */

  return { from, to };
};

// --------------------------------------------------------------------------------
/**
 * Checks to see whether the Selection currently contains a Range with a Mark
 * of the given name in it, and if it does, modifies it so that the Range covers
 * it completely
 */
export const extendMarkRangeCommand = (markName: MarkName, attributes: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ExtendMarkRangeDocumentUpdate(markName, attributes), state, dispatch);
export class ExtendMarkRangeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly markName: MarkName, private readonly attributes: Partial<Attributes>) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/commands/extendMarkRange.ts
  /**
   * Checks to see whether the Selection currently contains a Range with a Mark
   * of the given name in it, and if it does, modifies the Transaction so that
   * the Range covers it completely, and returns it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const markType = editorState.schema.marks[this.markName];

    const { doc, selection } = tr,
          { $from, from, to } = selection;

    // expand the current Selection if need be
    const markRange = getRangeCoveredByMark($from, markType, this.attributes);
    if(markRange && markRange.from <= from && markRange.to >= to) {
      const newSelection = TextSelection.create(doc, markRange.from, markRange.to);
      tr.setSelection(newSelection);
    } /* else -- no need to expand the Selection */

    return tr/*updated*/;
  }
}
