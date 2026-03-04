/**
 * Entire CLI integration for pi coding agent.
 *
 * Maps pi lifecycle events to `entire hooks pi <event>` CLI calls,
 * enabling Entire's git-linked session checkpointing for pi.
 *
 * Prerequisites:
 *   - Entire CLI installed: https://entire.io
 *   - Entire enabled in your repo: `entire enable --agent pi`
 *   - Entire's pi agent adapter (not yet available — see ROADMAP.md)
 *
 * Usage:
 *   pi install git:github.com/bry-guy/pi-entire
 *   # or for development:
 *   pi --extension ./extensions/entire.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { execSync, exec } from "child_process";
import { existsSync } from "fs";

const ENTIRE_CMD = "entire";

/**
 * Check if Entire CLI is installed and available on PATH.
 */
function isEntireInstalled(): boolean {
	try {
		execSync(`${ENTIRE_CMD} version`, { stdio: "ignore", timeout: 3000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if Entire is enabled in the current repo (hooks installed).
 */
function isEntireEnabled(): boolean {
	try {
		const output = execSync(`${ENTIRE_CMD} status`, {
			encoding: "utf-8",
			timeout: 5000,
			stdio: ["pipe", "pipe", "pipe"],
		});
		return !output.includes("not enabled");
	} catch {
		return false;
	}
}

/**
 * Pipe JSON payload to `entire hooks pi <hookName>` asynchronously.
 * Errors are silently ignored — extension failures must never crash pi.
 */
function callHook(hookName: string, payload: Record<string, unknown>): void {
	try {
		const json = JSON.stringify(payload);
		const child = exec(
			`echo '${json.replace(/'/g, "'\\''")}' | ${ENTIRE_CMD} hooks pi ${hookName}`,
			{ timeout: 5000 },
		);
		// Fire and forget — don't await
		child.unref?.();
	} catch {
		// Silently ignore — extension failures must never crash pi
	}
}

/**
 * Synchronous variant for events near process exit (turn-end, session-end).
 * Async calls would be killed before completing during shutdown.
 */
function callHookSync(hookName: string, payload: Record<string, unknown>): void {
	try {
		const json = JSON.stringify(payload);
		execSync(
			`echo '${json.replace(/'/g, "'\\''")}' | ${ENTIRE_CMD} hooks pi ${hookName}`,
			{ timeout: 5000, stdio: ["pipe", "ignore", "ignore"] },
		);
	} catch {
		// Silently ignore — extension failures must never crash pi
	}
}

export default function (pi: ExtensionAPI) {
	// State tracking across events
	let sessionId: string | null = null;
	let currentModel: string | null = null;
	let enabled = false;

	// --- Startup checks ---

	pi.on("session_start", async (_event, ctx) => {
		if (!isEntireInstalled()) {
			ctx.ui.notify("pi-entire: Entire CLI not found on PATH. Install from https://entire.io", "warning");
			return;
		}

		if (!isEntireEnabled()) {
			ctx.ui.notify("pi-entire: Entire not enabled in this repo. Run `entire enable --agent pi`", "warning");
			return;
		}

		enabled = true;
		sessionId = ctx.sessionManager.getSessionId?.() ?? `pi-${Date.now()}`;

		callHook("session-start", {
			session_id: sessionId,
		});
	});

	// --- Track model changes ---

	pi.on("agent_start", async (_event, ctx) => {
		currentModel = ctx.model?.id ?? null;
	});

	// --- Turn lifecycle ---

	pi.on("before_agent_start", async (event, _ctx) => {
		if (!enabled || !sessionId) return;

		// Extract prompt text from the event
		const prompt = event.prompt ?? "";

		callHook("turn-start", {
			session_id: sessionId,
			prompt,
			model: currentModel ?? "",
		});
	});

	pi.on("turn_end", async (_event, _ctx) => {
		if (!enabled || !sessionId) return;

		// Use sync variant: turn-end may fire close to shutdown
		callHookSync("turn-end", {
			session_id: sessionId,
			model: currentModel ?? "",
		});
	});

	// --- Compaction ---

	pi.on("session_before_compact", async (_event, _ctx) => {
		if (!enabled || !sessionId) return;

		callHook("compaction", {
			session_id: sessionId,
		});

		// Return nothing — let pi's default compaction proceed normally.
		// Entire captures the session state independently.
	});

	// --- Session end ---

	pi.on("session_shutdown", async (_event, _ctx) => {
		if (!enabled || !sessionId) return;

		// Use sync variant: this is the last event before process exit
		callHookSync("session-end", {
			session_id: sessionId,
		});

		sessionId = null;
	});
}
