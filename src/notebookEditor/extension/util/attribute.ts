import { Node as ProseMirrorNode } from 'prosemirror-model';

import { camelToKebabCase, generateNodeId, getHeadingThemeValue, getMarkValue, getNodeName, getSelectedNode, getThemeValue, isHeadingNode, isTextNode, mergeAttributeValues, AttributeType, HeadingLevel, InvalidMergedAttributeValue, MarkName, MergedAttributeValue, SetAttributeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { isNodeViewStorage } from 'notebookEditor/model';

import { ExtensionStorageType } from '../type/Extension/type';
import { getMarkAttributesFromState } from 'notebookEditor/editor/util';

// ********************************************************************************
// == Type ========================================================================
export type DefaultAttributeType = string | number | boolean | string[] | null | undefined;
export type ParseHTMLAttributeType = (element: HTMLElement) => string | string[] | boolean | number | number[] | null;

// == Interface ===================================================================
/** defines how the attributes of an extension's spec should look when included  */
export interface AttributeSpecWithParseHTML {
  default: DefaultAttributeType;
  parseHTML: ParseHTMLAttributeType;
}

// == Util ========================================================================
/**
 * Sets the parsing behavior that will be used when parsing an attribute
 *
 * @param name The name of the attribute to be parsed
 * @param type The {@link SetAttributeType} for the attribute that will be parsed
 * @param defaultValue The default value of the attribute to be parsed
 * @returns The attribute spec object that defines the parsing behavior of the attribute
 */
export const setAttributeParsingBehavior = (name: string, type: SetAttributeType, defaultValue?: string | string[] | boolean | number | null | undefined, arrayValueType?: 'string' | 'number'): AttributeSpecWithParseHTML => {
  let parseHTML: (element: HTMLElement) => string | string[] | boolean | number | number[] | null = (element: HTMLElement) => element.getAttribute(name);

  switch(type) {
    case SetAttributeType.STRING:
      break/*use default*/;
    case SetAttributeType.STYLE:
      parseHTML = (element: HTMLElement) => element.style.getPropertyValue(camelToKebabCase(name));
      break/*use default*/;
    case SetAttributeType.BOOLEAN:
      parseHTML = (element: HTMLElement) => {
        const attr = element.getAttribute(name);
        if(attr === 'true') return true;
        return false;
      };
      break;
    case SetAttributeType.NUMBER:
      parseHTML = (element: HTMLElement) => Number(element.getAttribute(name));
      break;
    case SetAttributeType.ARRAY:
      parseHTML = (element: HTMLElement) => {
        const attr = element.getAttribute(name);
        if(!attr) {
          if(defaultValue === null) {
            return null/*explicitly chose to return null*/;
          } /* else -- return empty array */

          return [/*empty*/];
        }

        return arrayValueType === 'number' ? attr.split(',').map(element => Number(element)) : attr.split(',');
      };
      break/*use default*/;
  }

  return {
    default: defaultValue === null ? null/*explicitly chose to return null*/ : defaultValue,
    parseHTML,
  };
};

// --------------------------------------------------------------------------------
/** the default parsing behavior that should be used when working with unique ids.
 *  It creates a new id for each node that is created and when copy and paste is
 *  performed. */
// NOTE: Pasting a node will only create a new unique id when there is already a
//       node of the same type with the same id.
export const uniqueIdParsingBehavior = (storage: ExtensionStorageType) => {
  return {
    default: undefined/*no default*/,
    parseHTML: (element: HTMLElement) => {
      if(!isNodeViewStorage(storage)) return generateNodeId();

      const id = element.getAttribute(AttributeType.Id);
      const nodeView = id ? storage.getNodeView(id) : undefined/*none*/;

      // use existing id if it doesn't exist in storage and it's valid.
      if(!nodeView && id) return id;
      return generateNodeId();
    },
  };
};

// == Rendered values =============================================================
// Gets the DOM rendered value of the given Attribute in the current selected
// Text Node. In the case of a ranged selection a merging of the values will be
// attempted.
// There are multiple layers on how this value is determined, in order of priority:
// 1. The value of an Attribute in a Mark present on the Node.
// 2. The value of an Attribute in a Node.
// 3. The default value of an Attribute in a Node.
// 4. The value of an Attribute in the Theme.
// 5. The inherited value from a parent DOM element. In this case the editor don't
//   have an easy way to know what the actual value used is.
export const getTextDOMRenderedValue = (editor: Editor, attributeType: AttributeType, markName?: MarkName): MergedAttributeValue => {
  const { state } = editor.view;
  const { selection } = state;
  const start = selection.from,
        end = selection.to;

  // Get the initial value based on the active mark.
  // NOTE: This is needed in the case that a Node don't have a TextNode yet but the
  //       mark is active, when creating the TextNode it will this Mark active.
  const currentMarkAttributes = markName ? getMarkAttributesFromState(editor.view.state, markName) : undefined/*no mark attributes*/;
  let mergedValue: MergedAttributeValue = currentMarkAttributes ? currentMarkAttributes[attributeType] : undefined/*no value*/;

  // Merges the value of all different attributeType in the given range.
  state.doc.nodesBetween(start, end, (node, pos, parent) => {
    if(mergedValue === InvalidMergedAttributeValue) return false/*stop search*/;
    // Is a node that have at leas one child. This is needed since nodes that have
    // one child will take the attributes of the child.
    if(!isTextNode(node))  {
      if(node.childCount > 0) return/*nothing to do*/;
      const attributeValue = getDOMNodeRenderedValue(node, attributeType);
      mergedValue = mergeAttributeValues(mergedValue, attributeValue);
    }

    // Marks are applied to TextNodes only, get the Attribute value form the Mark.
    const markValue = markName ? getMarkValue(node, markName, attributeType) : undefined/*no mark value*/;
    // Value was found, merge it with mergedValue.
    if(markValue !== undefined) {
      mergedValue = mergeAttributeValues(mergedValue, markValue);
      return/*nothing else to do*/;
    } /* else -- no value was found for the given Mark */

    // TextNode will inherit the vale of the parent Node, use its attribute
    // value instead.
    const attributeValue = parent && getDOMNodeRenderedValue(parent, attributeType);
    mergedValue = mergeAttributeValues(mergedValue, attributeValue ?? undefined/*none*/);
    return/*nothing else to do*/;
  });

  // If no value was resolved and the selection is a single selection, the default
  // value of the TextNode at the position will be resolved to the parent node.
  if(start === end && mergedValue === undefined) {
    const node = getSelectedNode(state, selection.$anchor.depth/*parent node*/);
    if(node) { mergedValue = getDOMNodeRenderedValue(node, attributeType); }
  }

  return mergedValue;
};

// gets the DOM rendered value of the given Attribute in the given Node
export const getDOMNodeRenderedValue = (node: ProseMirrorNode, attributeType: AttributeType): string | undefined => {
  // Check if the value is defined on the attributes. If so, return it.
  // NOTE: The attributes also includes the default attributes, there is no need to
  //       do a special check for the default attributes.
  if(node.attrs[attributeType]) return node.attrs[attributeType];

  // Heading nodes are a special case since the FontSize and Color are defined
  // by its level
  if(isHeadingNode(node) && (attributeType === AttributeType.FontSize || attributeType === AttributeType.Color)) return getHeadingThemeValue(attributeType, node.attrs[AttributeType.Level] ?? HeadingLevel.One/*default level if not present*/);

  const nodeName = getNodeName(node);

  // Get the value from the current theme.
  const themeValue = getThemeValue(nodeName, attributeType);
  return themeValue;
};
