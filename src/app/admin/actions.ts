"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return { error: "Contraseña incorrecta." };
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  revalidatePath("/admin");

  return {};
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}
