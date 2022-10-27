import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { Mark as ProseMirrorMark, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Command, MarkName, NodeName } from 'common';

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
  public updateReactStateCallback: React.Dispatch<React.SetStateAction<EditorState>> | undefined;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(schema: Schema) {
    this.schema = schema;
    this.view = new EditorView(null/*default empty*/, { state: EditorState.create({ schema: this.schema }) });
    this.storage = {/*default empty*/ };
    this.updateReactStateCallback = undefined/*not initialized yet*/;
  }

  // -- View ----------------------------------------------------------------------
  public mountView(root: HTMLElement) {
    this.view = new EditorView(
      root,
      {
        state: EditorState.create({
          schema: this.schema,

          // FIXME: define how to interact with Commands
          // @ts-ignore
          plugins: [history(), keymap(getBasicKeymap())],
        }),
        dispatchTransaction: (tr) => {
          this.view.updateState(this.view.state.apply(tr));
          if(this.updateReactStateCallback) {
            this.updateReactStateCallback(this.view.state);
          } /* else -- not initialized yet, nothing to do */
        },
      });
  }

  public setReactUpdateCallback(callback: React.Dispatch<React.SetStateAction<EditorState>>) {
    this.updateReactStateCallback = callback;
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

  /**
   * get the attributes of the given NodeName or MarkName at the Selection
   * if a Node or Mark of said type currently exists there
   */
  public getAttributes(name: string) {
    const { state } = this.view/*for convenience*/;

    if(Object.values(NodeName).includes(name as NodeName/*check*/)) {
      const nodes: ProseMirrorNode[] = [/*default empty*/];

      const { from, to } = state.selection;
      state.doc.nodesBetween(from, to, (node) => { nodes.push(node); });

      const node = nodes.reverse(/*from most nested to least nested*/).find(nodeItem => nodeItem.type.name === name);
      if(!node) {
        return {/*no attrs*/};
      } /* else -- return the Node's attrs */

      return { ...node.attrs };
    } /* else -- not a Node */

    if(Object.values(MarkName).includes(name as MarkName/*check*/)) {
      const { from, to, empty } = state.selection;
      const marks: ProseMirrorMark[] = [/*default empty*/];

      if(empty) {
        if(state.storedMarks) {
          marks.push(...state.storedMarks);
        } /* else -- no stored Marks */
        marks.push(...state.selection.$head.marks());

      } else {
        state.doc.nodesBetween(from, to, node => { marks.push(...node.marks); });
      }

      const mark = marks.find(markItem => markItem.type.name === name);
      if(!mark) {
        return {/*no attrs*/};
      } /* else -- return Mark's attrs */

      return { ...mark.attrs };
    } /* else -- not a Node or a Mark*/

    return {/*default no attributes*/};
  }
}
