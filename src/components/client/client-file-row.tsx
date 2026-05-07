"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideo2Icon,
  Loader2Icon,
  Music2Icon,
} from "lucide-react";

import { getClientSignedFileUrlAction } from "@/actions/client-mutations";
import { Button } from "@/components/ui/button";
import { formatDateIT } from "@/lib/utils";

type FileItem = {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string;
  visibility: string;
  created_at: string;
};

const ACCENT_FALLBACK = "#1b1345";

function isHex(c: string | null): c is string {
  return c !== null && /^#[0-9A-Fa-f]{6}$/.test(c);
}

function FileIconFor({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImageIcon className="h-5 w-5" />;
  if (mime.startsWith("video/")) return <FileVideo2Icon className="h-5 w-5" />;
  if (mime.startsWith("audio/")) return <Music2Icon className="h-5 w-5" />;
  if (mime === "application/pdf" || mime.includes("text/") || mime.includes("document"))
    return <FileTextIcon className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
}

export function ClientFileRow({
  file,
  brandColor,
}: {
  file: FileItem;
  brandColor: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const accent = isHex(brandColor) ? brandColor : ACCENT_FALLBACK;

  const onDownload = () => {
    startTransition(async () => {
      const r = await getClientSignedFileUrlAction({ file_id: file.id });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      // Apri in una nuova tab — Supabase ritorna l'URL diretto al binary, il
      // browser triggera il download automatico col Content-Disposition.
      window.open(r.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 transition-colors hover:border-outline-variant">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-on-surface-variant"
          style={{ backgroundColor: `${accent}10` }}
          aria-hidden="true"
        >
          <FileIconFor mime={file.mime_type} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{file.filename}</p>
          <p className="text-xs text-on-surface-variant">
            {formatBytes(file.size_bytes)} · {formatDateIT(file.created_at)}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDownload}
        disabled={pending}
        className="shrink-0"
      >
        {pending ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="h-4 w-4" />
        )}
        Scarica
      </Button>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
