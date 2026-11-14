---
id: while-you-build
title: While you build
short: While you build
emoji: 🛠️
topics:
  - One change per prompt
  - Commit when it works
  - Protect working code
  - Explain before accepting
  - Keep agents off live data
checklist:
  - I commit after every step that works
  - The AI explains each change before I accept it
  - Agents use a development database, never live data
order: 2
summary: Habits that stop small changes from turning into big messes.
---

- **One change per prompt.** "Add a settings page" works better than "add settings, fix the header and change the colors". Smaller changes are easier to check and to undo. Anthropic's [Claude Code best practices](https://code.claude.com/docs/en/best-practices) recommend asking the agent to plan first, then implement.
- **Commit after every step that works.** If the next prompt breaks something, you lose minutes, not days.
- **Protect code that already works.** Tell the AI which files or features not to touch. If it starts rewriting large parts of the app to fix a small problem, stop and undo.
- **Ask the AI to explain before you accept.** "What did you change and why?" catches surprises like deleted features, new packages or database changes.
- **Never let an agent work directly on your live data.** Use a separate development database. In July 2025 an AI agent [deleted a live production database](https://www.theregister.com/software/2025/07/21/vibe-coding-service-replit-deleted-production-database/719783) during a code freeze. Replit later [restored the data and added safeguards](https://www.fastcompany.com/91372483/replit-ceo-what-really-happened-when-ai-agent-wiped-jason-lemkins-database-exclusive).

> [!WARNING]
> When a new feature breaks an old one, the cause is usually a shared file the AI changed along the way. Compare the last working commit with the current one before asking for another fix.
