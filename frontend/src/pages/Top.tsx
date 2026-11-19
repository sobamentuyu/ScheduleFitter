import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile.ts";
import { Calendar } from "@/ui/container/calendar/Calendar.tsx";
import { Chatpanel } from "@/ui/container/Chatpanel.tsx";

export function Top() {
  const isMobile = useIsMobile();
  const [isChatOpen, setIsChatOpen] = useState(() => !isMobile);
  const [calendarRevision, setCalendarRevision] = useState(0);
  const layoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layout = layoutRef.current;
    const viewport = window.visualViewport;
    if (!isMobile || !isChatOpen || !layout || !viewport) return;

    // Keep the composer above the keyboard when only the visual viewport shrinks.
    const updateLayout = () => {
      const isKeyboardOpen = viewport.scale === 1 &&
        viewport.height < document.documentElement.clientHeight;
      const visibleHeight = viewport.offsetTop + viewport.height - layout.getBoundingClientRect().top;
      layout.style.maxHeight = isKeyboardOpen ? `${Math.max(0, visibleHeight)}px` : "";
      layout.toggleAttribute("data-keyboard-open", isKeyboardOpen);
    };

    updateLayout();
    viewport.addEventListener("resize", updateLayout);
    viewport.addEventListener("scroll", updateLayout);
    return () => {
      viewport.removeEventListener("resize", updateLayout);
      viewport.removeEventListener("scroll", updateLayout);
      layout.style.maxHeight = "";
      layout.removeAttribute("data-keyboard-open");
    };
  }, [isMobile, isChatOpen]);

  return (
    <div ref={layoutRef} className="group relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-base-200 lg:flex-row">
      <Chatpanel
        isMobile={isMobile}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        onEventCreated={() => setCalendarRevision((revision) => revision + 1)}
      />
      <div className="order-1 min-h-0 min-w-0 flex-1 lg:order-2">
        <Calendar
          revision={calendarRevision}
          compactMonth={isMobile && isChatOpen}
        />
      </div>
    </div>
  );
}
