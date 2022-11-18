import { flushSync } from 'react-dom';

import { customNanoid } from 'common';

import { Editor } from '../Editor';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/react/src/ReactRenderer.tsx

// == Interface ===================================================================
export interface ReactRendererOptions {
  editor: Editor;
  props?: Record<string, any>;
  as?: string;
  className?: string;
}

// == Type ========================================================================
type ComponentType<R, P> = React.ComponentClass<P> | React.FunctionComponent<P> | React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<R>>;

// == Class ========================================================================
/**
 * class used by any components that must be rendered into the Editors content
 * component (e.g. Suggestions) (SEE: EditorContent.ts)
 */
export class ReactRenderer<R = unknown, P = unknown> {
  // -- Attribute -----------------------------------------------------------------
  public id: string;
  public editor: Editor;
  public component: any;
  public element: Element;
  public props: Record<string, any>;
  public reactElement: React.ReactNode;
  public ref: R | null = null/*default none*/;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(component: ComponentType<R, P>, { editor, props = {/*default none*/}, as = 'div', className = '' }: ReactRendererOptions) {
    this.id = customNanoid();
    this.component = component;
    this.editor = editor;
    this.props = props;
    this.element = document.createElement(as);
    this.element.classList.add('react-renderer');

    if(className) {
      this.element.classList.add(...className.split(' '));
    } /* else -- no className given */

    this.render();
  }

  // -- Update --------------------------------------------------------------------
  updateProps(props: Record<string, any> = {/*default none*/}): void {
    this.props = { ...this.props, ...props };
    this.render();
  }

  // -- Destroy -------------------------------------------------------------------
  destroy(): void {
    queueMicrotask(() => {
      flushSync(() => {
        if(this.editor?.contentComponent) {
          const { renderers } = this.editor.contentComponent.state;
          renderers.delete(this.id);
          this.editor.contentComponent.setState({ renderers });
        } /* else -- there is no contentComponent to update its state */
      });
    });
  }

  // -- UI ------------------------------------------------------------------------
  render(): void {
    const Component = this.component;
    const props = this.props;

    if(isClassComponent(Component) || isForwardRefComponent(Component)) {
      props.ref = (ref: R) => { this.ref = ref; };
    } /* else -- not a class component or a forwarded ref component */

    this.reactElement = <Component {...props } />;

    queueMicrotask(() => {
      flushSync(() => {
        if(this.editor?.contentComponent) {
          this.editor.contentComponent.setState({ renderers: this.editor.contentComponent.state.renderers.set( this.id, this) });
        } /* else -- there is no contentComponent to update its state */
      });
    });
  }
}

// == Util ========================================================================
const isClassComponent = (Component: any) =>
  !!(typeof Component === 'function' && Component.prototype && Component.prototype.isReactComponent);

const isForwardRefComponent = (Component: any) =>
  !!(typeof Component === 'object' && Component.$$typeof?.toString() === 'Symbol(react.forward_ref)');
