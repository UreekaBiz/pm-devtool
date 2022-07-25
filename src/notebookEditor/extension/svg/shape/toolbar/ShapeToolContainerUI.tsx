import { Center, Tooltip } from '@chakra-ui/react';
import { ReactNode } from 'react';

import { tooltipProps } from 'constant';
import { ToolContainer } from 'notebookEditor/toolbar/ToolbarContainer';

// ********************************************************************************
interface Props {
  toolTitle: string;
  buttonLabels: string[];
  callback: (value: string | number) => void;
  callbackArguments: string[] | number[];
  buttonIcons: ReactNode[];
}
export const ShapeToolContainerUI: React.FC<Props> = ({ toolTitle, buttonLabels, buttonIcons, callbackArguments, callback }) =>
  <ToolContainer name={toolTitle} width={'100%'}>
    {
      buttonLabels.map((label, labelIndex) =>
        <Tooltip key={labelIndex} {...tooltipProps} label={label}>
          <button className={'iconButton'} onClick={() => callback(callbackArguments[labelIndex])}>
            <Center>
              {buttonIcons[labelIndex]}
            </Center>
          </button>
        </Tooltip>
      )
    }
  </ToolContainer>;
