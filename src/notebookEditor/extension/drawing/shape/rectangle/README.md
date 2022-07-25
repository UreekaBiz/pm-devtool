# Rectangle

A rectangle is represented by a RoughJS-created path. This rectangle can only exist within a
Drawing node. The attributes of the rectangle, such as its stroke, background, fill type,
stroke width, stroke style sloppiness, edges and opacity can be modified through the toolbar.

The rectangle can be resized and rotated by the user, through resizers and a rotator that appear
as part of the rectangle's selection. This is entirely managed by the Drawing NodeView, and the
rectangle's rendering behavior its entirely its responsibility.

The user can add as many rectangles as pleased to a single drawing.

At the moment of writing this, a user cannot copy and paste rectangles or other shapes across
Drawing Nodes.
