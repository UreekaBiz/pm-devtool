import { Select } from '@chakra-ui/react';
import { ChangeEventHandler } from 'react';

import { Unit, Units } from 'notebookEditor/theme/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  value: Unit | undefined/*value not set, potential initial value or invalid state, default used (px)*/;
  onChange: (unit: Unit) => void;
}

// == Component ===================================================================
export const UnitPicker: React.FC<Props> = ({ value = Unit.Pixel, onChange }) => {
  // -- Handler -------------------------------------------------------------------
  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const value = event.target.value as Unit/*by definition*/;
    onChange(value);
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <Select
      // NOTE: Using class name to override the (seemingly impossible!) styles for
      //       the input with the accessible props.
      className='unit-picker'
      width='fit-content'
      value={value}
      placeholder='Unit'
      size='sm'
      onChange={handleChange}
    >
      {Units.map(unit => (<option key={unit} value={unit}>{unit.toString().toUpperCase()}</option>))}
    </Select>
  );
};
