import { ContentMatch } from 'prosemirror-model';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts
/** find the defaultBlock given a {@link ContentMatch} */
export const defaultBlockAt = (match: ContentMatch) => {
  for(let i=0; i<match.edgeCount; i++) {
    const { type } = match.edge(i);
    if(type.isTextblock && !type.hasRequiredAttrs()) {
      return type;
    } /* else -- keep looking */
  }

  return undefined/*no default Block found*/;
};
