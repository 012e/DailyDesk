import { useRef, useState, useCallback, MouseEvent } from "react";

export function useDraggableScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    // Prevent dragging if clicking on interactive elements or if it's not the primary button
    if (
      (e.target as HTMLElement).closest("button, a, input, textarea, [draggable='true']") ||
      e.button !== 0
    ) {
      return;
    }

    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
    ref.current.style.cursor = "grabbing";
    ref.current.style.userSelect = "none";
  }, []);

  const onMouseUp = useCallback(() => {
    if (!ref.current) return;
    setIsDragging(false);
    ref.current.style.cursor = "grab";
    ref.current.style.removeProperty("user-select");
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    setIsDragging(false);
    ref.current.style.cursor = "default"; // Or 'grab' depending on preference
    ref.current.style.removeProperty("user-select");
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll-fast multiplier
      ref.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  return {
    ref,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onMouseMove,
    isDragging,
  };
}
