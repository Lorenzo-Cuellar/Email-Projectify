import { redirect } from "next/navigation";

import { signInAction } from "@/app/(auth)/auth-actions";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm action={signInAction} mode="login" />;
}
