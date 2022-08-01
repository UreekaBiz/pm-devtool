# MarkHolder

This extension adds support for MarkHolder nodes, which get inserted at the
start of their parent Block Node whenever its Content gets deleted, but they
themselves are not. This is to deal with the fact that Marks must be active
even if their parent Node has no Content. Whenever the User types or pastes
something into a place that has a MarkHolder Node, the typed or pasted Text
will receive the Marks stored in the MarkHolder, and the MarkHolder will
be removed.
