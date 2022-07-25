import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { DATA_NODE_TYPE } from 'common';
import { getPosType } from 'notebookEditor/extension/util/node';

import { NodeViewStorage } from './NodeViewStorage';
import { AbstractNodeController } from './AbstractNodeController';
import { AbstractNodeModel } from './AbstractNodeModel';

// ********************************************************************************
/**
 * Abstract class renders the corresponding DOM nodes for a NodeController.
 * see: {@link AbstractNodeController}
 */
export abstract class AbstractNodeView<NodeType extends ProseMirrorNode, Storage extends NodeViewStorage<AbstractNodeController<NodeType, any, any, any>>, NodeModel extends AbstractNodeModel<NodeType, Storage>> {
  // == Abstract Node View ========================================================
  /**
   * The outer DOM node that represents the document node.
   */
  public readonly dom: HTMLElement;

  /**
   * The DOM node that should hold the node's content. Only meaningful if its node
   * type is not a leaf node type. When this is present, ProseMirror will take
   * care of rendering the node's children into it. When it is not present, the
   * node view itself is responsible for rendering (or deciding not to render) its
   * child nodes.
   */
  public contentDOM?: Node | null | undefined;

  // ------------------------------------------------------------------------------
  /**
   * The corresponding model for this view.
   */
  readonly model: NodeModel;

  // ==============================================================================
  readonly editor: Editor;
  public node: NodeType;
  readonly storage: Storage;
  readonly getPos: getPosType;

  // == Life-Cycle ================================================================
  public constructor(model: NodeModel, editor: Editor, node: NodeType, storage: Storage, getPos: getPosType) {
    this.editor = editor;
    this.node = node;
    this.storage = storage;
    this.getPos = getPos;

    this.model = model;

    // Creates the outer DOM node.
    this.dom = this.createDomElement();
    this.dom.setAttribute(DATA_NODE_TYPE, node.type.name);
  }

  // == View ======================================================================
  // Creates the outer DOM node that represents the document node.
  // Must be implemented by subclasses.
  protected abstract createDomElement(): HTMLElement;

  // Updates the DOM node that represents the Node.
  // Must be implemented by subclasses.
  // NOTE: This method needs to be public since its render view could depend on
  //       an external state (e.g. the visualId of the CodeBlockView) and thus
  //       needs to be called from outside the class.
  public abstract updateView(): void;
}
