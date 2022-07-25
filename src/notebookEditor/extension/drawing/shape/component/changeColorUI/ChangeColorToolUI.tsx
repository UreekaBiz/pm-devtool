import { ToolContainer } from 'notebookEditor/toolbar/ToolbarContainer';

import { Color } from '../../../type';
import { InputWithLeftAddon } from './InputWithLeftAddon';

// ********************************************************************************
interface Props {
  toolTitle: string;
  toolName: string;
  leftAddonText: string;
  currentColor: string;
  colors: Color[][];
  buttonCallback: (color: Color) => void;
  inputCallback: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export const ChangeColorToolUI = ({ toolTitle, toolName, leftAddonText, currentColor, colors, buttonCallback, inputCallback }: Props) =>
  <ToolContainer
    name={toolTitle}
    width={'auto'}
  >
    <InputWithLeftAddon
      toolName={toolName}
      leftAddonText={leftAddonText}
      currentColor={currentColor}
      colors={colors}
      inputCallback={inputCallback}
      buttonCallback={buttonCallback}
    />
  </ToolContainer>;
