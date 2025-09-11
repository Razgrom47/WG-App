import { useEffect, useRef } from "react";

/**
 * Custom hook to capture the previous value of a state or prop.
 * This is useful for tracking changes in the theme colors.
 *
 * @param value - The current value to track.
 */
export default function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
