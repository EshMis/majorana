"use client";

import { useId, useRef, type FormEvent, type Ref } from "react";
import { ChevronIcon, PaperclipIcon } from "./icons";
import type { PublicLocale } from "../lib/public-locale";
import { COMPOSER_MODES, type ComposerMode } from "../lib/run-mode";
import {
  COMPOSER_FRAMEWORKS,
  type ComposerFramework,
} from "../lib/framework-selection";

export type { ComposerFramework } from "../lib/framework-selection";

export interface ComposerAttachment {
  name: string;
  size: number;
}

export const COMPOSER_ATTACHMENT_ACCEPT = ".py,.txt,.md,.json,.qasm,.csv";

export function RunComposer({
  value,
  pending,
  error,
  onChange,
  onSubmit,
  onAttach,
  onFiles,
  attachments,
  onRemoveAttachment,
  contextArtifact,
  onClearContext,
  mode,
  onModeChange,
  framework,
  onFrameworkChange,
  onStop,
  stopping = false,
  disabled = false,
  readingAttachments = false,
  inputRef,
  centered = false,
  locale = "en",
}: {
  value: string;
  pending: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAttach?: () => void;
  onFiles?: (files: File[]) => void;
  attachments?: ComposerAttachment[];
  onRemoveAttachment?: (name: string) => void;
  contextArtifact?: { title: string; framework: string; codeAvailable: boolean } | null;
  onClearContext?: () => void;
  mode?: ComposerMode;
  onModeChange?: (mode: ComposerMode) => void;
  framework?: ComposerFramework;
  onFrameworkChange?: (framework: ComposerFramework) => void;
  /** Present only where a run can actually be cancelled. */
  onStop?: () => void;
  stopping?: boolean;
  /** Loading conversation/context or attachments must block submission only. */
  disabled?: boolean;
  readingAttachments?: boolean;
  /** Lets a prompt suggestion return focus to the shared conversation input. */
  inputRef?: Ref<HTMLTextAreaElement>;
  centered?: boolean;
  locale?: PublicLocale;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const labels = locale === "ja"
    ? {
        task: "メッセージ",
        attach: "ファイルを添付",
        pending: "実行中",
        send: "送信",
        stop: "停止",
        stopping: "停止しています",
        context: "コンテキスト",
        codeAttached: "コードを添付済み",
        removeContext: "コンテキストを外す",
        mode: "応答モード",
        modeAuto: "自動",
        modeExecute: "実行",
        modeQapp: "Qapp",
        modeIdeate: "学ぶ",
        modeExplain: "解説",
        framework: "回路フレームワーク",
        keyboard: "⌘ / Ctrl + Enter で送信",
        reading: "添付ファイルを読み込み中…",
      }
    : {
        task: "Message",
        attach: "Attach files",
        pending: "Working",
        send: "Send",
        stop: "Stop",
        stopping: "Stopping",
        context: "Context",
        codeAttached: "code attached",
        removeContext: "Remove context",
        mode: "Response mode",
        modeAuto: "Auto",
        modeExecute: "Execute",
        modeQapp: "Qapp",
        modeIdeate: "Learn",
        modeExplain: "Explain",
        framework: "Circuit framework",
        keyboard: "⌘ / Ctrl + Enter to send",
        reading: "Reading attachments…",
      };

  return (
    <div className={`mj-composer-dock${centered ? " mj-composer-dock--centered" : ""}`}>
      <form className="mj-composer" onSubmit={onSubmit} aria-busy={pending || disabled || readingAttachments}>
        {pending ? (
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {stopping ? labels.stopping : labels.pending}
          </span>
        ) : null}
        {contextArtifact ? (
          <div className="mj-composer-context" aria-label={`${labels.context}: ${contextArtifact.title}`}>
            <PaperclipIcon size={14} />
            <span>
              <strong>{contextArtifact.title}</strong>
              <small>{contextArtifact.framework} · {contextArtifact.codeAvailable ? labels.codeAttached : labels.context}</small>
            </span>
            {onClearContext ? (
              <button type="button" aria-label={labels.removeContext} title={labels.removeContext} onClick={onClearContext}>
                ×
              </button>
            ) : null}
          </div>
        ) : null}
        {attachments?.length ? (
          <div className="mj-composer-attachments" aria-label={locale === "ja" ? "添付ファイル" : "Attachments"}>
            {attachments.map((attachment) => (
              <span className="mj-composer-attachment" key={attachment.name}>
                <PaperclipIcon size={12} />
                <span>{attachment.name}</span>
                <small>{formatAttachmentSize(attachment.size)}</small>
                {onRemoveAttachment ? (
                  <button type="button" aria-label={`${locale === "ja" ? "添付を削除" : "Remove attachment"} ${attachment.name}`} onClick={() => onRemoveAttachment(attachment.name)}>×</button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mj-composer-ghost-wrap">
          <textarea
            ref={inputRef}
            className="mj-composer-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
                && (event.metaKey || event.ctrlKey)
                && !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
                return;
              }
            }}
            placeholder={basePlaceholder(locale)}
            aria-label={labels.task}
            aria-describedby={helpId}
            rows={1}
          />
        </div>
        <span className="sr-only" id={helpId}>{labels.keyboard}</span>
        <div className="mj-composer-controls">
          <div className="mj-composer-left">
            {onFiles || onAttach ? <button
              className="mj-icon-button"
              type="button"
              aria-label={labels.attach}
              title={labels.attach}
              onClick={() => {
                if (onFiles) fileInputRef.current?.click();
                else onAttach?.();
              }}
            >
              <PaperclipIcon size={16} />
            </button> : null}
            {onFiles ? (
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept={COMPOSER_ATTACHMENT_ACCEPT}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) onFiles(files);
                  event.target.value = "";
                }}
              />
            ) : null}
            {mode && onModeChange ? (
              <label className="mj-composer-select">
                <span className="sr-only">{labels.mode}</span>
                <select
                  aria-label={labels.mode}
                  value={mode}
                  onChange={(event) => onModeChange(event.target.value as ComposerMode)}
                >
                  {COMPOSER_MODES.map((option) => (
                    <option key={option} value={option}>
                      {option === "auto"
                        ? labels.modeAuto
                        : option === "execute"
                          ? labels.modeExecute
                          : option === "qapp"
                            ? labels.modeQapp
                          : option === "ideate"
                            ? labels.modeIdeate
                            : labels.modeExplain}
                    </option>
                  ))}
                </select>
                <ChevronIcon size={12} />
              </label>
            ) : null}
            {framework && onFrameworkChange ? (
              <label className="mj-composer-select">
                <span className="sr-only">{labels.framework}</span>
                <select
                  aria-label={labels.framework}
                  value={framework}
                  onChange={(event) => onFrameworkChange(event.target.value as ComposerFramework)}
                >
                  {COMPOSER_FRAMEWORKS.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <ChevronIcon size={12} />
              </label>
            ) : null}
          </div>
          <div className="mj-composer-right">
            {/* Stop takes the send button's place rather than sitting beside it:
                the control the reader is already looking at is the one that has
                to cancel, and two buttons here would mean deciding which is
                primary while a response is mid-flight. */}
            {pending && onStop ? (
              <button
                className="mj-primary-button mj-composer-stop"
                type="button"
                disabled={stopping}
                onClick={onStop}
              >
                {stopping ? labels.stopping : labels.stop}
                <span className="mj-composer-stop-mark" aria-hidden="true" />
              </button>
            ) : (
              <>
                {!pending ? <kbd className="mj-command-hint">⌘/Ctrl ↵</kbd> : null}
                <button className="mj-primary-button" type="submit" disabled={pending || disabled || readingAttachments || !value.trim()}>
                  {pending ? labels.pending : labels.send}
                </button>
              </>
            )}
          </div>
        </div>
        {readingAttachments ? <p className="mj-composer-feedback" role="status">{labels.reading}</p> : null}
        {error ? <p className="mj-composer-feedback mj-composer-feedback--error" role="alert">{error}</p> : null}
      </form>
    </div>
  );
}

function formatAttachmentSize(size: number): string {
  return size >= 1024 ? `${Math.round(size / 1024)} KB` : `${size} B`;
}

function basePlaceholder(locale: PublicLocale): string {
  return locale === "ja"
    ? "作りたい回路や調べたいことを入力"
    : "Describe your quantum task";
}
