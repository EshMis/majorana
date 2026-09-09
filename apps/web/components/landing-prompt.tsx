"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "./icons";
import { writeLandingPromptHandoff } from "../lib/landing-prompt-handoff";

type LandingPromptCopy = {
  label: string;
  submit: string;
  retry: string;
  prompts: string[];
};

/** Carries a draft into Nala. Opening the workspace never starts a run. */
export function LandingPrompt({ copy }: { copy: LandingPromptCopy }) {
  const [value, setValue] = useState("");
  const [opening, setOpening] = useState(false);
  const [retry, setRetry] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const leaving = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!opening) return;
    const timeout = setTimeout(() => {
      leaving.current = false;
      setOpening(false);
      setRetry(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [opening]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (leaving.current || !value.trim()) return;
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
    <div className="lq-landing-prompt-section">
      <form className="mj-landing-prompt" onSubmit={submit} aria-busy={opening}>
        <label className="sr-only" htmlFor="mj-landing-prompt-input">{copy.label}</label>
        <textarea
          ref={input}
          id="mj-landing-prompt-input"
          rows={1}
          value={value}
          maxLength={4000}
          placeholder={copy.label}
          disabled={opening}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button className="mj-landing-prompt-submit" type="submit" aria-label={copy.submit} title={copy.submit} disabled={!value.trim() || opening}>
          <ArrowLeftIcon className="lq-arrow-forward" size={20} />
        </button>
      </form>
      {retry ? <p className="mj-page-lede" role="status">{copy.retry}</p> : null}
      {copy.prompts[0] ? (
        <button className="lq-prompt-example" type="button" disabled={opening} onClick={() => { setValue(copy.prompts[0]!); input.current?.focus(); }}>
          {copy.prompts[0]}
        </button>
      ) : null}
    </div>
  );
}
