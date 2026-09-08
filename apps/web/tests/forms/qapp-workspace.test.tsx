import "./dom-env.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { QappWorkspace } from "../../app/(app)/qapps/[qappId]/qapp-workspace.tsx";

function detail(id: string) {
  return {
    qapp: { id, slug: id, title: `Qapp ${id}`, description: "Example circuit", visibility: "private" },
    version: { framework: "qiskit", ui_document: "<p>Example</p>", range_smoke: null },
  };
}

test("Qapp navigation failure replaces old detail with a working retry", async (t) => {
  let attempts = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (String(url) === "/api/qapps/a") return Response.json(detail("a"));
    assert.equal(String(url), "/api/qapps/b");
    attempts += 1;
    return attempts === 1 ? new Response(null, { status: 503 }) : Response.json(detail("b"));
  });
  const view = render(<QappWorkspace qappId="a" />);
  await waitFor(() => assert.ok(view.getByRole("heading", { name: "Qapp a" })));
  view.rerender(<QappWorkspace qappId="b" />);
  await waitFor(() => assert.ok(view.getByRole("alert")));
  assert.equal(view.queryByRole("heading", { name: "Qapp a" }), null);
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  await waitFor(() => assert.ok(view.getByRole("heading", { name: "Qapp b" })));
  assert.equal(attempts, 2);
});
