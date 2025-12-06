import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function useAutoScroll<T extends HTMLElement | null>(
  ref: RefObject<T> | null | undefined,
  dependencies: any[] = []
) {
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ref?.current) return;

    // Small delay to ensure the content is rendered
    scrollTimeoutRef.current = window.setTimeout(() => {
      if (ref.current?.isConnected) {
        // Find the scrollable container
        const scrollContainer = ref.current.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
        
        if (scrollContainer) {
          // Scroll the container to the bottom
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          // Fallback to standard scrollIntoView if Radix ScrollArea not found
          ref.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      }
    }, 50);

    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [ref, ...dependencies]);
}