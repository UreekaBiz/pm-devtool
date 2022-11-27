import { NodeIdentifier } from 'common';

import { CHIP_TOOL_INPUT } from './ChipTool';

// ********************************************************************************
/**
 * focus the ChipTool input after a Command that inserts a new Node
 * (SEE: ChipTool.tsx)
 */
export const focusChipToolInput = (id: NodeIdentifier) => setTimeout(() => document.getElementById(`${id}-${CHIP_TOOL_INPUT}`)?.focus(), 100/*after React renders changes*/);
