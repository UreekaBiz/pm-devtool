import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { generateNodeId, JSONNode, NodeGroup, NodeIdentifier, NodeName, ProseMirrorNodeContent } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const HeadingAttributesSpec = {
  [AttributeType.Id]: noNodeOrMarkSpecAttributeDefaultValue<NodeIdentifier>(),

  [AttributeType.Level]: noNodeOrMarkSpecAttributeDefaultValue<HeadingLevel>(),

  [AttributeType.BackgroundColor]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.Color]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.FontSize]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type HeadingAttributes = AttributesTypeFromNodeSpecAttributes<typeof HeadingAttributesSpec>;

// == Type ========================================================================
// NOTE: types defined before spec so that they can be used by it
export enum HeadingLevel { One = 1, Two = 2, Three = 3, Four = 4, Five = 5, Six = 6 }
export const isHeadingLevel = (level: number): level is HeadingLevel => level in HeadingLevel;

/** Gets the heading level from a H1-H6 tag. This tag is case insensitive. */
export const getHeadingLevelFromTag = (tag: string): HeadingLevel | undefined => {
  const match = tag.match(/^h([1-6])$/i);
  if(!match) return undefined/*invalid heading level*/;

  const level = parseInt(match[1]/*second element is the one in the group selection from the regex*/);
  // Only return a valid value.
  if(isHeadingLevel(level)) return level/*nothing else to do*/;
  return undefined;
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type HeadingNodeType = ProseMirrorNode & { attrs: HeadingAttributes; };
export const isHeadingNode = (node: ProseMirrorNode): node is HeadingNodeType => node.type.name === NodeName.HEADING;

export const getHeadingNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.HEADING];
export const createHeadingNode = (schema: NotebookSchemaType, attributes?: Partial<HeadingAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getHeadingNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type HeadingJSONNodeType = JSONNode<HeadingAttributes> & { type: NodeName.HEADING; };
export const isHeadingJSONNode = (node: JSONNode): node is HeadingJSONNodeType => node.type === NodeName.HEADING;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const HeadingNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeGroup.INLINE}*`,
  group: NodeGroup.BLOCK,
  marks: '_'/*all Marks allowed*/,

  // .. Attribute .................................................................
  attrs: HeadingAttributesSpec,

  // .. Misc ......................................................................
  selectable: false/*cannot be set as NodeSelection*/,
  defining: true,
};

// -- Render Spec -----------------------------------------------------------------
export const HeadingNodeRendererSpec: NodeRendererSpec<HeadingAttributes> = {
  tag: attributes => {
    switch(attributes[AttributeType.Level]) {
      default: /*use H1 if level is unknown*/
      case HeadingLevel.One:
        return 'h1';
      case HeadingLevel.Two:
        return 'h2';
      case HeadingLevel.Three:
        return 'h3';
      case HeadingLevel.Four:
        return 'h4';
      case HeadingLevel.Five:
        return 'h5';
      case HeadingLevel.Six:
        return 'h6';
    }
  },

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Util ========================================================================
export const DEFAULT_HEADING_LEVEL: HeadingLevel = HeadingLevel.One;
export const DEFAULT_HEADING_STYLE_SET = false;

/** create a default set of Attributes for a Heading Node */
export const createDefaultHeadingAttributes = (level: number) =>
  ({
    id: generateNodeId()/*unique for each invocation*/,

    level,
  });

