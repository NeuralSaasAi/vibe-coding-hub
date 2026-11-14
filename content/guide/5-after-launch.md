---
id: after-launch
title: After launch
short: After launch
emoji: 💚
topics:
  - Errors and uptime
  - Package updates
  - Features on branches
  - Tests for key flows
  - Plan for real data
  - When to get a developer
checklist:
  - Error tracking and uptime alerts are on
  - Dependabot is turned on
  - Sign-up, login and checkout have tests
order: 5
summary: Keeping a live app healthy.
---

- **Track errors and uptime.** Add [Sentry](https://sentry.io) or a similar tool so you learn about errors from alerts, not angry emails. Add an uptime monitor such as [UptimeRobot](https://uptimerobot.com).
- **Keep packages updated.** Turn on [Dependabot](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain) so GitHub opens a pull request when a package has a security fix. Update one thing at a time and test.
- **Add features on a branch.** Work on a separate [branch](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches), test on its preview link, then merge.
- **Add a few tests for what matters most.** Sign-up, login and checkout are worth protecting. [Playwright codegen](https://playwright.dev/docs/codegen) records a test while you click through the app, and your AI tool can help turn it into a repeatable check.
- **Plan for real data.** Apps that feel fast with ten records can slow down with ten thousand. Load data in pages instead of all at once, and add database indexes on columns you filter by. See [Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization) and [PostgreSQL indexes](https://www.postgresql.org/docs/current/indexes.html).
- **Know when to bring in a developer.** Consider it when you are handling payments or sensitive data at scale, when the same bug keeps coming back, or when every new feature breaks an old one.

> [!WARNING]
> A slow app is usually caused by loading every row on each page view, or by one database query running inside a loop. Ask your AI tool to list every database query on the slow page before it tries a fix.
