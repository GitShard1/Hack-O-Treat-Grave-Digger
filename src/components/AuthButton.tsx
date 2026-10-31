// OWNER: Builder B. "Sign in with GitHub" for private repos, or the signed-in user with sign-out.
// Also shows the result of a sign-in (?auth=ok|error|unavailable) and the private-repo privacy note.
// Renders nothing when sign-in isn't configured on the server.
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthStatusSchema, type AuthStatus } from "@/lib/contract";
import { COPY } from "@/content/copy";

type AuthOutcome = keyof typeof COPY.auth.messages;
const isOutcome = (value: string | null): value is AuthOutcome =>
  value !== null && Object.hasOwn(COPY.auth.messages, value);

export function AuthButton() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [outcome, setOutcome] = useState<AuthOutcome | null>(null);

  useEffect(() => {
    // Read and then remove ?auth=... so a refresh doesn't repeat the message.
    const url = new URL(window.location.href);
    const auth = url.searchParams.get("auth");
    if (isOutcome(auth)) {
      setOutcome(auth);
      url.searchParams.delete("auth");
      window.history.replaceState(null, "", url);
    }
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setStatus(AuthStatusSchema.parse(data)))
      .catch(() => setStatus(null));
  }, []);

  async function signOut() {
    await fetch("/api/auth/github/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/");
  }

  const message = outcome ? <p className="mt-2 text-xs text-muted">{COPY.auth.messages[outcome]}</p> : null;
  if (!status?.available) return message;

  if (!status.signedIn) {
    return (
      <div>
        <a
          href="/api/auth/github/login"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-strong px-4 py-2 text-xs transition hover:border-highlight"
        >
          <GitHubMark />
          {COPY.auth.signIn}
        </a>
        {message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-strong py-1 pl-1 pr-3">
          {status.avatarUrl && (
            <Image src={status.avatarUrl} alt="" width={24} height={24} className="rounded-full" unoptimized />
          )}
          <span>{status.login}</span>
        </span>
        {status.installUrl && (
          <a href={status.installUrl} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-2 hover:text-ink">
            {COPY.auth.chooseRepos}
          </a>
        )}
        <button type="button" onClick={() => void signOut()} className="text-muted underline underline-offset-2 hover:text-ink">
          {COPY.auth.signOut}
        </button>
      </div>
      <p className="mt-2 max-w-xl text-xs text-muted">{COPY.auth.privacyNote}</p>
      {message}
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
