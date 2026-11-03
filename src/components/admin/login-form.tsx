"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="h-11 w-full rounded-xl border border-ink-line bg-ink-soft px-3.5 text-sm text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-iris"
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-xs text-red-300">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
