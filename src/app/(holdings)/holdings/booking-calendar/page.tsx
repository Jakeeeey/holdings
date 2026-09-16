import { SidebarInset } from "@/components/ui/sidebar";
import { BookingCalendarView } from "@/modules/holdings/booking-calendar/components/BookingCalendarView";

export default function BookingCalendarPage() {
  return (
    <SidebarInset className="bg-slate-50 relative flex w-full h-full flex-col">
      <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
        <BookingCalendarView />
      </div>
    </SidebarInset>
  );
}
