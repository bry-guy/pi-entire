import { describe, expect, it, vi } from "vitest";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createEntireExtension } from "../extensions/entire";

type Handler = (event: any, ctx: any) => Promise<void> | void;

class FakePi {
	handlers = new Map<string, Handler>();

	on(eventName: string, handler: Handler) {
		this.handlers.set(eventName, handler);
	}
}

function makeCtx(overrides?: {
	sessionId?: string | null;
	sessionRef?: string | null;
	leafId?: string | null;
	model?: string | null;
}) {
	const notify = vi.fn();
	return {
		notify,
		ctx: {
			ui: { notify },
			sessionManager: {
				getSessionId: () => (overrides && "sessionId" in overrides ? overrides.sessionId : "sess-1"),
				getSessionFile: () => (overrides && "sessionRef" in overrides ? overrides.sessionRef : "/tmp/sess-1.jsonl"),
				getLeafId: () => (overrides && "leafId" in overrides ? overrides.leafId : "leaf-1"),
			},
			model: overrides?.model ? { id: overrides.model } : null,
		},
	};
}

async function runEvent(pi: FakePi, eventName: string, event: any, ctx: any) {
	const handler = pi.handlers.get(eventName);
	if (!handler) throw new Error(`missing handler for event: ${eventName}`);
	await handler(event, ctx);
}

describe("pi-entire extension", () => {
	it("emits lifecycle hooks for a persisted session", async () => {
		const callHook = vi.fn();
		const callHookSync = vi.fn();

		const extension = createEntireExtension({
			isEntireInstalled: () => true,
			isEntireEnabled: () => true,
			callHook,
			callHookSync,
		});

		const pi = new FakePi();
		extension(pi as unknown as ExtensionAPI);

		const { ctx } = makeCtx({ model: "gpt-5.3-codex" });

		await runEvent(pi, "session_start", {}, ctx);
		expect(callHook).toHaveBeenCalledWith("session-start", {
			session_id: "sess-1",
			session_ref: "/tmp/sess-1.jsonl",
		});

		await runEvent(pi, "before_agent_start", { prompt: "fix tests" }, ctx);
		expect(callHook).toHaveBeenCalledWith("turn-start", {
			session_id: "sess-1",
			session_ref: "/tmp/sess-1.jsonl",
			prompt: "fix tests",
			model: "gpt-5.3-codex",
			leaf_id: "leaf-1",
		});

		await runEvent(pi, "turn_end", {}, ctx);
		expect(callHookSync).toHaveBeenCalledWith("turn-end", {
			session_id: "sess-1",
			session_ref: "/tmp/sess-1.jsonl",
			model: "gpt-5.3-codex",
			leaf_id: "leaf-1",
		});

		await runEvent(pi, "session_before_compact", {}, ctx);
		expect(callHook).toHaveBeenCalledWith("compaction", {
			session_id: "sess-1",
			session_ref: "/tmp/sess-1.jsonl",
			leaf_id: "leaf-1",
		});

		await runEvent(pi, "session_shutdown", {}, ctx);
		expect(callHookSync).toHaveBeenCalledWith("session-end", {
			session_id: "sess-1",
			session_ref: "/tmp/sess-1.jsonl",
			leaf_id: "leaf-1",
		});
	});

	it("warns when Entire CLI is missing", async () => {
		const extension = createEntireExtension({
			isEntireInstalled: () => false,
			isEntireEnabled: () => true,
			callHook: vi.fn(),
			callHookSync: vi.fn(),
		});

		const pi = new FakePi();
		extension(pi as unknown as ExtensionAPI);

		const { ctx, notify } = makeCtx();
		await runEvent(pi, "session_start", {}, ctx);

		expect(notify).toHaveBeenCalledWith(
			"pi-entire: Entire CLI not found on PATH. Install from https://entire.io",
			"warning",
		);
	});

	it("warns when Entire is not enabled", async () => {
		const extension = createEntireExtension({
			isEntireInstalled: () => true,
			isEntireEnabled: () => false,
			callHook: vi.fn(),
			callHookSync: vi.fn(),
		});

		const pi = new FakePi();
		extension(pi as unknown as ExtensionAPI);

		const { ctx, notify } = makeCtx();
		await runEvent(pi, "session_start", {}, ctx);

		expect(notify).toHaveBeenCalledWith(
			"pi-entire: Entire not enabled in this repo. Run `entire enable --agent pi`",
			"warning",
		);
	});

	it("skips ephemeral sessions", async () => {
		const callHook = vi.fn();
		const extension = createEntireExtension({
			isEntireInstalled: () => true,
			isEntireEnabled: () => true,
			callHook,
			callHookSync: vi.fn(),
		});

		const pi = new FakePi();
		extension(pi as unknown as ExtensionAPI);

		const { ctx, notify } = makeCtx({ sessionRef: null });
		await runEvent(pi, "session_start", {}, ctx);

		expect(callHook).not.toHaveBeenCalled();
		expect(notify).toHaveBeenCalledWith(
			"pi-entire: ephemeral session detected (e.g. --no-session), skipping Entire hooks",
			"info",
		);
	});
});
