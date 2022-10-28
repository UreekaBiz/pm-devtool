import { storedMarksFromDOM, AttributeType, MarkHolderAttributes } from 'common';
import { NodeExtensionAttributes } from '../type';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const MarkHolderAttrs: NodeExtensionAttributes<MarkHolderAttributes> = {
  [AttributeType.StoredMarks]: {
    default: '[]'/*empty array*/,

    // parse the stored marks from the copied HTML
    // SEE: MarkHolderNodeRendererSpec
    parseHTML: (element): string => {
      const attributeStoredMarks = element.getAttribute(AttributeType.StoredMarks);
      if(!attributeStoredMarks) return '[]'/*empty array*/;

      const stringifiedJSONMarksArray = storedMarksFromDOM(attributeStoredMarks)/*(SEE: markHolder.ts)*/;
      return stringifiedJSONMarksArray;
    },
  },
};
