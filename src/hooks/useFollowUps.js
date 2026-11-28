import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { computeFollowUps, computeUpcoming } from "@/lib/followUp";

// Projects (your own account only) that are due for a follow-up, most overdue first.
export function useFollowUps() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: entries = [] } = useQuery({
    queryKey: ["logs", "all"],
    queryFn: () => base44.entities.LogEntry.list("-created_date", 2000),
    staleTime: 60000,
    retry: false,
  });
  return useMemo(() => computeFollowUps(projects, entries), [projects, entries]);
}

// The next reminders that aren't due yet, soonest first.
export function useUpcomingFollowUps() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: entries = [] } = useQuery({ queryKey: ["logs", "all"], queryFn: () => base44.entities.LogEntry.list("-created_date", 2000), staleTime: 60000, retry: false });
  return useMemo(() => computeUpcoming(projects, entries), [projects, entries]);
}

export function useAllLogEntries() {
  return useQuery({ queryKey: ["logs", "all"], queryFn: () => base44.entities.LogEntry.list("-created_date", 2000), staleTime: 60000, retry: false });
}
