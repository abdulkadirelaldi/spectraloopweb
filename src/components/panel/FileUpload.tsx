"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

export type FileUploadProps = {
  /** Allowed MIME types (from @/lib/utils/r2, passed down by the server page). */
  allowedContentTypes: readonly string[];
  maxBytes: number;
  /** Current fileUrl (already uploaded or manually entered), for display. */
  currentUrl?: string;
  /** Called with the public fileUrl after a successful upload. */
  onUploaded: (fileUrl: string) => void;
  /** Notifies the parent while a request/upload is in flight (to gate submit). */
  onBusyChange?: (busy: boolean) => void;
  /** Override the default allowed-types hint (e.g. logos: images only). */
  hint?: string;
  disabled?: boolean;
};

type State = "idle" | "requesting" | "uploading" | "error";

type UploadsResponse = {
  ok?: boolean;
  uploadUrl?: string;
  fileUrl?: string;
  error?: string;
};

/** PUT the file straight to R2 via the presigned URL, reporting progress. */
function putToR2(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
  registerXhr: (xhr: XMLHttpRequest | null) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);
    xhr.open("PUT", url);
    // Content-Type MUST match the value signed in step 1 (see uploads README).
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      registerXhr(null);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("put-failed"));
    };
    xhr.onerror = () => {
      registerXhr(null);
      reject(new Error("put-failed"));
    };
    xhr.onabort = () => {
      registerXhr(null);
      reject(new Error("aborted"));
    };
    xhr.send(file);
  });
}

export function FileUpload({
  allowedContentTypes,
  maxBytes,
  currentUrl,
  onUploaded,
  onBusyChange,
  hint,
  disabled,
}: FileUploadProps) {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxMb = Math.round(maxBytes / (1024 * 1024));
  const busy = state === "requesting" || state === "uploading";

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  async function handleFile(file: File) {
    setError(null);

    if (!allowedContentTypes.includes(file.type)) {
      setError("Bu dosya türü desteklenmiyor.");
      return;
    }
    if (file.size === 0) {
      setError("Boş dosya yüklenemez.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`Dosya çok büyük (en fazla ${maxMb} MB).`);
      return;
    }

    setFileName(file.name);
    setProgress(0);
    setState("requesting");

    try {
      const res = await fetch("/api/panel/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const data = (await res
        .json()
        .catch(() => null)) as UploadsResponse | null;
      if (!res.ok || !data?.ok || !data.uploadUrl || !data.fileUrl) {
        setError(
          data?.error ?? "Yükleme başlatılamadı. Lütfen tekrar deneyin.",
        );
        setState("error");
        return;
      }

      setState("uploading");
      await putToR2(
        data.uploadUrl,
        file,
        setProgress,
        (xhr) => (xhrRef.current = xhr),
      );

      setState("idle");
      setFileName(null);
      onUploaded(data.fileUrl);
    } catch (err) {
      if (err instanceof Error && err.message === "aborted") {
        setState("idle");
        setError(null);
        return;
      }
      setError("Yükleme başarısız oldu. Lütfen tekrar deneyin.");
      setState("error");
    }
  }

  function cancel() {
    xhrRef.current?.abort();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={allowedContentTypes.join(",")}
        disabled={disabled || busy}
        aria-label="Yüklenecek dosyayı seçin"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Allow re-selecting the same file after an error.
          e.target.value = "";
        }}
        className="text-foreground file:bg-brand-500 hover:file:bg-brand-600 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white disabled:opacity-60"
      />

      <p className="text-muted text-xs">
        {hint ??
          `İzin verilen türler: PDF, görsel, Office belgeleri, zip · en fazla ${maxMb} MB.`}
      </p>

      {busy ? (
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
            role="progressbar"
            aria-valuenow={state === "uploading" ? progress : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Yükleme ilerlemesi"
          >
            <div
              className="bg-brand-500 h-full transition-all"
              style={{ width: state === "uploading" ? `${progress}%` : "15%" }}
            />
          </div>
          <span className="text-muted text-xs">
            {state === "requesting" ? "Hazırlanıyor…" : `${progress}%`}
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={cancel}>
            İptal
          </Button>
        </div>
      ) : null}

      {fileName && busy ? (
        <p className="text-muted truncate text-xs">{fileName}</p>
      ) : null}

      {currentUrl && !busy ? (
        <p className="text-muted text-xs">
          Seçilen dosya:{" "}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium"
          >
            aç
          </a>
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
