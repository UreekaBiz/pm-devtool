import { Node as ProseMirrorNode, NodeType, Schema } from 'prosemirror-model';

import { AttributeType } from 'common';

// helpers for creating a schema that supports tables

// ********************************************************************************
const getCellAttrs = (dom: HTMLElement, extraAttrs) => {
  const widthAttr = dom.getAttribute('data-colwidth');
  const widths =
    widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
      ? widthAttr.split(',').map((s) => Number(s))
      : null;
  const colspan = Number(dom.getAttribute(AttributeType.ColSpan) || 1);

  const resultAttrs = {
    colspan,
    rowspan: Number(dom.getAttribute(AttributeType.RowSpan) || 1),
    colwidth: widths && widths.length == colspan ? widths : null,
  };

  for(let prop in extraAttrs) {
    const getter = extraAttrs[prop].getFromDOM;
    const value = getter && getter(dom);
    if(value !== null) resultAttrs[prop] = value;
  }

  return resultAttrs;
};

const setCellAttrs = (node: ProseMirrorNode, extraAttrs) => {
  const attrs = {};
  if(node.attrs[AttributeType.ColSpan] !== 1) attrs[AttributeType.ColSpan] = node.attrs[AttributeType.ColSpan];
  if(node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan;
  if(node.attrs.colwidth) {
    attrs['data-colwidth'] = node.attrs.colwidth.join(',');
  }

  for(let prop in extraAttrs) {
    const setter = extraAttrs[prop].setDOMAttr;
    if(setter) {
      setter(node.attrs[prop], attrs);
    } /* else -- no setter available */
  }
  return attrs;
}

// :: (Object) → Object
//
// This function creates a set of [node
// specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
// `table`, `table_row`, and `table_cell` nodes types as used by this
// module. The result can then be added to the set of nodes when
// creating a a schema.
//
//   options::- The following options are understood:
//
//     tableGroup:: ?string
//     A group name (something like `'block'`) to add to the table
//     node type.
//
//     cellContent:: string
//     The content expression for table cells.
//
//     cellAttributes:: ?Object
//     Additional attributes to add to cells. Maps attribute names to
//     objects with the following properties:
//
//       default:: any
//       The attribute's default value.
//
//       getFromDOM:: ?(dom.Node) → any
//       A function to read the attribute's value from a DOM node.
//
//       setDOMAttr:: ?(value: any, attrs: Object)
//       A function to add the attribute's value to an attribute
//       object that's used to render the cell's DOM.
export function tableNodes(options) {
  let extraAttrs = options.cellAttributes || {};
  let cellAttrs = {
    colspan: { default: 1 },
    rowspan: { default: 1 },
    colwidth: { default: null },
  };
  for (let prop in extraAttrs)
    cellAttrs[prop] = { default: extraAttrs[prop].default };

  return {
    table: {
      content: 'table_row+',
      tableRole: 'table',
      isolating: true,
      group: options.tableGroup,
      parseDOM: [{ tag: 'table' }],
      toDOM() {
        return ['table', ['tbody', 0]];
      },
    },
    table_row: {
      content: '(table_cell | table_header)*',
      tableRole: 'row',
      parseDOM: [{ tag: 'tr' }],
      toDOM() {
        return ['tr', 0];
      },
    },
    table_cell: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: 'cell',
      isolating: true,
      parseDOM: [
        { tag: 'td', getAttrs: (dom) => getCellAttrs(dom, extraAttrs) },
      ],
      toDOM(node) {
        return ['td', setCellAttrs(node, extraAttrs), 0];
      },
    },
    table_header: {
      content: options.cellContent,
      attrs: cellAttrs,
      tableRole: 'header_cell',
      isolating: true,
      parseDOM: [
        { tag: 'th', getAttrs: (dom) => getCellAttrs(dom, extraAttrs) },
      ],
      toDOM(node) {
        return ['th', setCellAttrs(node, extraAttrs), 0];
      },
    },
  };
}

export const getTableNodeTypes = (schema: Schema): { [nodeName: string]: NodeType; } => {
  let result = schema.cached.tableNodeTypes;
  if(!result) {
    result = schema.cached.tableNodeTypes = {/*default empty*/};

    for(let name in schema.nodes) {
      const tableType = schema.nodes[name];
      const { tableRole } = tableType.spec;

      if(tableRole) {
        result[tableRole] = tableType;
      } /* else -- Node has no tableRole */
    }
  }

  return result;
};
