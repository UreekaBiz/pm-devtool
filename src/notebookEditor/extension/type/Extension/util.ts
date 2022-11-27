import { Mark as ProseMirrorMark, Node as ProseMirrorNode, ParseRule } from 'prosemirror-model';

import { isValidHTMLElement, AttributeSpecWithParseHTML, DefaultAttributeType } from 'notebookEditor/extension/util';

import { Extension } from './Extension';

// ********************************************************************************
// == Extension ===================================================================
export const sortExtensionsByPriority = (extensions: Extension[]) =>
  extensions.sort((extension, nextExtension) => {
    const { priority: extensionPriority } = extension,
          { priority: nextExtensionPriority } = nextExtension;

    if(extensionPriority < nextExtensionPriority) return -1/*executes before*/;
    if(extensionPriority === nextExtensionPriority) return 0/*executes by order of appearance*/;
    if(extensionPriority > nextExtensionPriority) return 1/*executes after*/;

    return 0/*default to executing by order of appearance*/;
  }).reverse(/*ensure higher priority goes first*/);


// == Parse =======================================================================
// NOTE: types not in type.ts since they are only used here
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

         const attrsObj = Object.entries(attrs).reduce<{ [attr: string]: string | string[] | boolean | number | number[] | undefined; }>((previousObj, currentEntry) => {
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
  * returns an object containing the values that will be added as HTMLAttributes
  * to the DOM representation of the given {@link ProseMirrorNode} or
  * {@link ProseMirrorMark}. If the Node or Mark has them, they will be set.
  * Otherwise the default value defined in its {@link AttributeSpecWithParseHTML}
  * will be used
 */
 export const getExtensionAttributesObject = (nodeOrMark: ProseMirrorNode | ProseMirrorMark, attrs: AttributeDefinitionObjectType) =>
   Object.entries(attrs).reduce<{ [attrName: string]: DefaultAttributeType; }>((previousObj, currentAttrDefinition) => {
     const attrName = currentAttrDefinition[0/*the key*/];
     const attrSpecWithParseHTML = currentAttrDefinition[1/*the value*/];

     previousObj[attrName] = nodeOrMark.attrs[attrName] ?? attrSpecWithParseHTML.default;
     return previousObj;
   }, {/*default empty*/});

