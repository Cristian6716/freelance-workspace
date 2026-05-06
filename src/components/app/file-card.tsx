"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DownloadIcon,
  EyeIcon,
  FileArchiveIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FilmIcon,
  Loader2Icon,
  LockIcon,
  MusicIcon,
  TrashIcon,
  Users2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateIT, relativeTimeIT } from "@/lib/utils";
import {
  deleteFileAction,
  getSignedFileUrlAction,
  updateFileVisibilityAction,
} from "@/actions/files";

export type FileCardData = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  visibility: "private" | "shared" | string;
  version: number;
  project_title: string | null;
  created_at: string;
};

function FileIconFor({ mime, className }: { mime: string; className?: string }) {
  if (mime.startsWith("image/")) return <FileImageIcon className={className} />;
  if (mime.startsWith("video/")) return <FilmIcon className={className} />;
  if (mime.startsWith("audio/")) return <MusicIcon className={className} />;
  if (mime === "application/pdf" || mime.startsWith("text/"))
    return <FileTextIcon className={className} />;
  if (
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/x-7z-compressed"
  )
    return <FileArchiveIcon className={className} />;
  return <FileIcon className={className} />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FileCard({ file }: { file: FileCardData }) {
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  const onDownload = () => {
    startTransition(async () => {
      const r = await getSignedFileUrlAction(file.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      window.open(r.url, "_blank", "noopener,noreferrer");
    });
  };

  const onPreview = () => {
    startTransition(async () => {
      const r = await getSignedFileUrlAction(file.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setPreviewUrl(r.url);
    });
  };

  const onToggleVisibility = () => {
    const next = file.visibility === "shared" ? "private" : "shared";
    startTransition(async () => {
      const r = await updateFileVisibilityAction(file.id, next);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(next === "shared" ? "Condiviso con il cliente" : "Reso privato");
        router.refresh();
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`Eliminare "${file.filename}"?`)) return;
    startTransition(async () => {
      const r = await deleteFileAction(file.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("File rimosso");
        router.refresh();
      }
    });
  };

  const canPreview =
    file.mime_type.startsWith("image/") || file.mime_type === "application/pdf";

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-outline-variant/60",
        "shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
          <FileIconFor mime={file.mime_type} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{file.filename}</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {formatBytes(file.size_bytes)} · v{file.version} · {relativeTimeIT(file.created_at)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider"
        >
          {file.visibility === "shared" ? (
            <>
              <Users2Icon className="mr-1 h-3 w-3" /> Condiviso
            </>
          ) : (
            <>
              <LockIcon className="mr-1 h-3 w-3" /> Privato
            </>
          )}
        </Badge>
        {file.project_title && (
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px]">
            {file.project_title}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {canPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreview}
            disabled={pending}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            Anteprima
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={pending}
        >
          {pending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <DownloadIcon className="h-3.5 w-3.5" />}
          Scarica
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          disabled={pending}
        >
          {file.visibility === "shared" ? "Rendi privato" : "Condividi"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Elimina file"
          onClick={onDelete}
          disabled={pending}
          className="ml-auto text-on-surface-variant hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      {previewUrl && (
        <PreviewModal
          url={previewUrl}
          mime={file.mime_type}
          filename={file.filename}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </article>
  );
}

function PreviewModal({
  url,
  mime,
  filename,
  onClose,
}: {
  url: string;
  mime: string;
  filename: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Anteprima ${filename}`}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90dvh] overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium">{filename}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Chiudi
          </Button>
        </div>
        <div className="bg-background h-[80dvh]">
          {mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={filename}
              className="h-full w-full object-contain"
            />
          ) : (
            <iframe
              src={url}
              title={filename}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export { formatDateIT };
