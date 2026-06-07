import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  "Done": "bg-green-500/20 text-green-400 border-green-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Blocked": "bg-red-500/20 text-red-400 border-red-500/30",
  "Pending Approval": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Not Started": "bg-muted text-muted-foreground border-border",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export default function TaskCalendar({ tasks = [], projects = [], appointments = [] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);

  const { year, month } = viewDate;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = today.toISOString().split("T")[0];

  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  // Build a map: "YYYY-MM-DD" -> tasks[]
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.due_date) return;
      if (!map[t.due_date]) map[t.due_date] = [];
      map[t.due_date].push(t);
    });
    return map;
  }, [tasks]);

  // Build a map: "YYYY-MM-DD" -> appointments[]
  const apptsByDate = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      if (!a.date) return;
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointments]);

  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    setViewDate(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: v.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setViewDate(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: v.month + 1 };
    });
    setSelectedDate(null);
  };

  const goToday = () => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(todayStr);
  };

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const selectedAppts = selectedDate ? (apptsByDate[selectedDate] || []) : [];

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">{monthName} {year}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="text-[11px] font-medium text-black dark:text-yellow-300 px-2 py-1 rounded-lg hover:bg-accent transition-colors"
          >
            Today
          </button>
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-border">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-12 border-b border-r border-border/40 last:border-r-0" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const dayAppts = apptsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isOverdue = dateStr < todayStr && dayTasks.some(t => !t.completed && t.status !== "Done");
          const isSelected = selectedDate === dateStr;
          const hasTasks = dayTasks.length > 0;
          const hasAppts = dayAppts.length > 0;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`h-12 flex flex-col items-center justify-start pt-1 border-b border-r border-border/40 last:border-r-0 transition-colors relative
                ${isSelected ? "bg-accent" : "hover:bg-accent/50"}
                ${isToday ? "ring-1 ring-inset ring-primary" : ""}
              `}
            >
              <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full
                ${isToday ? "bg-primary text-primary-foreground" : isOverdue ? "text-orange-400" : "text-foreground"}
              `}>
                {day}
              </span>
              {(hasTasks || hasAppts) && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                  {dayTasks.slice(0, 2).map((t, i) => (
                    <span
                      key={`t-${i}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.status === "Done" ? "bg-green-400" :
                        dateStr < todayStr && !t.completed ? "bg-orange-400" :
                        "bg-blue-400"
                      }`}
                    />
                  ))}
                  {dayAppts.slice(0, 2).map((_, i) => (
                    <span key={`a-${i}`} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day task list */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              {selectedTasks.length === 0 && selectedAppts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">Nothing scheduled this day</p>
              ) : (
                <>
                  {selectedAppts.map(a => (
                    <Link key={a.id} to={`/project/${a.project_id}?tab=appointments&appt=${a.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors group">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {a.start_time ? a.start_time : ""}
                          {projectMap[a.project_id] ? ` · ${projectMap[a.project_id]}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 bg-purple-500/20 text-purple-400 border-purple-500/30">Appt</span>
                    </Link>
                  ))}
                  {selectedTasks.map(t => (
                    <Link key={t.id} to={`/project/${t.project_id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors group">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        t.status === "Done" ? "bg-green-400" :
                        selectedDate < todayStr && !t.completed ? "bg-orange-400" :
                        "bg-blue-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${t.status === "Done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                        {projectMap[t.project_id] && (
                          <p className="text-[11px] text-muted-foreground truncate">{projectMap[t.project_id]}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[t.status] || STATUS_COLORS["Not Started"]}`}>
                        {t.status}
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}