"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validators";

type ProjectState = {
  error?: string;
  success?: boolean;
};

export async function createProjectAction(
  _: ProjectState,
  formData: FormData
): Promise<ProjectState> {
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
  _: ProjectState,
  formData: FormData
): Promise<ProjectState> {
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
