"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

export interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  scrollingDelay?: number;
  getScrollElement?: () => HTMLElement | null;
}

export interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  totalSize: number;
  scrollToIndex: (
    index: number,
    align?: "start" | "center" | "end" | "auto"
  ) => void;
  scrollToOffset: (offset: number) => void;
  isScrolling: boolean;
  visibleRange: { start: number; end: number };
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
  scrollingDelay = 150,
  getScrollElement,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>();
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Get item height function
  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate total size
  const totalSize = useMemo(() => {
    if (typeof itemHeight === "number") {
      return itemCount * itemHeight;
    }

    let total = 0;
    for (let i = 0; i < itemCount; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [itemCount, itemHeight, getItemHeight]);

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: Array<{ start: number; end: number; size: number }> = [];
    let start = 0;

    for (let i = 0; i < itemCount; i++) {
      const size = getItemHeight(i);
      const end = start + size;
      positions.push({ start, end, size });
      start = end;
    }

    return positions;
  }, [itemCount, getItemHeight]);

  // Find visible range
  const visibleRange = useMemo(() => {
    const viewportStart = scrollTop;
    const viewportEnd = scrollTop + containerHeight;

    let start = 0;
    let end = itemCount - 1;

    // Binary search for start index
    let low = 0;
    let high = itemCount - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const itemStart = itemPositions[mid]?.start ?? 0;

      if (itemStart < viewportStart) {
        low = mid + 1;
      } else {
        high = mid - 1;
        start = mid;
      }
    }

    // Binary search for end index
    low = start;
    high = itemCount - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const itemEnd = itemPositions[mid]?.end ?? 0;

      if (itemEnd <= viewportEnd) {
        low = mid + 1;
        end = mid;
      } else {
        high = mid - 1;
      }
    }

    // Apply overscan
    start = Math.max(0, start - overscan);
    end = Math.min(itemCount - 1, end + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemPositions, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const position = itemPositions[i];
      if (position) {
        items.push({
          index: i,
          start: position.start,
          end: position.end,
          size: position.size,
        });
      }
    }
    return items;
  }, [visibleRange, itemPositions]);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, align: "start" | "center" | "end" | "auto" = "auto") => {
      const scrollElement = getScrollElement?.() || scrollElementRef.current;
      if (!scrollElement || index < 0 || index >= itemCount) return;

      const itemPosition = itemPositions[index];
      if (!itemPosition) return;

      let targetScrollTop = itemPosition.start;

      switch (align) {
        case "start":
          targetScrollTop = itemPosition.start;
          break;
        case "center":
          targetScrollTop =
            itemPosition.start - (containerHeight - itemPosition.size) / 2;
          break;
        case "end":
          targetScrollTop = itemPosition.end - containerHeight;
          break;
        case "auto":
          const currentViewportStart = scrollTop;
          const currentViewportEnd = scrollTop + containerHeight;

          if (itemPosition.start < currentViewportStart) {
            targetScrollTop = itemPosition.start;
          } else if (itemPosition.end > currentViewportEnd) {
            targetScrollTop = itemPosition.end - containerHeight;
          } else {
            return; // Item is already visible
          }
          break;
      }

      // Clamp to valid range
      targetScrollTop = Math.max(
        0,
        Math.min(totalSize - containerHeight, targetScrollTop)
      );

      scrollElement.scrollTop = targetScrollTop;
    },
    [
      getScrollElement,
      itemCount,
      itemPositions,
      containerHeight,
      scrollTop,
      totalSize,
    ]
  );

  // Scroll to offset
  const scrollToOffset = useCallback(
    (offset: number) => {
      const scrollElement = getScrollElement?.() || scrollElementRef.current;
      if (!scrollElement) return;

      const targetScrollTop = Math.max(
        0,
        Math.min(totalSize - containerHeight, offset)
      );
      scrollElement.scrollTop = targetScrollTop;
    },
    [getScrollElement, totalSize, containerHeight]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }

      // Set new timeout
      scrollingTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    },
    [scrollingDelay]
  );

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = getScrollElement?.() || scrollElementRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    // Set initial scroll position
    setScrollTop(scrollElement.scrollTop);

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [getScrollElement, handleScroll]);

  // Update scroll element ref
  useEffect(() => {
    if (!getScrollElement) return;
    scrollElementRef.current = getScrollElement();
  }, [getScrollElement]);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    isScrolling,
    visibleRange,
  };
}

// Hook for virtual table rows
export function useVirtualTable<T>({
  data,
  rowHeight = 50,
  containerHeight,
  overscan = 5,
  getScrollElement,
}: {
  data: T[];
  rowHeight?: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  getScrollElement?: () => HTMLElement | null;
}) {
  const virtualScroll = useVirtualScroll({
    itemCount: data.length,
    itemHeight: rowHeight,
    containerHeight,
    overscan,
    getScrollElement,
  });

  const virtualRows = useMemo(() => {
    return virtualScroll.virtualItems.map((virtualItem) => ({
      ...virtualItem,
      data: data[virtualItem.index],
    }));
  }, [virtualScroll.virtualItems, data]);

  return {
    ...virtualScroll,
    virtualRows,
  };
}

// Hook for measuring dynamic item heights
export function useDynamicVirtualScroll<T>({
  data,
  estimateSize = 50,
  containerHeight,
  overscan = 5,
  getScrollElement,
}: {
  data: T[];
  estimateSize?: number;
  containerHeight: number;
  overscan?: number;
  getScrollElement?: () => HTMLElement | null;
}) {
  const [measuredSizes, setMeasuredSizes] = useState<Map<number, number>>(
    new Map()
  );
  const measurementCache = useRef<Map<number, number>>(new Map());

  // Get item height with fallback to estimate
  const getItemHeight = useCallback(
    (index: number): number => {
      return measuredSizes.get(index) ?? estimateSize;
    },
    [measuredSizes, estimateSize]
  );

  const virtualScroll = useVirtualScroll({
    itemCount: data.length,
    itemHeight: getItemHeight,
    containerHeight,
    overscan,
    getScrollElement,
  });

  // Measure item size
  const measureItem = useCallback((index: number, size: number) => {
    const currentSize = measurementCache.current.get(index);
    if (currentSize !== size) {
      measurementCache.current.set(index, size);
      setMeasuredSizes(new Map(measurementCache.current));
    }
  }, []);

  // Reset measurements when data changes
  useEffect(() => {
    measurementCache.current.clear();
    setMeasuredSizes(new Map());
  }, [data]);

  const virtualRows = useMemo(() => {
    return virtualScroll.virtualItems.map((virtualItem) => ({
      ...virtualItem,
      data: data[virtualItem.index],
      measureRef: (element: HTMLElement | null) => {
        if (element) {
          const size = element.getBoundingClientRect().height;
          measureItem(virtualItem.index, size);
        }
      },
    }));
  }, [virtualScroll.virtualItems, data, measureItem]);

  return {
    ...virtualScroll,
    virtualRows,
    measureItem,
  };
}

// Utility function to create a resize observer for measuring elements
export function createResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
): ResizeObserver | null {
  if (typeof window === "undefined" || !window.ResizeObserver) {
    return null;
  }

  return new ResizeObserver(callback);
}

// Hook for observing element size changes
export function useResizeObserver<T extends HTMLElement>(
  callback: (entry: ResizeObserverEntry) => void
) {
  const elementRef = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = createResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        callback(entry);
      }
    });

    if (observerRef.current) {
      observerRef.current.observe(element);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback]);

  return elementRef;
}
