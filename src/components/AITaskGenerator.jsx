import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronDown, ChevronUp, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AITaskGenerator({ projectId, projectName }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState(null);

  const createTasks = useMutation({
    mutationFn: (tasks) => base44.entities.Task.bulkCreate(tasks.map(t => ({
      title: t.title,
      description: t.description || "",
      priority: t.priority || "medium",
      status: "Not Started",
      project_id: projectId,
    }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success(`${generatedTasks.length} tasks added!`);
      setGeneratedTasks(null);
      setExpanded(false);
      setPrompt("");
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim() && !projectName) return;
    setGenerating(true);
    setGeneratedTasks(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a construction project manager. Generate a realistic task list for the following construction project.

Project name: ${projectName}
Additional context: ${prompt || "General construction project"}

Create 8-12 specific, actionable tasks that a construction team would actually need to complete. Cover key phases like planning, permits, site prep, construction phases, inspections, and closeout as relevant.`,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["title", "priority"],
            },
          },
        },
        required: ["tasks"],
      },
    });
    setGenerating(false);
    setGeneratedTasks(result.tasks || []);
  };

  const priorityColors = { high: "text-red-400", medium: "text-yellow-400", low: "text-green-400" };

  return (
    <div className="border border-dashed border-primary/40 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate tasks with AI
        {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-dashed border-primary/30">
          <Textarea
            className="mt-3 text-sm"
            rows={2}
            placeholder="Describe your project type or any specifics (e.g. 'residential bathroom remodel', 'commercial steel frame building')..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
          </Button>

          {generatedTasks && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{generatedTasks.length} tasks ready to add</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {generatedTasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 bg-accent/50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{t.description}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase shrink-0 ${priorityColors[t.priority]}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => createTasks.mutate(generatedTasks)} disabled={createTasks.isPending}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> {createTasks.isPending ? "Adding..." : "Add All Tasks"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setGeneratedTasks(null)}>Discard</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}