import { Plugin } from 'prosemirror-state';

import { Extension } from 'notebookEditor/extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Document } from 'notebookEditor/extension/document';
import { Heading } from 'notebookEditor/extension/heading';
import { History } from 'notebookEditor/extension/history';
import { Paragraph } from 'notebookEditor/extension/paragraph';
import { Text } from 'notebookEditor/extension/text';

import { Editor } from './Editor';

// ********************************************************************************
// == Definition ==================================================================
// the set of extensions that get added to the Editor
export const editorDefinition: Extension[] = [
  BasicKeymap,
  History,
  Document,
  Heading,
  Paragraph,
  Text,
];

// == Util ========================================================================
/**
 * sort the {@link Plugin}s added by the given {@link Extension}s by
 * priority order. Those whose {@link Extension}s have a higher priority will
 * run first
 */
export const sortExtensionPlugins = (editor: Editor, extensions: Extension[]): Plugin[] => {
  const sortedByPriority = extensions.sort((extension, nextExtension) => {
    const { priority: extensionPriority } = extension.props,
          { priority: nextExtensionPriority } = nextExtension.props;

    if(extensionPriority < nextExtensionPriority) return -1/*executes before*/;
    if(extensionPriority === nextExtensionPriority) return 0/*executes by order of appearance*/;
    if(extensionPriority > nextExtensionPriority) return 1/*executes after*/;

    return 0/*default to executing by order of appearance*/;
  });

  const x = sortedByPriority.reverse(/*ensure higher priority first*/).reduce<Plugin[]>((pluginArray, sortedExtension) => {
    pluginArray.push(...sortedExtension.props.addProseMirrorPlugins(editor));

    return pluginArray;
  }, [/*initially empty*/]);

  return x;
};

