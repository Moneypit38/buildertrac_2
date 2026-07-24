import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderKanban, Plus } from "lucide-react";

// Lets user assign a project to an existing portfolio, or create a new one on the spot
export default function AssignPortfolioDialog({ open, onClose, project }) {
  const qc = useQueryClient();
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => base44.entities.Portfolio.list() });
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [showNew, setShowNew] = useState(false);

  const assignMutation = useMutation({
    mutationFn: ({ projectId, portfolioName }) => base44.entities.Project.update(projectId, { portfolio: portfolioName }),
    onSuccess: (_, { portfolioName }) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Assigned to "${portfolioName}"`);
      onClose();
    },
  });

  const createAndAssign = useMutation({
    mutationFn: async (name) => {
      const portfolio = await base44.entities.Portfolio.create({ name, icon: "Layers", color: "orange" });
      await base44.entities.Project.update(project.id, { portfolio: name });
      return name;
    },
    onSuccess: (name) => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Created "${name}" and assigned project`);
      onClose();
    },
  });

  const handleCreateAndAssign = () => {
    if (!newPortfolioName.trim()) return;
    createAndAssign.mutate(newPortfolioName.trim());
  };

  const isPending = assignMutation.isPending || createAndAssign.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary">Assign to Portfolio</DialogTitle>
          <p className="text-sm text-muted-foreground">"{project?.name}"</p>
        </DialogHeader>

        <div className="space-y-3">
          {portfolios.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Existing Portfolios</Label>
              {portfolios.map(pf => (
                <button
                  key={pf.id}
                  disabled={isPending || project?.portfolio === pf.name}
                  onClick={() => assignMutation.mutate({ projectId: project.id, portfolioName: pf.name })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors
                    ${project?.portfolio === pf.name
                      ? "border-primary/50 bg-primary/5 text-primary cursor-default"
                      : "border-border hover:border-primary/40 hover:bg-accent"
                    } disabled:opacity-60`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-sm flex-1">{pf.name}</span>
                  {project?.portfolio === pf.name && <span className="text-xs text-primary">Current</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">No portfolios yet — create one below.</p>
          )}

          <div className="border-t border-border pt-3">
            {!showNew ? (
              <button
                onClick={() => setShowNew(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Create New Portfolio
              </button>
            ) : (
              <div className="space-y-2">
                <Label>New Portfolio Name</Label>
                <Input
                  autoFocus
                  placeholder="e.g. West Coast Residential"
                  value={newPortfolioName}
                  onChange={e => setNewPortfolioName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateAndAssign()}
                />
                <Button
                  className="w-full"
                  onClick={handleCreateAndAssign}
                  disabled={!newPortfolioName.trim() || isPending}
                >
                  {createAndAssign.isPending ? "Creating..." : "Create & Assign"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}