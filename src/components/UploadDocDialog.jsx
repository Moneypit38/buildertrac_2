import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "../components/ResponsiveSelect";
import { Textarea } from "@/components/ui/textarea";

export default function UploadDocDialog({ open, onClose, projectId, doc }) {
  const isEdit = !!doc;
  const [form, setForm] = useState(doc ? {
    name: doc.name || "", category: doc.category || "Plans", description: doc.description || "",
    version: doc.version || 1, size: doc.size || "",
  } : { name: "", category: "Plans", description: "", version: 1, size: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      let file_url = doc?.file_url;
      if (file) {
        setUploading(true);
        const res = await base44.integrations.Core.UploadFile({ file });
        file_url = res.file_url;
        setUploading(false);
      }
      const payload = { ...data, file_url };
      return isEdit ? base44.entities.Document.update(doc.id, payload) : base44.entities.Document.create({ ...payload, project_id: projectId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success(isEdit ? "Document updated" : "Document uploaded!"); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Document name is required");
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-primary">{isEdit ? "Edit Document" : "Upload Document"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Document Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Structural Plans - Level 4" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <ResponsiveSelect
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v }))}
                options={["Plans", "RFI", "Change Order", "Report", "Contract"].map(c => ({ value: c, label: c }))}
              /></div>
            <div><Label>Version</Label><Input type="number" min={1} value={form.version} onChange={e => setForm(f => ({ ...f, version: Number(e.target.value) }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes..." rows={2} /></div>
          <div><Label>File</Label><Input type="file" onChange={e => { setFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setForm(f => ({ ...f, size: `${(e.target.files[0].size / 1024).toFixed(0)} KB` })); }} /></div>
          <Button type="submit" className="w-full" disabled={mutation.isPending || uploading}>{uploading ? "Uploading file..." : mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Upload Document"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}