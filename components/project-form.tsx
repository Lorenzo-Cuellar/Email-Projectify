"use client";

import { useActionState, useEffect, useState } from "react";

type ProjectFormProps = {
  action: (
    state: { error?: string; success?: boolean } | undefined,
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean }>;
  submitLabel: string;
  initialValues?: {
    projectId?: string;
    name: string;
    description: string;
  };
  title: string;
  description: string;
};

export function ProjectForm({
  action,
  submitLabel,
  initialValues,
  title,
  description
}: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [open, setOpen] = useState(!initialValues);

  useEffect(() => {
    if (initialValues && state.success) {
      setOpen(false);
    }
  }, [initialValues, state.success]);

  if (!open && initialValues) {
    return (
      <button className="button secondary" type="button" onClick={() => setOpen(true)}>
        Edit
      </button>
    );
  }

  return (
    <section className="card form-card">
      <div className="stack" style={{ gap: "0.4rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.45rem" }}>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {description}
        </p>
      </div>

      <form action={formAction} className="stack">
        {initialValues?.projectId ? (
          <input type="hidden" name="projectId" value={initialValues.projectId} />
        ) : null}

        <label className="field">
          <span className="label">Project name</span>
          <input
            className="input"
            type="text"
            name="name"
            placeholder="Q2 client renewals"
            defaultValue={initialValues?.name ?? ""}
            required
          />
        </label>

        <label className="field">
          <span className="label">Project description</span>
          <textarea
            className="textarea"
            name="description"
            placeholder="Describe the kind of emails, updates, and stakeholders that belong in this project."
            defaultValue={initialValues?.description ?? ""}
            required
          />
        </label>

        {state.error ? <div className="error-banner">{state.error}</div> : null}

        <div className="cluster">
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Saving..." : submitLabel}
          </button>
          {initialValues ? (
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
