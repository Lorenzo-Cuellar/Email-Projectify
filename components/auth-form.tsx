"use client";

import Link from "next/link";
import { useActionState } from "react";

type AuthFormProps = {
  action: (
    state: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string }>;
  mode: "login" | "signup";
};

const modeCopy = {
  login: {
    title: "Welcome back",
    description: "Sign in to manage projects before the email ingestion pipeline is added.",
    submitLabel: "Sign in",
    alternateLabel: "Need an account?",
    alternateHref: "/signup",
    alternateCta: "Create one"
  },
  signup: {
    title: "Create your workspace",
    description: "Set up your account and define the projects that incoming email should map to later.",
    submitLabel: "Create account",
    alternateLabel: "Already have an account?",
    alternateHref: "/login",
    alternateCta: "Sign in"
  }
} as const;

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const copy = modeCopy[mode];

  return (
    <section className="card auth-card">
      <div className="stack" style={{ gap: "0.6rem" }}>
        <span className="pill">{mode === "signup" ? "Phase 1 sign up" : "Phase 1 sign in"}</span>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <h1 style={{ margin: 0, fontSize: "2.3rem" }}>{copy.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {copy.description}
          </p>
        </div>
      </div>

      <form action={formAction} className="stack">
        {mode === "signup" ? (
          <label className="field">
            <span className="label">Name</span>
            <input className="input" type="text" name="name" placeholder="Jordan Lee" required />
          </label>
        ) : null}

        <label className="field">
          <span className="label">Email</span>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="At least 8 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />
        </label>

        {state.error ? <div className="error-banner">{state.error}</div> : null}

        <button className="button" type="submit" disabled={pending}>
          {pending ? "Working..." : copy.submitLabel}
        </button>
      </form>

      <p className="muted" style={{ margin: 0 }}>
        {copy.alternateLabel}{" "}
        <Link href={copy.alternateHref} style={{ color: "var(--accent-strong)" }}>
          {copy.alternateCta}
        </Link>
      </p>
    </section>
  );
}
