import { keymap } from 'prosemirror-keymap';
import { DOMParser } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { SchemaV1 } from 'common';

import { getBasicKeymap } from './keymap';
import { history } from 'prosemirror-history';

// ********************************************************************************
// == Class =======================================================================
export class NotebookAPI {
  // -- Attribute -----------------------------------------------------------------
  private root: HTMLElement | undefined/*not initialized yet*/;
  public view: EditorView | undefined/*not initialized yet*/;
  public domParser: DOMParser | undefined/*not initialized yet*/;

  // -- Lifecycle -----------------------------------------------------------------
  constructor() {/*currently nothing*/ }

  // -- View ----------------------------------------------------------------------
  public mountView(root: HTMLElement) {
    this.root = root;
    this.view = this.buildView(root);
    this.domParser = DOMParser.fromSchema(SchemaV1);
  }

  private buildView(root: HTMLElement) {
    return new EditorView(
      root,
      {
        state: EditorState.create({
          schema: SchemaV1,

          // plugins that define a state, append or filter Transactions
          plugins: [history()],
        }),


        // plugins that do not define a state, append or filter Transactions
        plugins: [keymap(getBasicKeymap())],
      });
  }
}
