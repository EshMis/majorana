import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, fireEvent, render } from "@testing-library/react";
import { QappRuntime } from "../../components/qapp-runtime.tsx";

function start(frame: HTMLIFrameElement, requestId = "request-1") {
  const channel = frame.srcdoc.match(/const channel=("[^"\n]+");/)?.[1];
  assert.ok(channel, "the real iframe bridge exposes its channel");
  window.dispatchEvent(new window.MessageEvent("message", {
    source: frame.contentWindow,
    data: { channel: JSON.parse(channel), type: "qapp.execute", requestId, inputs: {} },
  }));
}

test("Qapp pauses automatic polling and resumes the accepted job without resubmitting", async (t) => {
  const scheduled: (() => void)[] = [];
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", ((callback: () => void, delay: number) => {
    if (delay === 1000 || delay === 2500) {
      scheduled.push(callback);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }
    return originalTimeout(callback, delay);
  }) as typeof setTimeout);
  let checks = 0;
  let submissions = 0;
  t.mock.method(globalThis, "fetch", async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      submissions += 1;
      return Response.json({ id: "job-1", status: "queued" });
    }
    checks += 1;
    return Response.json({ id: "job-1", status: checks === 151 ? "succeeded" : "running", result: { measured: 1 } });
  });
  const view = render(<QappRuntime slug="example" uiDocument="<p>Example</p>" canExecute />);
  const frame = view.getByTitle("Qapp") as HTMLIFrameElement;
  const response = t.mock.method(frame.contentWindow!, "postMessage");
  await act(async () => start(frame));
  for (let index = 0; index < 150; index += 1) {
    const callback = scheduled.shift();
    assert.ok(callback, `status check ${index + 1} is scheduled`);
    await act(async () => callback());
  }
  assert.equal(scheduled.length, 0, "automatic polling stops at its limit");
  assert.equal(response.mock.calls.length, 0, "a polling limit is not a job failure");
  assert.ok(view.getByText("Automatic updates paused. The execution may still be running."));
  await act(async () => start(frame, "second-request"));
  assert.equal(submissions, 1, "the accepted execution remains locked against duplicate submissions");
  await act(async () => fireEvent.click(view.getByRole("button", { name: "Retry status" })));
  assert.equal(submissions, 1);
  const completed = response.mock.calls.find(call => call.arguments[0]?.requestId === "request-1");
  assert.equal(completed?.arguments[0]?.ok, true);
  assert.ok(view.getByText("Execution complete."));
});

test("Qapp retries the same execution after a status outage without submitting again", async (t) => {
  const scheduled: (() => void)[] = [];
  const originalTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, "setTimeout", ((callback: () => void, delay: number) => {
    if (delay === 1000 || delay === 2500) {
      scheduled.push(callback);
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }
    return originalTimeout(callback, delay);
  }) as typeof setTimeout);
  let submissions = 0;
  let checks = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      submissions += 1;
      return Response.json({ id: "job-existing", status: "running" });
    }
    assert.ok(String(url).endsWith("/job-existing"));
    checks += 1;
    if (checks === 1) throw new TypeError("Network unavailable");
    return Response.json({ id: "job-existing", status: "succeeded", result: {} });
  });
  const view = render(<QappRuntime slug="example" uiDocument="<p>Example</p>" canExecute />);
  const frame = view.getByTitle("Qapp") as HTMLIFrameElement;
  const response = t.mock.method(frame.contentWindow!, "postMessage");
  await act(async () => start(frame));
  await act(async () => scheduled.shift()!());
  assert.ok(view.getByText("Connection interrupted. The execution may still be running."));
  assert.equal(response.mock.calls.length, 0, "an unavailable status is not a job failure");
  await act(async () => fireEvent.click(view.getByRole("button", { name: "Retry status" })));
  assert.equal(submissions, 1);
  assert.equal(response.mock.calls[0]?.arguments[0]?.ok, true);
  assert.ok(view.getByText("Execution complete."));
});
