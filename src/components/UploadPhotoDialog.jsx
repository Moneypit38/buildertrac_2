import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, Loader2 } from "lucide-react";

export default function UploadPhotoDialog({ open, onClose, projectId, photo }) {
  const isEdit = !!photo;
  const [form, setForm] = useState(photo ? { title: photo.title || "", description: photo.description || "" } : { title: "", description: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(photo?.photo_url || null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      let photo_url = photo?.photo_url;
      if (file) {
        setUploading(true);
        const res = await base44.integrations.Core.UploadFile({ file });
        photo_url = res.file_url;
        setUploading(false);
      }
      return isEdit ? base44.entities.SitePhoto.update(photo.id, { ...data, photo_url }) : base44.entities.SitePhoto.create({ ...data, photo_url, project_id: projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success(isEdit ? "Photo updated" : "Photo uploaded!"); onClose(); },
  });

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    const uploaded = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: "You are a construction site inspector. Analyze this construction site photo. Provide a concise title (5-8 words) and a detailed description (2-3 sentences) of what you see — construction activity, materials, equipment, progress stage, and any notable conditions. Be specific and professional.",
      file_urls: [uploaded.file_url],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
      },
    });
    setForm(f => ({ ...f, title: result.title || f.title, description: result.description || f.description }));
    setAnalyzing(false);
    toast.success("Photo analyzed!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Photo title is required");
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-primary flex items-center gap-2"><Camera className="w-5 h-5" /> {isEdit ? "Edit Photo" : "Add Site Photo"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Photo Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Foundation Pour - South Side" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's happening in this photo..." rows={2} /></div>
          <div><Label>Photo</Label><Input type="file" accept="image/*" onChange={handleFile} /></div>
          {preview && (
            <div className="space-y-2">
              <img src={preview} alt="Preview" className="w-full rounded-xl max-h-48 object-cover" />
              <Button type="button" size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing} className="w-full gap-1.5">
                {analyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3.5 h-3.5 text-primary" /> Analyze with AI</>}
              </Button>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending || uploading}>{uploading ? "Uploading..." : mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Upload Photo"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}