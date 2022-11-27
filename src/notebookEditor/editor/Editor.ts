import { Schema } from 'prosemirror-model';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorView, DirectEditorProps, NodeViewConstructor } from 'prosemirror-view';

import { NodeName, MarkName } from 'common';

import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { TransactionListenerType } from 'notebookEditor/extension/type/Extension/type';
import { sortExtensionsByPriority } from 'notebookEditor/extension/type/Extension/util';
import { getMarkSpecs } from 'notebookEditor/extension/type/MarkExtension/util';
import { getNodeSpecs, getTopNode, isNodeExtension } from 'notebookEditor/extension/type/NodeExtension/util';
import { NodeViewStorage, AbstractNodeController, DialogStorage } from 'notebookEditor/model';
import { inputRulesPlugin, InputRule } from 'notebookEditor/plugin/inputRule/InputRule';
import { createPasteRulePlugins, PasteRule } from 'notebookEditor/plugin/pasteRule/PasteRule';

import { EditorContentProps, EditorContentState } from './component/EditorContent';
import { getMarkAttributesFromState, getNodeAttributesFromState } from './util';


// ********************************************************************************
// == Editor ======================================================================
/**
 * the Data structure that initializes, maintains methods and ways to interact
 * with the Editor itself, (i.e. stripped of React specific logic) (SEE: Editor.ts)
 */
export class Editor {
  /** the {@link Extension}s that will be used by the Editor */
  private extensions: Extension[];

  /** the {@link Schema} that the {@link EditorView}'s will use */
  private schema: Schema;

  // -- View ----------------------------------------------------------------------
  /** the Editor's {@link EditorView} object */
  public view: EditorView;

  /** the {@link HTMLElement} that holds Editor's {@link EditorView} */
  public htmlViewElement: HTMLElement;

  /** whether or not the {@link EditorView} has been fully mounted */
  // NOTE: not called `isViewMounted` since it is a getter
  private viewMounted: boolean;

  /** the React component where the Editor's content is displayed */
  public contentComponent: React.Component<EditorContentProps, EditorContentState> | null;

  // -- Storage -------------------------------------------------------------------
  /**
   * map containing NodeNames and mapping them to their storage, which
   * holds references to their {@link AbstractNodeController}s
   */
  public storage: Map<NodeName | MarkName, NodeViewStorage<AbstractNodeController<any, any>> | DialogStorage>;

  // ------------------------------------------------------------------------------
  /**
   * the {@link TransactionListeners} added by {@link Extensions} that
   * get triggered after a Transaction has been dispatched
   */
  private transactionListeners: TransactionListenerType[];

  /** utility to set the Callback that updates React's state with the new
   * {@link Editor}'s whenever a {@link Transaction} is dispatched
   */
  private updateReactEditorCallback: () => void;


  // -- Lifecycle -----------------------------------------------------------------
  constructor(extensions: Extension[], updateReactEditorCallback: () => void) {
    this.extensions = sortExtensionsByPriority(extensions);
    this.updateReactEditorCallback = updateReactEditorCallback;

    // create the schema from the extensions
    this.schema = this.buildSchemaFromExtensions(this.extensions);

    // create the Editor view with the previously created schema
    this.view = new EditorView(null/*default empty*/, { state: EditorState.create({ schema: this.schema }) });
    this.htmlViewElement = document.createElement('div')/*placeholder that will be replaced on mount (SEE: EditorContent.tsx)*/;
    this.viewMounted = false/*by definition*/;
    this.contentComponent = null/*not initialized yet*/;

    this.storage = this.initializeStorage();

    this.transactionListeners = this.initializeTransactionListeners();
  }

  // CHECK: create an observable?
  /** initializes the {@link TransactionListener}s for the {@link Editor} */
  private initializeTransactionListeners() {
    return this.extensions.reduce<TransactionListenerType[]>((transactionListeners, extension) => {
      const { transactionListener } = extension.definition;
      if(!transactionListener) return transactionListeners/*nothing else to do*/;

      // save the listener
      transactionListeners.push(transactionListener);
      return transactionListeners;
    }, [/*initially empty*/]);
  }

  /** create a {@link Schema} from the given {@link Extension}s */
  private buildSchemaFromExtensions(extensions: Extension[]) {
    const nodes = getNodeSpecs(extensions);
    const marks = getMarkSpecs(extensions);
    const topNode = getTopNode(extensions);

    return new Schema({ topNode, nodes, marks });
  }

  /** destroy the {@link Editor}'s {@link EditorView} */
  public destroy() {
    if(!this.view.isDestroyed) {
      this.view.destroy();
    } /* else -- already destroyed, do nothing */
  }

  // -- View ----------------------------------------------------------------------
  /** mount the Editor's {@link EditorView} */
  public mountView(root: HTMLElement) {
    const props: DirectEditorProps = {
      state: EditorState.create({
        schema: this.schema,
        // NOTE: expects the extensions to be ordered by priority (which happens
        //       in the Editor constructor)
        plugins: this.initializePlugins(),
      }),

      dispatchTransaction: this.onDispatchTransaction.bind(this),
      nodeViews: this.initializeNodeViews(),
    };

    // creates the view
    this.view = new EditorView(root, props);
    this.viewMounted = true/*by definition*/;

    // focus the View for the firs time
    setTimeout(() => this.view.focus()/*after rendering*/);
  }

  /** called when there is a new Transaction to be dispatched on the view. It
   * updates the React's state with the new Editor and then calls the
   * {@link TransactionListener}s*/
  // FIXME: make it an observable?
  private onDispatchTransaction = (transaction: Transaction) => {
    // updates the view and the React's state
    this.view.updateState(this.view.state.apply(transaction));
    this.updateReactEditorCallback();

    // call the Transaction listeners
    this.transactionListeners.forEach(listener => listener(this, transaction));
  };

  // -- Storage -------------------------------------------------------------------
  /** set the Storages defined by the {@link Extensions} in the Storage map */
  private initializeStorage() {
    const editorStorage = new Map<NodeName | MarkName, NodeViewStorage<AbstractNodeController<any, any>> | DialogStorage>();
    this.extensions.forEach(extension => {
      const { name, storage } = extension;
      if(!storage) return/*nothing else to do*/;

      // FIXME: no need to cast! (SEE: Extension.ts)
      editorStorage.set(name as (NodeName | MarkName)/*by definition*/, storage);
    });

    return editorStorage;
  }

  // -- Plugin --------------------------------------------------------------------
  /** initialize the plugins defined by the {@link Extensions} */
  private initializePlugins(): Plugin[] {
    // get InputRules
    const inputRules = this.extensions.reduce<InputRule[]>((pluginArray, sortedExtension) => {
      pluginArray.push(...sortedExtension.definition.inputRules(this));
      return pluginArray;
    }, [/*initially empty*/]);

    // get PasteRules
    const pasteRules = this.extensions.reduce<PasteRule[]>((pluginArray, sortedExtension) => {
      pluginArray.push(...sortedExtension.definition.pasteRules(this));
      return pluginArray;
    }, [/*initially empty*/]);
    const pasteRulePlugins = createPasteRulePlugins({ rules: pasteRules });

    // add Extension plugins
    const initializedPlugins = this.extensions.reduce<Plugin[]>((pluginArray, sortedExtension) => {
      pluginArray.push(...sortedExtension.definition.addProseMirrorPlugins(this, sortedExtension.storage));
      return pluginArray;
    }, [inputRulesPlugin({ rules: inputRules }), ...pasteRulePlugins]);

    return initializedPlugins;
  }

  // -- NodeView ------------------------------------------------------------------
  /**
   * create the NodeViews definitions for the {@link EditorView} from the
   * {@link Extension}s */
  private initializeNodeViews() {
    const nodeViewsDefinition = this.extensions.reduce<Record<string, NodeViewConstructor>>((current, extension) => {
      if(!isNodeExtension(extension)) return current/*nothing to do*/;

      const { defineNodeView } = extension.definition;
      if(!defineNodeView) return current/*nothing to do*/;

      const { name: nodeName } = extension;
      current[nodeName] = (node, view/*ignore since part of Editor*/, getPos, decorations, innerDecorations) =>
                            defineNodeView(this, node, getPos, decorations, innerDecorations);

      return current;
    }, {/*initial value*/});

    return nodeViewsDefinition;
  }

  // -- Util ----------------------------------------------------------------------
  // .. View ......................................................................
  /** query whether the Editor's {@link EditorView} is mounted */
  public isViewMounted() {
    return this.viewMounted;
  }

  /** query whether or not the Editor's {@link EditorView} can be edited */
  public get isEditable() {
    return this.view.editable;
  }

  // .. Attribute .................................................................
  // FIXME: move to an utility function that works with the EditorState rather than
  //        a method for the Editor.
  /**
   * get the attributes of the given {@link NodeName} or {@link MarkName} at
   * the Selection if a Node or Mark with said name currently exists there
   */
  public getAttributes(name: string) {
    // FIXME: use a isMarkName utility function?
    if(Object.values(MarkName).includes(name as MarkName/*check*/)) {
      getMarkAttributesFromState(this.view.state, name as MarkName/*guaranteed by check*/);
    } /* else -- not a Node or a Mark*/

    // FIXME: use a isNodeName utility function?
    if(Object.values(NodeName).includes(name as NodeName/*check*/)) {
      return getNodeAttributesFromState(this.view.state, name as NodeName/*guaranteed by check*/);
    } /* else -- not a Node */

    return {/*default no attributes*/};
  }
}
