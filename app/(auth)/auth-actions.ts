"use server";

import { redirect } from "next/navigation";

import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authSchema } from "@/lib/validators";

type AuthFormState = {
  error?: string;
};

export async function signUpAction(
  state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  void state;

  const parsed = authSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success || !parsed.data.name) {
    return { error: "Enter a valid name, email, and password with at least 8 characters." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (existingUser) {
    return { error: "An account with that email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password)
    }
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name
  });

  redirect("/dashboard");
}

export async function signInAction(
  state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  void state;

  const parsed = authSchema.omit({ name: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (!user) {
    return { error: "No account found for that email." };
  }

  const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    return { error: "Incorrect password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name
  });

  redirect("/dashboard");
}
