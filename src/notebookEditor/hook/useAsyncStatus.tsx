import { useState } from 'react';

// ********************************************************************************
type Status = 'idle' | 'loading' | 'complete' | 'error';

/**
 * Utility hook that manages the status of a async request. By default the status
 * is `idle`.
 */
export const useAsyncStatus = () => useState<Status>('idle'/*by contract*/);
