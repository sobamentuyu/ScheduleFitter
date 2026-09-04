import { useLayoutEffect, useRef, useState } from "react";

export function useMultilineInput(value: string) {
  const probeRef = useRef<HTMLDivElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  useLayoutEffect(() => {
    const el = probeRef.current;
    if (!el) return;

    const update = () => {
      const styles = getComputedStyle(el);
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingY =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      setIsMultiline(el.scrollHeight > paddingY + lineHeight + 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return { probeRef, isMultiline };
}
