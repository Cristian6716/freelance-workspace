"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, UploadCloudIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFileAction } from "@/actions/files";
import { MAX_WORKSPACE_FILE_BYTES } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type Project = { id: string; title: string };

type Props = {
  workspaceId: string;
  projects: Project[];
};

const NO_PROJECT = "__none__";

export function FileUploader({ workspaceId, projects }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const router = useRouter();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0]!;

    if (file.size > MAX_WORKSPACE_FILE_BYTES) {
      toast.error("File troppo grande (max 100 MB)");
      return;
    }

    const fd = new FormData();
    fd.append("workspace_id", workspaceId);
    if (projectId !== NO_PROJECT) fd.append("project_id", projectId);
    fd.append("visibility", visibility);
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadFileAction(null, fd);
      if (result.ok) {
        toast.success(`Caricato: ${file.name}`);
        router.refresh();
        if (inputRef.current) inputRef.current.value = "";
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:flex sm:items-end">
        <div className="grid gap-1.5">
          <label htmlFor="visibility" className="text-xs uppercase tracking-wider text-on-surface-variant">
            Visibilità
          </label>
          <Select value={visibility} onValueChange={(v) => setVisibility((v ?? "private") as typeof visibility)}>
            <SelectTrigger id="visibility" className="min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Privato (solo io)</SelectItem>
              <SelectItem value="shared">Condiviso col cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {projects.length > 0 && (
          <div className="grid gap-1.5">
            <label htmlFor="project_link" className="text-xs uppercase tracking-wider text-on-surface-variant">
              Collega a progetto
            </label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? NO_PROJECT)}>
              <SelectTrigger id="project_link" className="min-w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>Nessun progetto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card/40 px-6 py-10 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-outline-variant hover:border-foreground/40",
          pending && "opacity-70 pointer-events-none"
        )}
      >
        {pending ? (
          <Loader2Icon className="h-7 w-7 animate-spin text-on-surface-variant" />
        ) : (
          <UploadCloudIcon className="h-7 w-7 text-on-surface-variant" />
        )}
        <p className="text-sm text-foreground">
          <span className="font-semibold">Trascina un file</span> o{" "}
          <span className="underline">clicca per selezionare</span>
        </p>
        <p className="text-xs text-on-surface-variant">
          Massimo 100 MB · PDF, immagini, Office, archivi, video, audio
        </p>
        <input
          ref={inputRef}
          id="file-input"
          type="file"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={pending}
        />
      </label>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="self-start"
      >
        Seleziona file
      </Button>
    </div>
  );
}
