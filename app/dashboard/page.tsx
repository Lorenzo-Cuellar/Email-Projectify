import Link from "next/link";

import {
  createProjectAction,
  deleteProjectAction,
  disconnectGmailAction,
  syncGmailAction,
  updateProjectAction
} from "@/app/dashboard/actions";
import { GmailConnectionPanel } from "@/components/gmail-connection-panel";
import { LogoutButton } from "@/components/logout-button";
import { ProjectForm } from "@/components/project-form";
import { isGoogleOAuthConfigured } from "@/lib/gmail";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, truncateText } from "@/lib/utils";

const stats = [
  {
    label: "Projects",
    value: (count: number) => count.toString().padStart(2, "0"),
    description: "Defined buckets for future AI email routing."
  },
  {
    label: "Connected inboxes",
    value: (count: number) => count.toString().padStart(2, "0"),
    description: "Gmail mailboxes linked to this workspace."
  },
  {
    label: "Stored emails",
    value: (count: number) => count.toString().padStart(2, "0"),
    description: "Raw email records available for later AI processing."
  }
];

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getAlertCopy(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.gmailConnected === "1") {
    return "Gmail connected successfully. Run your first sync to pull recent messages into the app.";
  }

  const gmailError = searchParams.gmailError;

  if (typeof gmailError !== "string") {
    return null;
  }

  const errors: Record<string, string> = {
    config: "Google OAuth is not configured yet. Add the required env vars before connecting Gmail.",
    access_denied: "The Google account connection was canceled before consent was granted.",
    state: "The Google OAuth response could not be validated. Try connecting Gmail again.",
    callback: "Google account connection failed after consent. Recheck your OAuth credentials and redirect URI."
  };

  return errors[gmailError] ?? "A Gmail connection error occurred.";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = (await searchParams) ?? {};

  const [projects, connectedAccount, emailMessages, emailCount] = await Promise.all([
    prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.connectedEmailAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "gmail"
        }
      }
    }),
    prisma.emailMessage.findMany({
      where: { userId: user.id },
      orderBy: { receivedAt: "desc" },
      take: 12
    }),
    prisma.emailMessage.count({
      where: { userId: user.id }
    })
  ]);

  const alertCopy = getAlertCopy(resolvedSearchParams);
  const isGmailConfigured = isGoogleOAuthConfigured();

  return (
    <main className="dashboard">
      <div className="shell dashboard-layout">
        <aside className="card sidebar stack">
          <div className="stack" style={{ gap: "0.55rem" }}>
            <span className="pill">Workspace</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.8rem" }}>{user.name}</h1>
              <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="stack" style={{ gap: "0.55rem" }}>
            <span className="eyebrow">Phase 2 scope</span>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
              Gmail connection and manual sync are now available. AI summarization and project
              matching still come next, after email ingestion is stable.
            </p>
          </div>

          <GmailConnectionPanel
            isConfigured={isGmailConfigured}
            isConnected={Boolean(connectedAccount)}
            connectedEmail={connectedAccount?.providerAccountEmail}
            lastSyncedAt={
              connectedAccount?.lastSyncedAt
                ? formatDateTime(connectedAccount.lastSyncedAt)
                : undefined
            }
            syncAction={syncGmailAction}
            disconnectAction={disconnectGmailAction}
          />

          <ProjectForm
            action={createProjectAction}
            submitLabel="Create project"
            title="Add a project"
            description="Use plain language so later AI classification has strong semantic guidance."
          />

          <LogoutButton />
        </aside>

        <section className="main-panel">
          <section className="card hero-card">
            <div
              className="cluster"
              style={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <div className="stack" style={{ gap: "0.45rem", maxWidth: "58ch" }}>
                <span className="eyebrow">Dashboard</span>
                <h2 style={{ margin: 0, fontSize: "2.1rem" }}>Your project map for incoming email</h2>
                <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                  Gmail messages can now be pulled into the app and reviewed below. These stored
                  emails will feed the AI summarization and project assignment workflow in Phase 3.
                </p>
              </div>

              <Link href="/" className="button secondary">
                Marketing page
              </Link>
            </div>
          </section>

          {alertCopy ? <div className="success-banner">{alertCopy}</div> : null}

          <section className="stats-grid">
            {stats.map((stat) => (
              <article className="card stat-card" key={stat.label}>
                <span className="eyebrow">{stat.label}</span>
                <p style={{ margin: "0.55rem 0 0.4rem", fontSize: "2rem" }}>
                  {stat.label === "Projects"
                    ? stat.value(projects.length)
                    : stat.label === "Connected inboxes"
                      ? stat.value(connectedAccount ? 1 : 0)
                      : stat.value(emailCount)}
                </p>
                <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                  {stat.description}
                </p>
              </article>
            ))}
          </section>

          <section className="card inbox-card stack">
            <div className="project-header">
              <div className="stack" style={{ gap: "0.35rem" }}>
                <span className="eyebrow">Inbox Snapshot</span>
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Stored Gmail messages</h3>
              </div>
              {connectedAccount?.lastSyncedAt ? (
                <span className="pill">Last sync {formatDateTime(connectedAccount.lastSyncedAt)}</span>
              ) : null}
            </div>

            {emailMessages.length > 0 ? (
              <div className="message-list">
                {emailMessages.map((message) => (
                  <article className="message-row" key={message.id}>
                    <div className="stack" style={{ gap: "0.35rem" }}>
                      <div className="project-header">
                        <strong>{truncateText(message.subject, 90)}</strong>
                        <span className="pill">{formatDateTime(message.receivedAt)}</span>
                      </div>
                      <span className="muted">From {message.fromAddress}</span>
                      <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                        {truncateText(message.bodyText ?? message.snippet ?? "(No preview available)", 220)}
                      </p>
                    </div>
                    <a href={message.webLink} target="_blank" rel="noreferrer" className="button secondary">
                      Open in Gmail
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-card cardless stack">
                <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                  No emails have been imported yet. Connect Gmail, then run `Sync now` to pull in
                  your latest messages.
                </p>
              </div>
            )}
          </section>

          <section className="projects-grid">
            {projects.length > 0 ? (
              projects.map((project) => (
                <article className="card project-card stack" key={project.id}>
                  <div className="project-header">
                    <div className="stack" style={{ gap: "0.45rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.35rem" }}>{project.name}</h3>
                      <span className="pill">Updated {formatDate(project.updatedAt)}</span>
                    </div>

                    <form action={deleteProjectAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <button className="button secondary" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>

                  <p style={{ margin: 0, lineHeight: 1.7 }}>{project.description}</p>

                  <ProjectForm
                    action={updateProjectAction}
                    submitLabel="Save changes"
                    title={`Edit ${project.name}`}
                    description="Refine the description so future email classification has better context."
                    initialValues={{
                      projectId: project.id,
                      name: project.name,
                      description: project.description
                    }}
                  />
                </article>
              ))
            ) : (
              <article className="card empty-card stack">
                <span className="eyebrow">No projects yet</span>
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Create the first project definition</h3>
                <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                  Start with one active initiative and describe the emails that should belong to it:
                  stakeholders, topics, deliverables, and keywords.
                </p>
              </article>
            )}

            <article className="card undefined-card stack">
              <span className="eyebrow">Undefined</span>
              <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Future catch-all queue</h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                When email ingestion is added, any summary that does not match an existing project
                with sufficient confidence will land here for review.
              </p>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}
