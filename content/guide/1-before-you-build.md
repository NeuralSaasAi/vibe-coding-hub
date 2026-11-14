---
id: before-you-build
title: Before you build
short: Before you build
emoji: 🧱
topics:
  - Git from day one
  - A rules file for the AI
  - A well-known stack
  - Secrets in env vars
checklist:
  - My project is in git and connected to GitHub
  - A rules file describes my app, stack and limits
  - API keys live in environment variables, not in code
order: 1
summary: Set things up so mistakes are cheap.
---

- **Use git from day one.** Git saves a snapshot of your project every time you commit, so you can always go back. Connect your builder to GitHub, or use [GitHub Desktop](https://github.com/apps/desktop) if the terminal feels unfamiliar. Learn more in [Pro Git: About version control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control).
- **Give the AI a rules file.** A short file that describes your app, your stack and your rules ("never change the database schema without asking", "use the existing components") stops the AI from guessing each session. Each tool has its own version: [Cursor rules](https://cursor.com/docs/rules), [Claude Code memory](https://code.claude.com/docs/en/memory), [Kiro steering](https://kiro.dev/docs/steering/), and the cross-tool [AGENTS.md](https://agents.md) format.
- **Choose a common, well-documented stack.** AI tools write better code for popular tools such as React, Next.js, Supabase and Stripe, because they have seen far more examples. Avoid niche libraries in your first app.
- **Keep secrets out of your code.** API keys and passwords belong in environment variables, not in files the AI writes. See [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables) or [Vite env variables](https://vite.dev/guide/env-and-mode).

> [!WARNING]
> Anything starting with `NEXT_PUBLIC_` or `VITE_` is sent to every visitor's browser. Only public keys belong there. Supabase explains which of its keys are safe in the browser and which are not in [Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys).
