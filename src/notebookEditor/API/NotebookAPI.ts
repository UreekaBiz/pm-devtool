import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { getBasicKeymap } from './keymap';

// ********************************************************************************
// == Class =======================================================================
export class NotebookAPI {
  // -- Attribute -----------------------------------------------------------------
  private schema: Schema;
  public view: EditorView | undefined/*not initialized yet*/;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(schema: Schema) {
    this.schema = schema;
  }

  // -- View ----------------------------------------------------------------------
  public mountView(root: HTMLElement) {
    this.view = this.buildView(root);
  }

  private buildView(root: HTMLElement) {
    // FIXME: define how to interact with Commands
    // @ts-ignore
    return new EditorView(root, { state: EditorState.create({ schema: this.schema, plugins: [history(), keymap(getBasicKeymap())] }) });
  }
}
