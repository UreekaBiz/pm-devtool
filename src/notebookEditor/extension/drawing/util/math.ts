// ********************************************************************************
// == Constant ====================================================================
export const DEFAULT_ROTATION_ANGLE = 0;

// == Type ========================================================================
// single source for all math-related operations (including related types)
export type Point = { x: number; y: number; };

// ................................................................................
// TODO: flip these names -- this was just done as an intermediate step
export type Box = {
  // top-left (or bottom-right if inverted)
  x1: number;
  y1: number;

  // bottom-right (or top-left if inverted)
  x2: number;
  y2: number;
};
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// NOTE: purposefully not 'naturally' pluralized
export type Dimension = {
  width: number/*may be negative if inverted*/;
  height: number/*may be negative if inverted*/;
};

// ................................................................................
// a vector from the origin to the specified point (i.e. a 'position vector')
export type Vector = { x: number; y: number; }/*explicitly differentiate from point since vector has magnitude and direction*/;

// == Method ======================================================================
// -- Box -------------------------------------------------------------------------
export const computeBoxWidth = (box: Box): number => Math.abs(box.x2 - box.x1);
export const computeBoxHeight = (box: Box): number => Math.abs(box.y2 - box.y1);

export const computeBoxCenter = (box: Box): Point =>
  ({ x: box.x1 + ((box.x2 - box.x1) / 2),
     y: box.y1 + ((box.y2 - box.y1) / 2) });

// computes a properly oriented box (one whose (x1,y1) is in the upper-left and
// (x2,y2) is in the lower-right)
export const computeOrientedBox = (box: Box): Box =>
  ({ x1: (box.x1 < box.x2) ? box.x1 : box.x2,
     y1: (box.y1 < box.y2) ? box.y1 : box.y2,
     x2: (box.x1 < box.x2) ? box.x2 : box.x1,
     y2: (box.y1 < box.y2) ? box.y2 : box.y1 });

// since a Box may be inverted, this corrects the orientation and returns a Rect
export const computeRectFromBox = (box: Box): Rect =>
  ((box.x1 < box.x2) || (box.y1 < box.y2))
    ? { x: box.x1, y: box.y1, width: (box.x2 - box.x1), height: (box.y2 - box.y1) }
    : { x: box.x2, y: box.y2, width: (box.x1 - box.x2), height: (box.y1 - box.y2) };

export const computeBoxFromPoints = (startingPoint: Point, endingPoint: Point): Box =>
  ({ x1: startingPoint.x,
     y1: startingPoint.y,
     x2: endingPoint.x,
     y2: endingPoint.y });

export const computeTranslatedBox = (box: Box, delta: Point): Box =>
  ({ x1: box.x1 + delta.x,
     y1: box.y1 + delta.y,
     x2: box.x2 + delta.x,
     y2: box.y2 + delta.y });

// ................................................................................
export const computeCenterDimensionFromBox = (box: Box): { center: Point, dimension: Dimension } =>
  ({ center: { x: box.x1 + ((box.x2 - box.x1) / 2), y: box.y1 + ((box.y2 - box.y1) / 2) },
     dimension: { width: box.x2 - box.x1, height: box.y2 - box.y1 } });

export const computeCenterDimensionFromPoints = (startingPoint: Point, endingPoint: Point): { center: Point, dimension: Dimension } =>
  computeCenterDimensionFromBox(computeBoxFromPoints(startingPoint, endingPoint));

// ................................................................................
// computes a box that is padded out (from the center) from the specified box
// and oriented
export const computeOrientedPaddedBox = (box: Box, padding: number) => {
  const orientedBox = computeOrientedBox(box);
  return {
    x1: orientedBox.x1 - padding,
    y1: orientedBox.y1 - padding,
    x2: orientedBox.x2 + padding,
    y2: orientedBox.y2 + padding,
  };
};

// -- Dimension -------------------------------------------------------------------
export const computeBoxFromCenterDimension = (center: Point, dimension: Dimension) =>
  ({ x1: center.x - (dimension.width / 2),
     y1: center.y - (dimension.height / 2),
     x2: center.x + (dimension.width / 2),
     y2: center.y + (dimension.height / 2) });

export const computeOrientedBoxFromCenterDimension = (center: Point, dimension: Dimension) =>
  ({ x1: center.x - (Math.abs(dimension.width) / 2),
     y1: center.y - (Math.abs(dimension.height) / 2),
     x2: center.x + (Math.abs(dimension.width) / 2),
     y2: center.y + (Math.abs(dimension.height) / 2) });

// ................................................................................
export const computeOrientedPaddedDimension = (dimension: Dimension, padding: number) =>
  ({ width: Math.abs(dimension.width) + (2 * padding),
    height: Math.abs(dimension.height) + (2 * padding) });

// -- Point -----------------------------------------------------------------------
export const computePointDelta = (startingPoint: Point, endingPoint: Point): Point =>
  ({ x: endingPoint.x - startingPoint.x,
     y: endingPoint.y - startingPoint.y });

export const computeTranslatedPoint = (point: Point, translation: Point) =>
  ({ x: point.x + translation.x,
     y: point.y + translation.y });

// -- Rect ------------------------------------------------------------------------
export const computeRectFromPoints = (startingPoint: Point, endingPoint: Point, angle: number = DEFAULT_ROTATION_ANGLE): Rect => {
  const width = Math.floor(endingPoint.x - startingPoint.x),
        height = Math.floor(endingPoint.y - startingPoint.y);

  return {
    x: (width > 0) ? startingPoint.x : endingPoint.x,
    y: (height > 0) ? startingPoint.y : endingPoint.y,
    width:  (width !== 0) ? Math.abs(width) : 1/*minimum width*/,
    height: (height !== 0) ? Math.abs(height) : 1/*minimum height*/,
  };
};

export const computeRectCenter = (rect: Rect): Point =>
  ({ x: rect.x + (rect.width / 2),
     y: rect.y + (rect.height / 2) });

export const computePointsCenter = (pointA: Point, pointB: Point): Point =>
  computeRectCenter(computeRectFromPoints(pointA, pointB));

// -- Vector ----------------------------------------------------------------------
export const computeVectorFromPoints = (pointA: Point, pointB: Point): Vector =>
  ({ x: pointB.x - pointA.x,
     y: pointB.y - pointA.y });

// ................................................................................
export const computeVectorLength = (vector: Vector) => Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
export const computeDotProduct = (vectorA: Vector, vectorB: Vector) => (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);

// computes the angle between vector created by A,O and the vector created by B,O
export const computeAngleBetween = (origin: Point, pointA: Point, pointB: Point): number => {
  const vectorA = computeVectorFromPoints(origin, pointA),
        vectorB = computeVectorFromPoints(origin, pointB);
  const angle = Math.atan2(vectorB.y, vectorB.x) - Math.atan2(vectorA.y, vectorA.x);

  return angle;
};

// -- Rotation --------------------------------------------------------------------
// screen space into shape space
export const rotatePoint = (point: Point, center: Point, angleInRads: number): Point =>
  ({ x: (point.x - center.x) * Math.cos(angleInRads) - (point.y - center.y) * Math.sin(angleInRads) + center.x,
     y: (point.x - center.x) * Math.sin(angleInRads) + (point.y - center.y) * Math.cos(angleInRads) + center.y });

export const rotateBox = (box: Box, center: Point, angleInRads: number): Box => {
  const cos = Math.cos(angleInRads),
        sin = Math.sin(angleInRads);
  return {
    x1: (box.x1 - center.x) * cos - (box.y1 - center.y) * sin + center.x,
    y1: (box.x1 - center.x) * sin + (box.y1 - center.y) * cos + center.y,
    x2: (box.x2 - center.x) * cos - (box.y2 - center.y) * sin + center.x,
    y2: (box.x2 - center.x) * sin + (box.y2 - center.y) * cos + center.y,
  };
};

// -- Trigonometry ----------------------------------------------------------------
export const computeDegrees = (radians: number) => radians * (180 / Math.PI);
export const computeRadians = (degrees: number) => degrees * (Math.PI / 180);
