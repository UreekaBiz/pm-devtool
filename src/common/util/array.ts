// convenience methods for working with arrays
// ********************************************************************************
// ================================================================================
export const groupBy = <I, T>(array: T[], key: (value: T) => I[] | I): Map<I, T[]> => {
  const map = new Map<I, T[]>();
  const addElement = (element: T, keyValue: I) => {
    let values = map.get(keyValue);
    if(values === undefined) map.set(keyValue, (values = []));
    values.push(element);
  };

  array.forEach(element => {
    const keyValue = key(element);
    if(Array.isArray(keyValue)) keyValue.forEach(keyValue => addElement(element, keyValue));
    else addElement(element, keyValue);
  });

  return map;
};

// the specified array *must* be already ordered by the grouped-by dimension (i.e.
// the value of key()). No order is guaranteed for the grouped values
export const orderedGroupBy = <I, T>(array: T[], key: (v: T) => I[] | I): [I, T[]][] => {
  const result: [I, T[]][] = [];

  let lastKeyValue: I | undefined/*none set*/ = undefined/*by default none set*/;
  let elements: T[] = []/*elements for the last key-value*/;
  const addElement = (element: T, keyValue: I) => {
    if(keyValue !== lastKeyValue) {
      result.push([keyValue, elements = []])/*store since new key-value*/;
      lastKeyValue = keyValue/*new key-value*/;
    } /* else -- same key-value */
    elements.push(element);
  };

  array.forEach(element => {
    const keyValue = key(element);
    if(Array.isArray(keyValue)) keyValue.forEach(keyValue => addElement(element, keyValue));
    else addElement(element, keyValue);
  });

  return result;
};

// ================================================================================
// splits an array into chunks (arrays) of specified size
export const splitIntoChunks = <T>(array: T[], length: number): T[][] => {
  const result: T[][] = [];
  for(let i=0; i<array.length; i+=length)
    result.push(array.slice(i, i + length));
  return result;
};

// --------------------------------------------------------------------------------
// Swaps two elements from in array *in place*
export const swap = (array: any[], swappedFrom: number, swappedTo: number) => {
  const tmp = array[swappedFrom];
  array[swappedFrom] = array[swappedTo];
  array[swappedTo] = tmp;
};
