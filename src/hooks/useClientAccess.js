import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Returns client-access restrictions for the current user.
 * - isClientOnly: true if all project memberships are "client" role
 * - allowedProjectIds: array of project IDs the client can access, or null if unrestricted
 */
export function useClientAccess() {
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: myMemberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ["my-memberships", currentUser?.email],
    queryFn: () => base44.entities.ProjectMember.filter({ user_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const isLoading = loadingUser || (!!currentUser?.email && loadingMemberships);

  const isClientOnly =
    !isLoading && myMemberships.length > 0 && myMemberships.every((m) => m.role === "client");

  const allowedProjectIds = isClientOnly
    ? myMemberships.map((m) => m.project_id)
    : isLoading ? [] : null; // [] while loading (restrict all), null = no restriction

  return { isClientOnly, allowedProjectIds, isLoading };
}