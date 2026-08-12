'use client';

import { createContext, useContext, ReactNode } from 'react';

const SmoothScrollContext = createContext<{ lenis: null }>({ lenis: null });
export const useSmoothScroll = () => useContext(SmoothScrollContext);

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
