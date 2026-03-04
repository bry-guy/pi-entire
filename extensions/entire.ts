/**
 * Entire CLI integration for pi coding agent.
 *
 * Maps pi lifecycle events to `entire hooks pi <event>` CLI calls,
 * enabling Entire's git-linked session checkpointing for pi.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn, spawnSync } from "child_process";

const DEFAULT_TIMEOUT_MS = 5000;

export interface EntireHooksDeps {
	isEntireInstalled: () => boolean;
	isEntireEnabled: () => boolean;
	callHook: (hookName: string, payload: Record<string, unknown>) => void;
	callHookSync: (hookName: string, payload: Record<string, unknown>) => void;
}

export function getEntireBin(): string {
	return process.env.ENTIRE_BIN?.trim() || "entire";
}

export function isEntireInstalled(entireBin = getEntireBin()): boolean {
	try {
		const result = spawnSync(entireBin, ["version"], {
			stdio: "ignore",
			timeout: 3000,
		});
		return result.status === 0;
	} catch {
		return false;
	}
}

export function isEntireEnabled(entireBin = getEntireBin()): boolean {
	try {
		const result = spawnSync(entireBin, ["status"], {
			encoding: "utf-8",
			timeout: DEFAULT_TIMEOUT_MS,
			stdio: ["pipe", "pipe", "pipe"],
		});
		if (result.status !== 0) return false;
		return !result.stdout.includes("not enabled");
	} catch {
		return false;
	}
}

export function callHook(hookName: string, payload: Record<string, unknown>, entireBin = getEntireBin()): void {
	try {
		const child = spawn(entireBin, ["hooks", "pi", hookName], {
			stdio: ["pipe", "ignore", "ignore"],
			timeout: DEFAULT_TIMEOUT_MS,
		});
		child.on("error", () => {
			// Swallow spawn errors (e.g. binary missing) to keep extension non-fatal.
		});
		child.stdin?.end(JSON.stringify(payload));
		child.unref();
	} catch {
		// Silently ignore — extension failures must never crash pi
	}
}

export function callHookSync(hookName: string, payload: Record<string, unknown>, entireBin = getEntireBin()): void {
	try {
		spawnSync(entireBin, ["hooks", "pi", hookName], {
			input: JSON.stringify(payload),
			timeout: DEFAULT_TIMEOUT_MS,
			stdio: ["pipe", "ignore", "ignore"],
		});
	} catch {
		// Silently ignore — extension failures must never crash pi
	}
}

export function createEntireExtension(deps?: Partial<EntireHooksDeps>) {
	const resolvedDeps: EntireHooksDeps = {
		isEntireInstalled: deps?.isEntireInstalled ?? (() => isEntireInstalled()),
		isEntireEnabled: deps?.isEntireEnabled ?? (() => isEntireEnabled()),
		callHook: deps?.callHook ?? ((hookName, payload) => callHook(hookName, payload)),
		callHookSync: deps?.callHookSync ?? ((hookName, payload) => callHookSync(hookName, payload)),
	};

	return function (pi: ExtensionAPI) {
		let sessionId: string | null = null;
		let sessionRef: string | null = null;
		let currentModel: string | null = null;
		let enabled = false;

		pi.on("session_start", async (_event, ctx) => {
			if (!resolvedDeps.isEntireInstalled()) {
				ctx.ui.notify("pi-entire: Entire CLI not found on PATH. Install from https://entire.io", "warning");
				return;
			}

			if (!resolvedDeps.isEntireEnabled()) {
				ctx.ui.notify("pi-entire: Entire not enabled in this repo. Run `entire enable --agent pi`", "warning");
				return;
			}

			const resolvedSessionId = ctx.sessionManager.getSessionId?.() ?? null;
			const resolvedSessionRef = ctx.sessionManager.getSessionFile?.() ?? null;

			if (!resolvedSessionId || !resolvedSessionRef) {
				ctx.ui.notify("pi-entire: ephemeral session detected (e.g. --no-session), skipping Entire hooks", "info");
				return;
			}

			enabled = true;
			sessionId = resolvedSessionId;
			sessionRef = resolvedSessionRef;

			resolvedDeps.callHook("session-start", {
				session_id: sessionId,
				session_ref: sessionRef,
			});
		});

		pi.on("agent_start", async (_event, ctx) => {
			currentModel = ctx.model?.id ?? currentModel;
		});

		pi.on("before_agent_start", async (event, ctx) => {
			if (!enabled || !sessionId || !sessionRef) return;

			const prompt = event.prompt ?? "";
			currentModel = ctx.model?.id ?? currentModel;
			sessionRef = ctx.sessionManager.getSessionFile?.() ?? sessionRef;

			resolvedDeps.callHook("turn-start", {
				session_id: sessionId,
				session_ref: sessionRef,
				prompt,
				model: currentModel ?? "",
				leaf_id: ctx.sessionManager.getLeafId?.() ?? "",
			});
		});

		pi.on("turn_end", async (_event, ctx) => {
			if (!enabled || !sessionId || !sessionRef) return;

			currentModel = ctx.model?.id ?? currentModel;
			sessionRef = ctx.sessionManager.getSessionFile?.() ?? sessionRef;

			resolvedDeps.callHookSync("turn-end", {
				session_id: sessionId,
				session_ref: sessionRef,
				model: currentModel ?? "",
				leaf_id: ctx.sessionManager.getLeafId?.() ?? "",
			});
		});

		pi.on("session_before_compact", async (_event, ctx) => {
			if (!enabled || !sessionId || !sessionRef) return;

			sessionRef = ctx.sessionManager.getSessionFile?.() ?? sessionRef;
			resolvedDeps.callHook("compaction", {
				session_id: sessionId,
				session_ref: sessionRef,
				leaf_id: ctx.sessionManager.getLeafId?.() ?? "",
			});
		});

		pi.on("session_shutdown", async (_event, ctx) => {
			if (!enabled || !sessionId || !sessionRef) return;

			sessionRef = ctx.sessionManager.getSessionFile?.() ?? sessionRef;
			resolvedDeps.callHookSync("session-end", {
				session_id: sessionId,
				session_ref: sessionRef,
				leaf_id: ctx.sessionManager.getLeafId?.() ?? "",
			});

			enabled = false;
			sessionId = null;
			sessionRef = null;
			currentModel = null;
		});
	};
}

export default createEntireExtension();
