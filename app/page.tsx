import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

const featureList = [
  "Create focused project buckets with clear natural-language descriptions.",
  "Prepare for scheduled email ingestion and AI-based project matching.",
  "Review a single dashboard that keeps active work visible."
];

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-grid">
      <div className="shell page-grid">
        <section className="card hero-card">
          <div className="stack" style={{ maxWidth: "680px" }}>
            <span className="pill">Phase 1 MVP scaffold</span>
            <div className="stack" style={{ gap: "0.7rem" }}>
              <span className="eyebrow">Email Projectify</span>
              <h1 style={{ margin: 0, fontSize: "clamp(2.6rem, 6vw, 4.8rem)", lineHeight: 0.95 }}>
                Turn incoming email into structured project context.
              </h1>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: "1.08rem", maxWidth: "56ch" }}>
              Start with account creation and project setup now, then layer Gmail sync and AI
              classification on top in the next phase.
            </p>
            <div className="cluster">
              <Link href="/signup" className="button">
                Create account
              </Link>
              <Link href="/login" className="button secondary">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          {featureList.map((item, index) => (
            <article className="card stat-card" key={item}>
              <span className="eyebrow">0{index + 1}</span>
              <p style={{ margin: "0.7rem 0 0", fontSize: "1.05rem", lineHeight: 1.5 }}>{item}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
