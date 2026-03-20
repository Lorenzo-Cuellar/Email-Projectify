"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, requireUser } from "@/lib/auth";
import { revokeGoogleAccount, syncGmailAccount } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validators";

type ProjectState = {
  error?: string;
  success?: boolean;
};

type GmailState = {
  error?: string;
  success?: boolean;
  importedCount?: number;
  scannedCount?: number;
};

export async function createProjectAction(
  state: ProjectState | undefined,
  formData: FormData
): Promise<ProjectState> {
  void state;

  const user = await requireUser();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    return { error: "Enter a project name and a description with at least 20 characters." };
  }

  await prisma.project.create({
    data: {
      userId: user.id,
      ...parsed.data
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProjectAction(
  state: ProjectState | undefined,
  formData: FormData
): Promise<ProjectState> {
  void state;

  const user = await requireUser();
  const projectId = formData.get("projectId");

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success || typeof projectId !== "string") {
    return { error: "The project update is invalid." };
  }

  const result = await prisma.project.updateMany({
    where: {
      id: projectId,
      userId: user.id
    },
    data: parsed.data
  });

  if (result.count === 0) {
    return { error: "Project not found." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser();
  const projectId = formData.get("projectId");

  if (typeof projectId !== "string") {
    return;
  }

  await prisma.project.deleteMany({
    where: {
      id: projectId,
      userId: user.id
    }
  });

  revalidatePath("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function syncGmailAction(
  state: GmailState | undefined,
  formData: FormData
): Promise<GmailState> {
  void state;
  void formData;

  const user = await requireUser();

  const account = await prisma.connectedEmailAccount.findUnique({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "gmail"
      }
    }
  });

  if (!account) {
    return { error: "Connect a Gmail account before syncing." };
  }

  try {
    const result = await syncGmailAccount(account);

    revalidatePath("/dashboard");

    return {
      success: true,
      importedCount: result.importedCount,
      scannedCount: result.scannedCount
    };
  } catch {
    return { error: "Gmail sync failed. Check your Google OAuth settings and try again." };
  }
}

export async function disconnectGmailAction(
  state: GmailState | undefined,
  formData: FormData
): Promise<GmailState> {
  void state;
  void formData;

  const user = await requireUser();

  const account = await prisma.connectedEmailAccount.findUnique({
    where: {
      userId_provider: {
        userId: user.id,
        provider: "gmail"
      }
    }
  });

  if (!account) {
    return { error: "No Gmail account is currently connected." };
  }

  try {
    await revokeGoogleAccount(account);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Unable to disconnect the Gmail account right now." };
  }
}
