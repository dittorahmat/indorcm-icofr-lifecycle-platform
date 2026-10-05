import React from 'react';
import { cn } from '@/lib/utils';
import { format, isSameMonth, isToday } from 'date-fns';

interface TodoListGridProps {
  calendarDays: Date[];
  currentDate: Date;
  getEventsForDay: (day: Date) => any[];
  onSelectDate: (day: Date) => void;
}

export function TodoListGrid({
  calendarDays,
  currentDate,
  getEventsForDay,
  onSelectDate
}: TodoListGridProps) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden max-w-full">
      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b bg-white shadow-sm max-w-full overflow-hidden">
        {daysOfWeek.map((day, i) => (
          <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="hidden min-[420px]:inline">{day}</span>
            <span className="min-[420px]:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-7 auto-rows-fr min-h-full">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <button
                key={idx}
                type="button"
                aria-label={format(day, 'd MMMM yyyy')}
                className={cn(
                  "min-h-[72px] sm:min-h-[140px] border-r border-b p-0.5 sm:p-1 transition-colors hover:bg-slate-100/50 group bg-white min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  !isCurrentMonth && "bg-slate-50/50 text-slate-300"
                )}
                onClick={() => onSelectDate(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDate(day);
                  }
                }}
              >
                <div className="flex justify-center sm:justify-start mb-0.5 sm:mb-1 sm:px-1">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) ? "bg-indigo-600 text-white" : "text-slate-500",
                    !isCurrentMonth && "opacity-30"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Mobile: dot indicators to avoid cramped truncated pills */}
                <div className="flex items-center justify-center gap-1 py-0.5 sm:hidden" aria-hidden="true">
                  {dayEvents.slice(0, 3).map(event => (
                    <span
                      key={event.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        event.eventType === 'REMEDIATION' ? "bg-amber-500" : "bg-indigo-500"
                      )}
                    />
                  ))}
                </div>
                {dayEvents.length > 0 && (
                  <p className="text-center text-xs font-bold text-slate-500 leading-none pb-1 sm:hidden">
                    {dayEvents.length > 1 ? dayEvents.length : ''}
                  </p>
                )}
                <div className="hidden sm:block space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 truncate shadow-sm",
                        event.eventType === 'REMEDIATION' 
                          ? "bg-amber-50 border-amber-100 text-amber-700" 
                          : "bg-indigo- border-indigo-100 text-indigo-700"
                      )}
                    >
                      <div className={cn(
                        "w-1 h-1 rounded-full shrink-0",
                        event.eventType === 'REMEDIATION' ? "bg-amber-500" : "bg-indigo-500"
                      )} />
                      <span className="truncate font-medium">{event.displayTitle || event.type || 'REMEDIATION'}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-slate-400 font-bold px-1 mt-1">
                      + {dayEvents.length - 3} more...
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
