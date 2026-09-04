import { Calendar } from "@/ui/container/calendar/Calendar.tsx";
import { Chatpanel } from "@/ui/container/Chatpanel";

export function Top() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-base-200 lg:flex-row">
      <Chatpanel />
      <div className="order-1 min-h-0 min-w-0 flex-1 lg:order-2">
        <Calendar />
      </div>
    </div>
  );
}
