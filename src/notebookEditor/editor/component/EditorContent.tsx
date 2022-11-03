import React, { HTMLProps } from 'react';
import ReactDOM from 'react-dom';

import { Editor } from '../Editor';
import { ReactRenderer } from './ReactRenderer';

// ********************************************************************************
// == Interface ===================================================================
export interface EditorContentProps extends HTMLProps<HTMLDivElement> { editor: Editor | null; }
export interface EditorContentState { renderers: Map<string, ReactRenderer>; }

// == Class =======================================================================
/**
 * the React component where the Editor's content is rendered. Must be done this
 * way so that Portals (ReactRenderer objects, (SEE: React.Renderer)) can be added
 * to it (e.g. Suggestion Modals, etc)
 */
export class PureEditorContent extends React.Component<EditorContentProps, EditorContentState> {
  // -- Attribute -----------------------------------------------------------------
  public editorContentRef: React.RefObject<HTMLDivElement>;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(props: EditorContentProps) {
    super(props);
    this.editorContentRef = React.createRef();
    this.state = { renderers: new Map() };
  }
  init() {
    const { editor } = this.props;
    if(!editor || !editor.element) return/*not ready*/;
    if(editor.contentComponent) return/*already setup*/;

    const element = this.editorContentRef.current;
    if(!element) return/*does not exist yet*/;

    element.append(...editor.element.childNodes);
    editor.element = element;
    editor.contentComponent = this;

    if(editor.isViewMounted()) return/*already mounted*/;

    editor.mountView(editor.element);
  }

  // -- Update --------------------------------------------------------------------
  componentDidMount() { this.init(); }
  componentDidUpdate() { this.init(); }

  // -- Destroy -------------------------------------------------------------------
  componentWillUnmount() {
    const { editor } = this.props;
    if(!editor) return/*nothing to do*/;

    editor.contentComponent = null;
    if(!editor.element.firstChild) return;


    const newElement = document.createElement('div');
    newElement.append(...editor.element.childNodes);

    editor.element = newElement;
  }

  // -- UI ------------------------------------------------------------------------
  render() {
    const { editor, ...rest } = this.props;
    return (<><div ref={this.editorContentRef} {...rest} /><Portals renderers={this.state.renderers} /></>);
  }
}

// == Functional Component ========================================================
// React components that get added to the Editor's React View
const Portals: React.FC<{ renderers: Map<string, ReactRenderer>; }> = ({ renderers }) =>
  <>{Array.from(renderers).map(([key, renderer]) => ReactDOM.createPortal(renderer.reactElement, renderer.element, key))}</>;

// == Component ===================================================================
export const EditorContent = React.memo(PureEditorContent);
