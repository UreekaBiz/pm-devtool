import { MarkSpec, NodeSpec, ParseRule } from 'prosemirror-model';

import { isValidHTMLElement } from '../util';
import { AttributeSpecWithParseHTML, Extension } from './Extension';
import { MarkExtension } from './MarkExtension';
import { NodeExtension } from './NodeExtension';

// ********************************************************************************
// == Extension ===================================================================
export const sortExtensionsByPriority = (extensions: Extension[]) =>
  extensions.sort((extension, nextExtension) => {
    const { priority: extensionPriority } = extension.props,
          { priority: nextExtensionPriority } = nextExtension.props;

    if(extensionPriority < nextExtensionPriority) return -1/*executes before*/;
    if(extensionPriority === nextExtensionPriority) return 0/*executes by order of appearance*/;
    if(extensionPriority > nextExtensionPriority) return 1/*executes after*/;

    return 0/*default to executing by order of appearance*/;
  }).reverse(/*ensure higher priority goes first*/);

// == NodeExtension ===============================================================
/**
 * return an array containing only {@link NodeExtension}s given an array of
 * {@link Extension}s
 */
export const getNodeSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: NodeSpec; }>((nodeExtensions, currentExtension) => {
  if(isNodeExtension(currentExtension)) {
    nodeExtensions[currentExtension.props.name] = currentExtension.props.nodeSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

/**
 * returns the name of the {@link NodeSpec} that contains the 'topNode'
 * property, which indicates that it is the root of the Document
 */
export const getTopNode = (nodeSpecs: { [name: string]: NodeSpec; }) => {
  const topNodeSpec = Object.values(nodeSpecs).find(nodeSpec => nodeSpec.topNode);
  if(!topNodeSpec) throw new Error('Cannot create a Document without a topNode');

  return topNodeSpec.name;
};

/** check whether the given {@link Extension} is a {@link NodeExtension} */
export const isNodeExtension = (extension: Extension): extension is NodeExtension => 'nodeSpec' in extension.props;

// == MarkExtension ===============================================================
/**
 * return an array containing only {@link MarkExtension}s given an array of
 * {@link Extension}s
 */
export const getMarkSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: MarkSpec; }>((nodeExtensions, currentExtension) => {
  if(isMarkExtension(currentExtension)) {
    nodeExtensions[currentExtension.props.name] = currentExtension.props.markSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

/** check whether the given {@link Extension} is a {@link MarkExtension} */
export const isMarkExtension = (extension: Extension): extension is MarkExtension => 'markSpec' in extension.props;

// == Parse =======================================================================
/**
 * since getAttribute is the attribute set by the function, it is the only one
 * that should not be specified
 */
type CreateExtensionParseRuleType = Omit<ParseRule, 'getAttrs'>;

/**
 * ensures that ParseRules with the specified parseHTML functions
 * declared for all attributes get created for each tag that gets specified
 */
export const createExtensionParseRules = (partialParseRules: CreateExtensionParseRuleType[], attrs: { [attributeName: string]: AttributeSpecWithParseHTML; }): ParseRule[] => {
  const parseRules: ParseRule[] = [/*initially empty*/];

  partialParseRules.forEach((partialRule) => {
    parseRules.push({
      ...partialRule,
      getAttrs: (node) => {
        if(!isValidHTMLElement(node)) return {/* no attrs */};

        const attrsObj = Object.entries(attrs).reduce<{ [attr: string]: string | number | boolean | string[] | undefined; }>((previousObj, currentEntry) => {
          const [attrName, attrSpecWithParseHTML] = currentEntry;
          const { parseHTML } =attrSpecWithParseHTML;

          const attrValue = parseHTML(node);
          if(attrValue) {
            previousObj[attrName] = attrValue;
          } /* else -- do not add to returned object */

          return previousObj;
        }, {/*default empty*/});

        return attrsObj;
      },
    });
  });

  return parseRules;
};

