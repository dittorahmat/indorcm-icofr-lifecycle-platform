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
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b bg-white shadow-sm">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {day}
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
              <div 
                key={idx} 
                className={cn(
                  "min-h-[140px] border-r border-b p-1 transition-colors hover:bg-slate-100/50 group bg-white",
                  !isCurrentMonth && "bg-slate-50/50 text-slate-300"
                )}
                onClick={() => onSelectDate(day)}
              >
                <div className="flex justify-start mb-1 px-1">
                  <span className={cn(
                    "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) ? "bg-indigo-600 text-white" : "text-slate-500",
                    !isCurrentMonth && "opacity-30"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 truncate shadow-sm",
                        event.eventType === 'REMEDIATION' 
                          ? "bg-amber-50 border-amber-100 text-amber-700" 
                          : "bg-indigo-50 border-indigo-100 text-indigo-700"
                      )}
                    >
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        event.eventType === 'REMEDIATION' ? "bg-amber-500" : "bg-indigo-500"
                      )} />
                      <span className="truncate font-medium">{event.type || 'REMEDIATION'}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[9px] text-slate-400 font-bold px-1 mt-1">
                      + {dayEvents.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
