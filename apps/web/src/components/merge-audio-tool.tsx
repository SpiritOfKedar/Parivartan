"use client";

import { getTool } from "@convert-hub/conversion-rules";
import { useEffect, useRef, useState } from "react";
import {
  ExportFormat,
  formatDuration,
  getAudioDuration,
  isSupportedAudio,
  mergeAudioClips,
  mergedDurationSec,
  parseTimeInput,
} from "../lib/audio-editor";
import { createWaveform, type WaveformHandle } from "../lib/audio-waveform";
import { downloadBlob } from "../lib/merge-pdf";
import { useTranslations } from "../lib/i18n/locale-provider";

type Phase = "idle" | "loading-ffmpeg" | "merging" | "done" | "error";

interface ClipEntry {
  id: string;
  file: File;
  previewUrl: string;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function totalBytes(entries: ClipEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.file.size, 0);
}

function effectiveDuration(entry: ClipEntry): number {
  return Math.max(0, entry.trimEndSec - entry.trimStartSec);
}

function ClipWaveformEditor({
  previewUrl,
  durationSec,
  trimStartSec,
  trimEndSec,
  onTrimChange,
}: {
  previewUrl: string;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  onTrimChange: (start: number, end: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<WaveformHandle | null>(null);
  const onTrimChangeRef = useRef(onTrimChange);
  onTrimChangeRef.current = onTrimChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    void createWaveform(
      container,
      previewUrl,
      durationSec,
      (start, end) => onTrimChangeRef.current(start, end),
    ).then((handle) => {
      if (cancelled) {
        handle.destroy();
        return;
      }
      handleRef.current = handle;
      handle.setRegion(trimStartSec, trimEndSec);
    });

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [previewUrl, durationSec]);

  useEffect(() => {
    handleRef.current?.setRegion(trimStartSec, trimEndSec);
  }, [trimStartSec, trimEndSec]);

  return <div ref={containerRef} className="mt-3 rounded border border-border bg-background-subtle" />;
}

function ClipTrimInputs({
  durationSec,
  trimStartSec,
  trimEndSec,
  onTrimChange,
}: {
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  onTrimChange: (start: number, end: number) => void;
}) {
  const [startText, setStartText] = useState(formatDuration(trimStartSec));
  const [endText, setEndText] = useState(formatDuration(trimEndSec));

  useEffect(() => {
    setStartText(formatDuration(trimStartSec));
    setEndText(formatDuration(trimEndSec));
  }, [trimStartSec, trimEndSec]);

  function applyStart(value: string) {
    setStartText(value);
    const parsed = parseTimeInput(value);
    if (parsed === null) {
      return;
    }
    const start = Math.max(0, Math.min(parsed, durationSec));
    const end = Math.max(start + 0.05, trimEndSec);
    onTrimChange(start, Math.min(end, durationSec));
  }

  function applyEnd(value: string) {
    setEndText(value);
    const parsed = parseTimeInput(value);
    if (parsed === null) {
      return;
    }
    const end = Math.max(trimStartSec + 0.05, Math.min(parsed, durationSec));
    onTrimChange(trimStartSec, end);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2 text-muted">
        Start
        <input
          type="text"
          value={startText}
          onChange={(event) => setStartText(event.target.value)}
          onBlur={() => applyStart(startText)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyStart(startText);
            }
          }}
          className="w-16 rounded border border-border bg-background px-2 py-1 text-foreground"
        />
      </label>
      <label className="flex items-center gap-2 text-muted">
        End
        <input
          type="text"
          value={endText}
          onChange={(event) => setEndText(event.target.value)}
          onBlur={() => applyEnd(endText)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyEnd(endText);
            }
          }}
          className="w-16 rounded border border-border bg-background px-2 py-1 text-foreground"
        />
      </label>
    </div>
  );
}

export function MergeAudioTool() {
  const messages = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [clips, setClips] = useState<ClipEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("mp3");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tool = getTool("merge-audio");
  const maxBytes = tool?.clientMaxBytes ?? 50 * 1024 * 1024;
  const totalDuration = mergedDurationSec(clips);

  useEffect(() => {
    return () => {
      for (const clip of clips) {
        URL.revokeObjectURL(clip.previewUrl);
      }
      previewAudioRef.current?.pause();
    };
  }, [clips]);

  async function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const audioFiles = list.filter(isSupportedAudio);
    const rejected = list.length - audioFiles.length;

    if (rejected > 0) {
      setError(messages.ui.onlyAudioAccepted);
      setPhase("error");
    } else if (phase === "error") {
      setError(null);
      setPhase("idle");
    }

    if (audioFiles.length === 0) {
      return;
    }

    const newClips: ClipEntry[] = [];
    for (const file of audioFiles) {
      try {
        const durationSec = await getAudioDuration(file);
        newClips.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          durationSec,
          trimStartSec: 0,
          trimEndSec: durationSec,
        });
      } catch {
        setError(`Could not read duration for ${file.name}.`);
        setPhase("error");
      }
    }

    if (newClips.length === 0) {
      return;
    }

    const combined = [...clips, ...newClips];
    if (totalBytes(combined) > maxBytes) {
      for (const clip of newClips) {
        URL.revokeObjectURL(clip.previewUrl);
      }
      setError(`Total size exceeds the ${formatSize(maxBytes)} limit.`);
      setPhase("error");
      return;
    }

    setClips(combined);
    setError(null);
    if (phase === "done") {
      setPhase("idle");
    }
  }

  function updateClip(id: string, patch: Partial<ClipEntry>) {
    setClips((current) =>
      current.map((clip) => (clip.id === id ? { ...clip, ...patch } : clip)),
    );
    if (phase === "done") {
      setPhase("idle");
    }
  }

  function removeClip(index: number) {
    setClips((current) => {
      const clip = current[index];
      if (clip) {
        URL.revokeObjectURL(clip.previewUrl);
        if (playingId === clip.id) {
          previewAudioRef.current?.pause();
          setPlayingId(null);
        }
        if (expandedId === clip.id) {
          setExpandedId(null);
        }
      }
      return current.filter((_, i) => i !== index);
    });
    setPhase("idle");
    setError(null);
  }

  function moveClip(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= clips.length) {
      return;
    }
    setClips((current) => {
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });
    setPhase("idle");
  }

  function reorderClips(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }
    setClips((current) => {
      const copy = [...current];
      const [moved] = copy.splice(fromIndex, 1);
      if (!moved) {
        return current;
      }
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    setPhase("idle");
  }

  function clearAll() {
    for (const clip of clips) {
      URL.revokeObjectURL(clip.previewUrl);
    }
    previewAudioRef.current?.pause();
    setClips([]);
    setExpandedId(null);
    setPlayingId(null);
    setError(null);
    setProgressText(null);
    setPhase("idle");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function togglePreview(clip: ClipEntry) {
    if (playingId === clip.id) {
      previewAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    previewAudioRef.current?.pause();
    const audio = new Audio(clip.previewUrl);
    audio.currentTime = clip.trimStartSec;
    const stopAt = clip.trimEndSec;

    audio.ontimeupdate = () => {
      if (audio.currentTime >= stopAt) {
        audio.pause();
        setPlayingId(null);
      }
    };
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      setPlayingId(null);
      setError(messages.ui.couldNotPlayClip);
      setPhase("error");
    };

    previewAudioRef.current = audio;
    void audio.play();
    setPlayingId(clip.id);
  }

  async function handleMergeDownload() {
    if (clips.length === 0) {
      setError(messages.ui.addAtLeastOneClip);
      setPhase("error");
      return;
    }

    previewAudioRef.current?.pause();
    setPlayingId(null);
    setPhase("loading-ffmpeg");
    setError(null);
    setProgressText(messages.ui.loadingAudioEngine);

    try {
      const blob = await mergeAudioClips(
        clips.map((clip) => ({
          file: clip.file,
          trimStartSec: clip.trimStartSec,
          trimEndSec: clip.trimEndSec,
        })),
        exportFormat,
        (message) => {
          setPhase((current) => (current === "loading-ffmpeg" ? "merging" : current));
          setProgressText(message);
        },
      );

      const baseName = clips[0]?.file.name.replace(/\.[^.]+$/, "") ?? "audio";
      const ext =
        blob.type === "audio/ogg"
          ? "ogg"
          : exportFormat === "wav"
            ? "wav"
            : "mp3";
      const suffix = clips.length > 1 ? "merged" : "trimmed";
      downloadBlob(blob, `${baseName}-${suffix}.${ext}`);
      setPhase("done");
      setProgressText(null);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : messages.ui.couldNotMergeAudio;
      setError(message);
      setPhase("error");
      setProgressText(null);
    }
  }

  const isProcessing = phase === "loading-ffmpeg" || phase === "merging";

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) {
            void addFiles(event.dataTransfer.files);
          }
        }}
        data-dragging={dragging}
        className="glass-dropzone cursor-pointer px-6 py-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) {
              void addFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <p className="text-[15px] text-foreground">{messages.common.selectAudio}</p>
        <p className="mt-1.5 text-sm text-muted">{messages.common.orDragDrop}</p>
        <p className="mt-3 text-xs text-faint">
          MP3, WAV, M4A, AAC, OGG, FLAC · up to {formatSize(maxBytes)} total ·
          processed locally
        </p>
      </div>

      {clips.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium text-foreground">
              {clips.length} clip{clips.length === 1 ? "" : "s"} ·{" "}
              {formatSize(totalBytes(clips))} · {formatDuration(totalDuration)}{" "}
              merged
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted hover:text-foreground"
            >
              Clear all
            </button>
          </div>

          <p className="mt-2 text-sm text-muted">
            Drag clips to reorder, trim on the waveform, then merge and download.
          </p>

          <ol className="mt-3 divide-y divide-border rounded border border-border bg-background">
            {clips.map((clip, index) => {
              const trimmed = effectiveDuration(clip);
              const isExpanded = expandedId === clip.id;
              const isPlaying = playingId === clip.id;

              return (
                <li
                  key={clip.id}
                  draggable={!isExpanded}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragIndex !== null) {
                      reorderClips(dragIndex, index);
                    }
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={[
                    "px-4 py-3",
                    dragIndex === index ? "bg-background-subtle" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 cursor-grab text-sm tabular-nums text-faint">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-foreground">
                        {clip.file.name}
                      </p>
                      <p className="text-sm text-muted">
                        {formatSize(clip.file.size)} ·{" "}
                        {formatDuration(clip.durationSec)}
                        {trimmed < clip.durationSec - 0.05 && (
                          <>
                            {" "}
                            → {formatDuration(trimmed)}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePreview(clip)}
                        className="px-2 py-1 text-sm text-muted hover:text-foreground"
                      >
                        {isPlaying ? "Pause" : "Play"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : clip.id)
                        }
                        className="px-2 py-1 text-sm text-muted hover:text-foreground"
                      >
                        {isExpanded ? messages.ui.hideTrim : messages.ui.editTrim}
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${clip.file.name} up`}
                        disabled={index === 0}
                        onClick={() => moveClip(index, -1)}
                        className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${clip.file.name} down`}
                        disabled={index === clips.length - 1}
                        onClick={() => moveClip(index, 1)}
                        className="px-2 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeClip(index)}
                        className="px-2 py-1 text-sm text-muted hover:text-foreground"
                      >
                        {messages.common.remove}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-8">
                      <ClipWaveformEditor
                        previewUrl={clip.previewUrl}
                        durationSec={clip.durationSec}
                        trimStartSec={clip.trimStartSec}
                        trimEndSec={clip.trimEndSec}
                        onTrimChange={(start, end) =>
                          updateClip(clip.id, {
                            trimStartSec: start,
                            trimEndSec: end,
                          })
                        }
                      />
                      <ClipTrimInputs
                        durationSec={clip.durationSec}
                        trimStartSec={clip.trimStartSec}
                        trimEndSec={clip.trimEndSec}
                        onTrimChange={(start, end) =>
                          updateClip(clip.id, {
                            trimStartSec: start,
                            trimEndSec: end,
                          })
                        }
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-foreground">
                Export format
              </legend>
              <div className="mt-2 flex gap-4 text-sm">
                <label className="flex items-center gap-2 text-foreground">
                  <input
                    type="radio"
                    name="export-format"
                    value="mp3"
                    checked={exportFormat === "mp3"}
                    onChange={() => setExportFormat("mp3")}
                  />
                  MP3
                </label>
                <label className="flex items-center gap-2 text-foreground">
                  <input
                    type="radio"
                    name="export-format"
                    value="wav"
                    checked={exportFormat === "wav"}
                    onChange={() => setExportFormat("wav")}
                  />
                  WAV
                </label>
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleMergeDownload()}
                disabled={isProcessing}
                className="btn-primary"
              >
                {isProcessing ? messages.ui.mergingAudio : messages.ui.mergeAudio}
              </button>
              {phase === "done" && (
                <span className="text-sm text-muted">Download started.</span>
              )}
            </div>

            {progressText && (
              <p className="text-sm text-muted">{progressText}</p>
            )}
          </div>
        </section>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
