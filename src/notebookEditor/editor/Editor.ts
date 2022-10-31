import { Schema } from 'prosemirror-model';
import { Command, EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Attributes, MarkName, NodeName } from 'common';

import { AbstractNodeController, DialogStorage, NodeViewStorage } from 'notebookEditor/model';
import { sortExtensionsByPriority, getNodeSpecs, getMarkSpecs, getTopNode, Extension } from 'notebookEditor/extension';

import { getMarkAttributesFromView, getNodeAttributesFromView, isMarkActive, isNodeActive } from './util';

// ********************************************************************************
// == Class =======================================================================
export class Editor {
  // -- Attribute -----------------------------------------------------------------
  // .. Private ...................................................................
  /** the {@link Extension}s that will be used by the Editor */
  private extensions: Extension[];

  /** the {@link Schema} that the {@link EditorView}'s will use */
  private schema: Schema;

  /** whether or not the {@link EditorView} has been fully mounted */
  private viewMounted: boolean;

  /** utility to set the Callback that updates React's state with the new
   * {@link EditorView}'s state whenever a {@link Transaction} is dispatched,
   * so that the rest of the application can read it
   */
  private updateReactStateCallback: React.Dispatch<React.SetStateAction<EditorState>> | undefined;

  // .. Public ....................................................................
  /** the Editor's {@link EditorView} */
  public view: EditorView;

  /**
   * map containing NodeNames and mapping them to their storage, which
   * holds references to their {@link AbstractNodeController}s
   */
  public storage: Map<NodeName | MarkName, NodeViewStorage<AbstractNodeController<any, any>> | DialogStorage>;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(extensions: Extension[]) {
    // .. Private .................................................................
    this.extensions = sortExtensionsByPriority(extensions);
    this.schema = this.buildSchemaFromExtensions(this.extensions);
    this.viewMounted = false/*by definition*/;

    // .. Public ..................................................................
    this.view = new EditorView(null/*default empty*/, { state: EditorState.create({ schema: this.schema }) });
    this.storage = new Map(/*default empty*/);
    this.updateReactStateCallback = undefined/*not initialized yet*/;
  }

  /** create a {@link Schema} from the given {@link Extension}s */
  private buildSchemaFromExtensions(extensions: Extension[]) {
    const nodes = getNodeSpecs(extensions);
    const marks = getMarkSpecs(extensions);
    return new Schema({ topNode: getTopNode(extensions), nodes, marks });
  }

  // -- View ----------------------------------------------------------------------
  /** mount the Editor's {@link EditorView} */
  public mountView(root: HTMLElement) {
    this.view = new EditorView(
      root,
      {
        state: EditorState.create({
          schema: this.schema,

          // NOTE: expects the extensions to be ordered by priority (which happens
          //       in the Editor constructor)
          plugins: this.extensions.reduce<Plugin[]>((pluginArray, sortedExtension) => {
            pluginArray.push(...sortedExtension.props.addProseMirrorPlugins(this));
            return pluginArray;
          }, [/*initially empty*/]),
        }),

        dispatchTransaction: (tr) => {
          this.view.updateState(this.view.state.apply(tr));

          if(this.updateReactStateCallback) {
            this.updateReactStateCallback(this.view.state);
          } /* else -- not initialized yet, nothing to do */
        },
      });

    this.viewMounted = true/*EditorView initialized*/;
    this.view.focus();
  }

  /** query whether the Editor's {@link EditorView} is mounted */
  public isViewMounted() {
    return this.viewMounted;
  }

  /**
   * set the callback that will update React's state with the latest
   * {@link EditorView}'s state whenever a {@link Transaction} is dispatched
   */
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
   * get the attributes of the given {@link NodeName} or {@link MarkName} at
   * the Selection if a Node or Mark with said name currently exists there
   */
  public getAttributes(name: string) {
    if(Object.values(NodeName).includes(name as NodeName/*check*/)) {
      return getNodeAttributesFromView(this.view.state, name as NodeName/*guaranteed by check*/);
    } /* else -- not a Node */

    if(Object.values(MarkName).includes(name as MarkName/*check*/)) {
      getMarkAttributesFromView(this.view.state, name as MarkName/*guaranteed by check*/);
    } /* else -- not a Node or a Mark*/

    return {/*default no attributes*/};
  }

  /**
   * query whether the Node or Mark with the given name
   * is active in the current Selection
   */
  public isNodeOrMarkActive(name: string, attributes: Attributes = {/*default no attrs*/}) {
    if(Object.values(NodeName).includes(name as NodeName/*check*/)) {
      return isNodeActive(this.view.state, name as NodeName/*guaranteed by check above*/, attributes);
    } /* else -- not a Node */

    if(Object.values(MarkName).includes(name as MarkName/*check*/)) {
      return isMarkActive(this.view.state, name as MarkName/*guaranteed by check above*/, attributes);
    } /* else -- not a Node or a Mark*/

    return false/*default not active*/;
  }
}
