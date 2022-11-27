# DemoAsyncNode2

DemoAsyncNode2s are block nodes whose behavior mimics that of a Paragraph node,
but with a specific view. Their core functionality revolves around a keyword of
text, whose _first_ appearance in the DemoAsyncNode2's content will be replaced
after a short period of time. This keyword can be up to 50 characters long

The user cannot type in the DemoAsyncNode2 while its going through the
keyword replacement process. The rest of the document remains editable. The
DemoAsyncNode2 view reflects the period of time where this is happening.

Once the text has been replaced, the DemoAsyncNode2 view reflects this
'recently replaced' state. DemoAsyncNode2s are taken to be dirty if the
current keyword to replace does not match the one that was used the last
time they were executed.