import { camelToKebabCase } from 'common';

import { AttributeType } from '../attribute';
import { HeadingLevel } from '../extension/heading';
import { DATA_NODE_TYPE } from '../htmlRenderer/type';
import { MarkName } from '../mark';
import { NodeName } from '../node';
import { CustomSelector, DefaultTheme, Theme, ThemeElement } from './type';

// ********************************************************************************
// == Class =======================================================================
// A singleton that holds the themes used on the editor.
class NotebookEditorTheme {
  /*FIXME: explicit*/ theme: Theme;

  // == Constructor ===============================================================
  constructor(theme: Theme) {
    this.theme = theme;
    this.setThemeStylesheet()/*sync stylesheet*/;
  }

  // == Public methods ============================================================
  /** Gets the current theme */
  public getTheme() {
    return this.theme;
  }

  /** Sets a new theme */
  public setTheme(theme: Theme) {
    this.theme = theme;
    this.setThemeStylesheet()/*sync stylesheet*/;
  }

  // == Private methods ===========================================================
  // updates the theme stylesheet with the current theme. This function should be
  // called whenever the theme is updated.
  private setThemeStylesheet() {
    const stylesheet = this.getStylesheet();

    // Get existing stylesheet
    let existingStyleSheet = document.querySelector('#theme-stylesheet');

    // Create a new style elements and append it to the document head
    if(!existingStyleSheet){
      existingStyleSheet = document.createElement('style');
      existingStyleSheet.setAttribute('id', 'theme-stylesheet');
      document.head.appendChild(existingStyleSheet);
    }// else -- style element already exists

    existingStyleSheet.textContent = stylesheet;
  }

  private getStylesheet(){
    const { nodes, marks, customSelectors } = this.theme;

    // Create a class in the form of [DATA_NODE_TYPE="nodeName"] {} for each node.
    const nodeStyles = Object.keys(nodes).map(nodeName => {
      const nodeTheme = nodes[nodeName as NodeName/*by definition*/];

      const nodeAttributes = Object.keys(nodeTheme).map(attribute => {
        const value = nodeTheme[attribute as keyof typeof nodeTheme/*by definition*/];
        // Get "attribute: value;"
        return `${camelToKebabCase(attribute)}: ${value};`;
      }).join('\n');

      const CSSClass = `[${DATA_NODE_TYPE}="${nodeName}"] { ${nodeAttributes} }`;
      return CSSClass;
    }).join('\n');

    // Create a class in the form of [data-mark-type="markName"] {} for each mark.
    const markStyles = Object.keys(marks).map(markName => {
      const markTheme = marks[markName as MarkName/*by definition*/];

      const markAttributes = Object.keys(markTheme).map(attribute => {
        const value = markTheme[attribute as keyof typeof markTheme/*by definition*/];
        // Get "attribute: value;"
        return `${camelToKebabCase(attribute)}: ${value};`;
      }).join('\n');

      const CSSClass = `[data-mark-type="${markName}"] { ${markAttributes} }`;
      return CSSClass;
    }).join('\n');

    // Create a class with the given custom selector for each entry of the
    // customSelectors object.
    const customSelectorsStyles = Object.keys(customSelectors).map(customSelector => {
      const customTheme = customSelectors[customSelector as keyof typeof customSelectors/*by definition*/];

      const customAttributes = Object.keys(customTheme).map(attribute => {
        const value = customTheme[attribute as keyof typeof customTheme/*by definition*/];
        // Get "attribute: value;"
        return `${camelToKebabCase(attribute)}: ${value};`;
      }).join('\n');

      const CSSClass = `${customSelector} { ${customAttributes} }`;
      return CSSClass;
    }).join('\n');

    return `${nodeStyles}\n${markStyles}\n${customSelectorsStyles}`;
  }
}
// Singleton class to manage the theme.
export const notebookEditorTheme = new NotebookEditorTheme(DefaultTheme);

// ================================================================================
export const getThemeElement = (nodeOrMarkName: NodeName | MarkName): ThemeElement => {
  const theme = notebookEditorTheme.getTheme();
  const { nodes, marks } = theme;

  const nodeName = nodeOrMarkName as NodeName,
        markName = nodeOrMarkName as MarkName;

  if(nodeOrMarkName in nodes) { return nodes[nodeName]/*found*/; }
  else if(nodeOrMarkName in marks) { return marks[markName]/*found*/; }
  // else -- name was not found.

  // empty theme element
  return {};
};
// Gets the attribute value from the current theme based on the node name and
// attribute type.
// NOTE: This function must only be used to get the actual render value that is a
//       string (or undefined if not defined). If complex attributes are needed
//       (e.g. Heading level) then the NodeTheme must be accessed directly. This
//       is required to avoid Type conflicts.
export const getThemeValue = (nodeOrMarkName: NodeName | MarkName, attribute: AttributeType): string | undefined/*FIXME: document*/ => {
  const themeElement = getThemeElement(nodeOrMarkName);
  const value = themeElement[attribute];

  if(typeof value === 'string') return value;
  if(typeof value !== 'undefined') { console.error(`Unexpected value type for (${nodeOrMarkName}) theme attribute (${attribute}): ${value}`); return undefined/*FIXME: document*/; }
  // else -- value is valid but undefined.

  return value;
};

// Gets the TextColor or FontSize for a Heading from the theme.
// NOTE: Heading nodes are a special case since the FontSize and TextColor are
//       defined by its level, in this case a special CustomSelector is used and
//       must be manually matched here.
export const getHeadingThemeValue = (attribute: AttributeType.FontSize | AttributeType.TextColor, level: HeadingLevel): string | undefined => {
  const theme = notebookEditorTheme.getTheme();
  const { customSelectors } = theme;
  switch(level) {
    case HeadingLevel.One: return customSelectors[CustomSelector.HeadingLevelOne][attribute];
    case HeadingLevel.Two: return customSelectors[CustomSelector.HeadingLevelTwo][attribute];
    case HeadingLevel.Three: return customSelectors[CustomSelector.HeadingLevelThree][attribute];
  }
};
