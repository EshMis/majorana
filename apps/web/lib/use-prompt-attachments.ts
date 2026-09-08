"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicLocale } from "./public-locale";

export interface PromptAttachment {
  name: string;
  size: number;
  content: string;
}

const EXTENSIONS = [".py", ".txt", ".md", ".json", ".qasm", ".csv"];
const MAX_BYTES = 64 * 1024;
const MAX_COUNT = 4;

export function usePromptAttachments(locale: PublicLocale, onError: (message: string | null) => void) {
  const [attachments, setValue] = useState<PromptAttachment[]>([]);
  const [reading, setReading] = useState(false);
  const current = useRef<PromptAttachment[]>([]);
  const fileRevisions = useRef(new Map<string, number>());
  const pendingReads = useRef(0);
  const generation = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const replace = useCallback((value: PromptAttachment[]) => {
    current.current = value;
    setValue(value);
  }, []);

  async function addFiles(files: File[]) {
    const startedGeneration = generation.current;
    pendingReads.current += 1;
    setReading(true);
    const errors: string[] = [];
    try {
      const candidates = await Promise.all(files.map(async (file): Promise<(PromptAttachment & { revision: number }) | null> => {
        if (!EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
          errors.push(locale === "ja" ? `${file.name}: 対応形式は .py、.txt、.md、.json、.qasm、.csv です。` : `${file.name}: use .py, .txt, .md, .json, .qasm or .csv.`);
          return null;
        }
        if (file.size > MAX_BYTES) {
          errors.push(locale === "ja" ? `${file.name}: 64 KB以下のファイルを選んでください。` : `${file.name}: choose a file under 64 KB.`);
          return null;
        }
        const revision = (fileRevisions.current.get(file.name) ?? 0) + 1;
        fileRevisions.current.set(file.name, revision);
        try {
          return { name: file.name, size: file.size, content: await file.text(), revision };
        } catch {
          errors.push(locale === "ja" ? `${file.name}を読み取れませんでした。` : `${file.name} could not be read.`);
          return null;
        }
      }));
      if (!alive.current || generation.current !== startedGeneration) return;
      // Read the current list after file IO finishes. Concurrent file selections
      // and removals must not be overwritten by an earlier render's snapshot.
      const next = new Map(current.current.map((item) => [item.name, item]));
      for (const candidate of candidates) {
        if (!candidate || fileRevisions.current.get(candidate.name) !== candidate.revision) continue;
        if (!next.has(candidate.name) && next.size >= MAX_COUNT) {
          errors.push(locale === "ja" ? "添付ファイルは4件までです。" : "Attach up to 4 files per message.");
          continue;
        }
        const { revision: _revision, ...attachment } = candidate;
        next.set(attachment.name, attachment);
      }
      replace([...next.values()]);
      onError([...new Set(errors)].join(" ") || null);
    } finally {
      pendingReads.current -= 1;
      if (alive.current) setReading(pendingReads.current > 0);
    }
  }

  function removeAttachment(name: string) {
    fileRevisions.current.set(name, (fileRevisions.current.get(name) ?? 0) + 1);
    replace(current.current.filter((item) => item.name !== name));
  }

  function takeAttachments(): PromptAttachment[] {
    const sent = current.current;
    generation.current += 1;
    fileRevisions.current.clear();
    replace([]);
    return sent;
  }

  function restoreAttachments(sent: PromptAttachment[]) {
    const next = new Map(sent.map((item) => [item.name, item]));
    for (const item of current.current) next.set(item.name, item);
    replace([...next.values()].slice(0, MAX_COUNT));
  }

  const isReading = () => pendingReads.current > 0;
  return { attachments, reading, isReading, addFiles, removeAttachment, takeAttachments, restoreAttachments };
}
