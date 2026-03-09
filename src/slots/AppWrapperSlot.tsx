import type { ReactNode } from 'react';

import { getAppWrappers } from '../registry.ts';

interface AppWrapperSlotProps {
  children: ReactNode;
}

export function AppWrapperSlot({ children }: AppWrapperSlotProps) {
  const wrappers = getAppWrappers();

  let result = children;
  // Nest wrappers from last to first so the first wrapper is outermost
  for (let i = wrappers.length - 1; i >= 0; i--) {
    const Wrapper = wrappers[i].component;
    result = <Wrapper>{result}</Wrapper>;
  }

  return <>{result}</>;
}
