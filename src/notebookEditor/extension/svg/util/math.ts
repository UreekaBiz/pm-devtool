// single source for all math-related operations (including related types)

// ********************************************************************************
// == Type ========================================================================
export type Point = { x: number; y: number; };
export type Dimension = { width: number; height: number; };
export type Rect = { topLeft: Point; bottomRight: Point; };

// == Method ======================================================================
// -- Point -----------------------------------------------------------------------
/**
 * Computes the delta of the given {@link Point}s
 */
export const computePointDelta = (startingPoint: Point, endingPoint: Point): Point =>
  ({
    x: endingPoint.x - startingPoint.x,
    y: endingPoint.y - startingPoint.y,
  });

/** Computes the coordinates of a point given a translation {@link Point} offset */
export const computeTranslatedPoint = (point: Point, translation: Point) =>
  ({
    x: point.x + translation.x,
    y: point.y + translation.y,
  });

// -- Dimension -------------------------------------------------------------------
// Currently nothing

// -- Rect ------------------------------------------------------------------------
/** Computes a {@link Rect} given its center and dimension */
export const computeRectFromCenterDimension = (center: Point, dimension: Dimension): Rect =>
({
  topLeft: {
    x: center.x - (dimension.width / 2),
    y: center.y - (dimension.height / 2),
  },
  bottomRight: {
    x: center.x + (dimension.width / 2),
    y: center.y + (dimension.height / 2),
  },
});

/** Computes a {@link Rect} given its x, y, width and height attributes */
export const computeRectFromAttributes = (x: number, y: number, width: number, height: number): Rect =>
  ({ topLeft: { x, y }, bottomRight: { x: x + width, y: y + height } });

/** Computes the center and dimension of a {@link Rect} given its regular representation */
export const computeCenterDimensionFromRect = (rect: Rect): { center: Point, dimension: Dimension } =>
(
  {
    center: {
      x: (rect.topLeft.x + ((rect.bottomRight.x  - rect.topLeft.x) / 2)),
      y: (rect.topLeft.y + ((rect.bottomRight.y  - rect.topLeft.y) / 2)),
    },
    dimension: {
      width: rect.bottomRight.x - rect.topLeft.x,
      height: rect.bottomRight.y - rect.topLeft.y,
    },
  }
);
