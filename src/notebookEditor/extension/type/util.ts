import { Mark as ProseMirrorMark, MarkSpec, Node as ProseMirrorNode, NodeSpec, ParseRule } from 'prosemirror-model';

import { isValidHTMLElement } from '../util';
import { AttributeSpecWithParseHTML, DefaultAttributeType, Extension } from './Extension';
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
export const getTopNode = (extensions: Extension[]) => {
  const topNodeName = extensions.find(extension => isNodeExtension(extension) && extension.props.nodeSpec.topNode)?.props.name;
  if(!topNodeName) throw new Error('Cannot create a Document without a topNode');

  return topNodeName;
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
 * an object that contains the names of the attributes of a {@link NodeExtension}
 * or a {@link MarkExtension} and maps to their {@link AttributeSpecWithParseHTML}
 */
type AttributeDefinitionObjectType = { [attributeName: string]: AttributeSpecWithParseHTML; }

/**
 * ensures that ParseRules with the specified parseHTML functions
 * declared for all attributes get created for each tag that gets specified
 */
export const createExtensionParseRules = (partialParseRules: CreateExtensionParseRuleType[], attrs: AttributeDefinitionObjectType): ParseRule[] => {
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

// == Render ======================================================================
/**
 * returns an object with the specified default values in the given
 * {@link AttributeDefinitionObjectType} object so that they are added to the
 * toDOM definition of a {@link NodeExtension} or {@link MarkExtension}, as
 * HTMLAttributes. If the node has the attribute present, it will be returned as
 * part of the object, otherwise it will have the default value
*/
export const getExtensionDefaultAttributes = (nodeOrMark: ProseMirrorNode | ProseMirrorMark, attrs: AttributeDefinitionObjectType) =>
  Object.entries(attrs).reduce<{ [attrName: string]: DefaultAttributeType; }>((previousObj, currentAttrDefinition) => {
    const attrName = currentAttrDefinition[0/*the key*/];
    const attrSpecWithParseHTML = currentAttrDefinition[1/*the value*/];

    previousObj[attrName] = nodeOrMark.attrs[attrName] ?? attrSpecWithParseHTML.default;
    return previousObj;
  }, {/*default empty*/});

