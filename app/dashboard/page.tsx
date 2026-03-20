import Link from "next/link";

import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction
} from "@/app/dashboard/actions";
import { LogoutButton } from "@/components/logout-button";
import { ProjectForm } from "@/components/project-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const stats = [
  {
    label: "Projects",
    value: (count: number) => count.toString().padStart(2, "0"),
    description: "Defined buckets for future AI email routing."
  },
  {
    label: "Undefined queue",
    value: () => "01",
    description: "Reserved space for messages that do not fit an existing project."
  },
  {
    label: "Email sync",
    value: () => "Phase 2",
    description: "Gmail connection and polling are intentionally deferred."
  }
];

export default async function DashboardPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" }
  });

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
            <span className="eyebrow">Phase 1 scope</span>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
              This dashboard establishes projects and account state so the email ingestion and AI
              routing workflow can be added cleanly in the next phase.
            </p>
          </div>

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
                  Define what belongs where now. In Phase 2, each Gmail message will be summarized
                  and matched against these descriptions before landing here.
                </p>
              </div>

              <Link href="/" className="button secondary">
                Marketing page
              </Link>
            </div>
          </section>

          <section className="stats-grid">
            {stats.map((stat) => (
              <article className="card stat-card" key={stat.label}>
                <span className="eyebrow">{stat.label}</span>
                <p style={{ margin: "0.55rem 0 0.4rem", fontSize: "2rem" }}>
                  {stat.value(projects.length)}
                </p>
                <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                  {stat.description}
                </p>
              </article>
            ))}
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
