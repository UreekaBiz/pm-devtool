import { Schema } from 'prosemirror-model';
import { Command, EditorState, Plugin } from 'prosemirror-state';
import { EditorView, NodeViewConstructor } from 'prosemirror-view';

import { MarkName, NodeName } from 'common';

import { AbstractNodeController, DialogStorage, NodeViewStorage } from 'notebookEditor/model';
import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { TransactionListenerType } from 'notebookEditor/extension/type/Extension/type';
import { sortExtensionsByPriority } from 'notebookEditor/extension/type/Extension/util';
import { getMarkSpecs } from 'notebookEditor/extension/type/MarkExtension/util';
import { getNodeSpecs, getTopNode, isNodeExtension } from 'notebookEditor/extension/type/NodeExtension/util';
import { InputRule, inputRulesPlugin } from 'notebookEditor/plugin/inputRule/InputRule';
import { createPasteRulePlugins, PasteRule } from 'notebookEditor/plugin/pasteRule/PasteRule';

import { EditorContentProps, EditorContentState } from './component/EditorContent';
import { getMarkAttributesFromState, getNodeAttributesFromState } from './util';

// ********************************************************************************
// == Class =======================================================================
/**
 * the Data structure that initializes, maintains methods and ways to interact
 * with the Editor itself, (i.e. stripped of React specific logic) (SEE: Editor.ts)
 */
export class Editor {
  // -- Attribute -----------------------------------------------------------------
  // .. Private ...................................................................
  /** the {@link Extension}s that will be used by the Editor */
  private extensions: Extension[];

  /**
   * the {@link TransactionListeners} added by {@link Extensions} that
   * get triggered after a Transaction has been dispatched
   */
  private transactionListeners: TransactionListenerType[];

  /** the {@link Schema} that the {@link EditorView}'s will use */
  private schema: Schema;

  /** whether or not the {@link EditorView} has been fully mounted */
  private viewMounted: boolean;

  /** utility to set the Callback that updates React's state with the new
   * {@link Editor}'s whenever a {@link Transaction} is dispatched
   */
  private updateReactEditorCallback: () => void;

  // .. Public ....................................................................
  /** the React component where the Editor's content is displayed */
  public contentComponent: React.Component<EditorContentProps, EditorContentState> | null;

  /** the {@link HTMLElement} that holds Editor's {@link EditorView} */
  public element: HTMLElement;

  /** the Editor's {@link EditorView} object */
  public view: EditorView;

  /**
   * map containing NodeNames and mapping them to their storage, which
   * holds references to their {@link AbstractNodeController}s
   */
  public storage: Map<NodeName | MarkName, NodeViewStorage<AbstractNodeController<any, any>> | DialogStorage>;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(extensions: Extension[], updateReactEditorCallback: () => void) {
    // .. Private .................................................................
    this.extensions = sortExtensionsByPriority(extensions);
    this.transactionListeners = this.initializeTransactionListeners();
    this.schema = this.buildSchemaFromExtensions(this.extensions);
    this.viewMounted = false/*by definition*/;
    this.updateReactEditorCallback = updateReactEditorCallback;

    // .. Public ..................................................................
    this.contentComponent = null/*not initialized yet*/;
    this.element = document.createElement('div')/*placeholder that will be replaced on mount (SEE: EditorContent.tsx)*/;
    this.view = new EditorView(null/*default empty*/, { state: EditorState.create({ schema: this.schema }) });
    this.storage = this.initializeStorage();
  }

  /** setup the {@link TransactionListener}s for the {@link Editor} */
  private initializeTransactionListeners() {
    return this.extensions.reduce<TransactionListenerType[]>((transactionListeners, currentExtension) => {
      const { transactionListener } = currentExtension.definition;
      if(transactionListener) {
        transactionListeners.push(transactionListener);
      } /* else -- ignore */

      return transactionListeners;
    }, [/*initially empty*/]);
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
          plugins: this.initializePlugins(),
        }),

        dispatchTransaction: (tr) => {
          this.view.updateState(this.view.state.apply(tr));
          this.updateReactEditorCallback();

          this.transactionListeners.forEach(listener => listener(this, tr));
        },

        nodeViews: this.initializeNodeViews(),
      });


    this.viewMounted = true/*EditorView initialized*/;
    setTimeout(() => this.focusView()/*after rendering*/);
  }

  /** set the Storages added by the {@link Extensions} in the Storage object */
  private initializeStorage() {
    const newStorage = new Map<NodeName | MarkName, NodeViewStorage<AbstractNodeController<any, any>> | DialogStorage>();
    this.extensions.forEach(extension => {
      const { name, storage } = extension;
      if(storage)  {
        newStorage.set(name as (NodeName | MarkName)/*by definition*/, storage);
      } /* else -- Extension does not add Storage, do nothing */
    });

    return newStorage;
  }

  /**
   * perform the necessary checks and things to ensure correct Plugin ordering
   * from the given set of Extensions
   * */
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

  /**
   * construct the object containing the information to
   * map nodeNames to their NodeViews, according to the definition in
   * the corresponding extension
   */
  private initializeNodeViews() {
    const nodeViewDefinitionObj = this.extensions.reduce<{[nodeName: string]: NodeViewConstructor; }>((nodeViewDefinitionObj, currentExtension) => {
      if(!isNodeExtension(currentExtension)) return nodeViewDefinitionObj/*do not add*/;

      const { defineNodeView } = currentExtension.definition;
      if(!defineNodeView) return nodeViewDefinitionObj/*do not add*/;

      const { name: nodeName } = currentExtension;
      nodeViewDefinitionObj[nodeName] = (node, view/*ignore since part of Editor*/, getPos, decorations, innerDecorations) => defineNodeView(this, node, getPos, decorations, innerDecorations);

      return nodeViewDefinitionObj;
    }, {/*initially empty*/});
    return nodeViewDefinitionObj;
  }

  /** destroy the {@link Editor}'s {@link EditorView} */
  public destroy() {
    if(!this.view.isDestroyed) {
      this.view.destroy();
    } /* else -- already destroyed, do nothing */
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
  // .. View ......................................................................
  /** query whether the Editor's {@link EditorView} is mounted */
  public isViewMounted() {
    return this.viewMounted;
  }

  /** focus the View */
  public focusView() {
    this.view.focus();
  }

  /** query whether or not the Editor's {@link EditorView} can be edited */
  public get isEditable() {
    return this.view.editable;
  }

  // .. Attribute .................................................................
  /**
   * get the attributes of the given {@link NodeName} or {@link MarkName} at
   * the Selection if a Node or Mark with said name currently exists there
   */
  public getAttributes(name: string) {
    if(Object.values(NodeName).includes(name as NodeName/*check*/)) {
      return getNodeAttributesFromState(this.view.state, name as NodeName/*guaranteed by check*/);
    } /* else -- not a Node */

    if(Object.values(MarkName).includes(name as MarkName/*check*/)) {
      getMarkAttributesFromState(this.view.state, name as MarkName/*guaranteed by check*/);
    } /* else -- not a Node or a Mark*/

    return {/*default no attributes*/};
  }
}
