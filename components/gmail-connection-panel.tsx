"use client";

import Link from "next/link";
import { useActionState } from "react";

type GmailActionState = {
  error?: string;
  success?: boolean;
  importedCount?: number;
  scannedCount?: number;
};

type GmailConnectionPanelProps = {
  isConfigured: boolean;
  isConnected: boolean;
  connectedEmail?: string;
  lastSyncedAt?: string;
  syncAction: (
    state: GmailActionState | undefined,
    formData: FormData
  ) => Promise<GmailActionState>;
  disconnectAction: (
    state: GmailActionState | undefined,
    formData: FormData
  ) => Promise<GmailActionState>;
};

export function GmailConnectionPanel({
  isConfigured,
  isConnected,
  connectedEmail,
  lastSyncedAt,
  syncAction,
  disconnectAction
}: GmailConnectionPanelProps) {
  const [syncState, syncFormAction, syncPending] = useActionState(syncAction, undefined);
  const [disconnectState, disconnectFormAction, disconnectPending] = useActionState(
    disconnectAction,
    undefined
  );

  return (
    <section className="card form-card stack">
      <div className="stack" style={{ gap: "0.35rem" }}>
        <span className="eyebrow">Phase 2 scope</span>
        <h2 style={{ margin: 0, fontSize: "1.45rem" }}>Gmail connection</h2>
        <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
          Connect one Gmail account, fetch recent messages on demand, and persist them locally for
          later AI summarization and project matching.
        </p>
      </div>

      {!isConfigured ? (
        <div className="error-banner">
          Google OAuth credentials are missing. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
          `APP_URL` before connecting Gmail.
        </div>
      ) : null}

      {isConnected ? (
        <>
          <div className="stack" style={{ gap: "0.4rem" }}>
            <span className="pill">Connected mailbox</span>
            <strong>{connectedEmail}</strong>
            <span className="muted">
              {lastSyncedAt ? `Last synced ${lastSyncedAt}` : "No sync has run yet."}
            </span>
          </div>

          <div className="cluster">
            <form action={syncFormAction}>
              <button className="button" type="submit" disabled={syncPending}>
                {syncPending ? "Syncing..." : "Sync now"}
              </button>
            </form>

            <form action={disconnectFormAction}>
              <button className="button secondary" type="submit" disabled={disconnectPending}>
                {disconnectPending ? "Disconnecting..." : "Disconnect Gmail"}
              </button>
            </form>
          </div>
        </>
      ) : (
        <Link
          href={isConfigured ? "/api/gmail/connect" : "/dashboard"}
          className={`button${isConfigured ? "" : " secondary"}`}
        >
          Connect Gmail
        </Link>
      )}

      {syncState?.success ? (
        <div className="success-banner">
          Sync complete. Imported {syncState.importedCount} new email
          {syncState.importedCount === 1 ? "" : "s"} from {syncState.scannedCount} scanned.
        </div>
      ) : null}

      {syncState?.error ? <div className="error-banner">{syncState.error}</div> : null}
      {disconnectState?.success ? (
        <div className="success-banner">Gmail account disconnected.</div>
      ) : null}
      {disconnectState?.error ? <div className="error-banner">{disconnectState.error}</div> : null}
    </section>
  );
}
