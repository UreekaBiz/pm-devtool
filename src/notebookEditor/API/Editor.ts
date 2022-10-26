import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Command } from 'common';

import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { DialogStorage } from 'notebookEditor/model/DialogStorage';

import { getBasicKeymap } from './keymap';

// ********************************************************************************
// == Class =======================================================================
export class Editor {
  // -- Attribute -----------------------------------------------------------------
  private schema: Schema;
  public view: EditorView;
  public storage: { [key: string]: NodeViewStorage<any> | DialogStorage; };

  // -- Lifecycle -----------------------------------------------------------------
  constructor(schema: Schema) {
    this.schema = schema;
    this.view = new EditorView(null/*default empty*/, { state: EditorState.create({ schema: this.schema }) });
    this.storage = {/*default empty*/};
  }

  // -- View ----------------------------------------------------------------------
  public mountView(root: HTMLElement) {
    // FIXME: define how to interact with Commands
    // @ts-ignore
    this.view =  new EditorView(root, { state: EditorState.create({ schema: this.schema, plugins: [history(), keymap(getBasicKeymap())] }) });
  }

  // -- Command -------------------------------------------------------------------
  /**
   * execute the given {@link Command} with the current View's state
   * and dispatch functions
   */
  public executeCommand(command: Command) {
    command(this.view.state, this.view.dispatch);
  }

  // -- Selection -----------------------------------------------------------------
  /** return the position at the end of the View's Document */
  public get endOfDocPos() {
    return this.view.state.doc.nodeSize - 2/*account for start and end of Doc*/;
  }

  // -- Util ----------------------------------------------------------------------
  /** focus the View */
  public focusView() {
    this.view.focus();
  }
}
