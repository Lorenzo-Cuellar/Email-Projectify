import { redirect } from "next/navigation";

import { signUpAction } from "@/app/(auth)/auth-actions";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm action={signUpAction} mode="signup" />;
}
