"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronIcon, PlusIcon } from "./icons";
import { ComposerGhostOverlay } from "./composer-ghost-overlay";
import { DELETE_MS_PER_CHARACTER, TYPE_MS_PER_CHARACTER, composerGhost } from "../lib/composer-ghost";
import { writeLandingPromptHandoff } from "../lib/landing-prompt-handoff";

type LandingPromptCopy = {
  label: string;
  attach: string;
  mode: string;
  submit: string;
  retry: string;
  prompts: string[];
};

/**
 * The cover's box. Carries a draft into Nala; opening the workspace never starts
 * a run.
 *
 * While the box is empty a suggestion types itself out, holds, erases and moves
 * on — the same rotation the workspace composer draws, from the same engine
 * (`lib/composer-ghost.ts`), so Tab accepts exactly the sentence on screen. The
 * clock stops while the tab is hidden and restarts from the first prompt when
 * it comes back, and under reduced motion the first prompt sits still with no
 * caret.
 */
export function LandingPrompt({ copy }: { copy: LandingPromptCopy }) {
  const [value, setValue] = useState("");
  const [opening, setOpening] = useState(false);
  const [retry, setRetry] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const leaving = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || value) return;
    // Restart from the first character rather than resuming wherever the clock
    // was left, so clearing the box never shows a frame of a half-typed sentence.
    setElapsedMs(0);
    // Bare `setInterval`, like the retry `setTimeout` below: the test harness mocks the
    // global clock, and jsdom's `window.setInterval` would run on a clock of its own.
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      const started = Date.now();
      // Sampled at the faster of the two per-character durations so deletion
      // reads as one character at a time rather than several at once.
      timer = setInterval(
        () => setElapsedMs(Date.now() - started),
        Math.min(TYPE_MS_PER_CHARACTER, DELETE_MS_PER_CHARACTER),
      );
    };
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      stop();
      if (document.visibilityState !== "hidden") {
        setElapsedMs(0);
        start();
      }
    };
    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduceMotion, value]);

  useEffect(() => {
    if (!opening) return;
    const timeout = setTimeout(() => {
      leaving.current = false;
      setOpening(false);
      setRetry(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [opening]);

  const ghost = composerGhost({ elapsedMs, suggestions: copy.prompts, typedValue: value, reduceMotion });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (leaving.current || !value.trim()) return;
    openWorkspace();
  }

  function openWorkspace() {
    if (leaving.current) return;
    leaving.current = true;
    setOpening(true);
    setRetry(false);
    writeLandingPromptHandoff(value);
    try {
      router.push("/run");
    } catch {
      leaving.current = false;
      setOpening(false);
      setRetry(true);
    }
  }

  return (
    <div className="lq-landing-prompt-restored">
      <form className="mj-landing-prompt" onSubmit={submit} aria-busy={opening}>
        <label className="sr-only" htmlFor="mj-landing-prompt-input">{copy.label}</label>
        <div className="mj-composer-ghost-wrap">
          {ghost ? <ComposerGhostOverlay frame={ghost} /> : null}
          <textarea
            ref={input}
            id="mj-landing-prompt-input"
            rows={1}
            value={value}
            maxLength={4000}
            // Empty while the ghost draws, so the two never overprint; the
            // first prompt stands in only when there is no rotation at all.
            placeholder={ghost ? "" : copy.prompts[0] ?? copy.label}
            disabled={opening}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
                return;
              }
              // Tab only steals focus movement while there is a suggestion to
              // accept and the box is empty, so the box never becomes a trap.
              if (event.key === "Tab" && !event.shiftKey && !event.nativeEvent.isComposing && !value && ghost) {
                event.preventDefault();
                setValue(ghost.suggestion);
              }
            }}
          />
        </div>
        <div className="mj-landing-prompt-controls">
          <button className="mj-landing-prompt-icon" type="button" aria-label={copy.attach} title={copy.attach} onClick={openWorkspace} disabled={opening}>
            <PlusIcon size={20} />
          </button>
          <div className="mj-landing-prompt-actions">
            <button className="mj-landing-prompt-mode" type="button" onClick={openWorkspace} disabled={opening}>
              {copy.mode}
            </button>
            <button className="mj-landing-prompt-submit" type="submit" aria-label={copy.submit} title={copy.submit} disabled={!value.trim() || opening}>
              {copy.submit}<ChevronIcon size={18} />
            </button>
          </div>
        </div>
      </form>
      {retry ? <p className="mj-page-lede" role="status">{copy.retry}</p> : null}
    </div>
  );
}
