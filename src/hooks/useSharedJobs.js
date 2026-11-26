import { useQuery, useQueries } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Jobs other people shared with the signed-in user (via guest links they added to their app),
// loaded through the same guarded backend function the /g/<token> page uses.
export function useSharedJobs() {
  const { data: jobs = [] } = useQuery({
    queryKey: ["sharedJobs"],
    queryFn: () => base44.entities.SharedJob.list(),
    retry: false,
  });

  const results = useQueries({
    queries: jobs.map((j) => ({
      queryKey: ["sharedJobData", j.token],
      queryFn: async () => {
        const res = await base44.functions.invoke("guestAccess", { token: j.token, action: "load" });
        if (!res?.data || res.data.error) throw new Error("inactive");
        return res.data;
      },
      staleTime: 2 * 60 * 1000,
      retry: false,
    })),
  });

  return jobs
    .map((job, i) => ({ job, data: results[i]?.data || null }))
    .filter((s) => s.data);
}
