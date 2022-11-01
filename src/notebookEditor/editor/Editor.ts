import React from 'react';

import { CoreEditor } from './CoreEditor';
import { EditorContentProps, EditorContentState } from './component';

// ********************************************************************************
// == Class =======================================================================
/**
 * an extended Editor that includes a reference to the React component where the
 * Editor's content is rendered
 */
export class Editor extends CoreEditor {
  // -- Attribute -----------------------------------------------------------------
  public contentComponent: React.Component<EditorContentProps, EditorContentState> | null = null/*not initialized*/;

  // nothing additional
}
