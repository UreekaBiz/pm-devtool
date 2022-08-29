import { EditorState, Transaction } from 'prosemirror-state';

// ********************************************************************************
// == Command =====================================================================
// Commands are meant to be atomic (i.e. they "encapsulate functionality"). The
// Transaction dispatched by a Command goes through one DocumentUpdate. Multiple
// DocumentUpdates can be executed in a single operation through the
// applyDocumentUpdates method (SEE: ./update.ts)
export type Command = (state: EditorState, dispatch: (tr: Transaction) => void)
=> boolean/*indicates whether the command can be performed*/;

// == Update ======================================================================
// A DocumentUpdate encapsulates the individual modifications that a Transaction
// goes through. DocumentUpdates can be performed once in a single operation
// through a Command, or their functionality can be chained into a single operation
// through the applyDocumentUpdates method (SEE: ./update.ts)
export type DocumentUpdate = Readonly<{
  /** modifies the specified ProseMirror Document */
  update: (editorState: EditorState, tr: Transaction) => void;
}>;

// AbstractDocumentUpdates provide an unified interface that can be used by the
// server and the client, while at the same time allowing Commands to maintain
// their 'single operation' semantics
export abstract class AbstractDocumentUpdate implements DocumentUpdate {
  // NOTE: return the modified Transaction so that it can be dispatched by Commands
  public abstract update(editorState: EditorState<any>, tr: Transaction<any>): Transaction;
}
