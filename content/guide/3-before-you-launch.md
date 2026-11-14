---
id: before-you-launch
title: Before you launch
short: Before launch
emoji: 🚀
topics:
  - Database access rules
  - No secrets in the browser
  - Login on the live domain
  - Payments via webhooks
  - Backups and staging
checklist:
  - Database access rules are on for every table
  - No secret keys in browser code
  - Login works end to end on the live domain
  - Payments are confirmed by webhooks
  - Error and 404 pages exist
  - Backups are on and I know how to restore one
  - A staging or preview environment exists
  - I checked the app against the OWASP Top 10
order: 3
summary: A ship-ready checklist. Ask your AI tool to check each item, then verify it yourself.
---

- [ ] **Database access rules are on for every table.** Each user should only read and change their own data. Supabase calls this [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security); Firebase uses [Security Rules](https://firebase.google.com/docs/rules). Run the Supabase [Security Advisor](https://supabase.com/docs/guides/observability/advisors) before you launch.
- [ ] **No secret keys in browser code.** Search your code for `sk_`, `service_role` and `secret`. Turn on GitHub [secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning) or run [Gitleaks](https://github.com/gitleaks/gitleaks).
- [ ] **Login works end to end on the live domain.** Sign up, confirm email, log out, log in and reset a password on the real URL, not just the preview.
- [ ] **Payments are confirmed by webhooks, not by the browser.** Your server should mark an order as paid only after Stripe tells it so. See [Stripe webhooks](https://docs.stripe.com/webhooks) and [verify the signature](https://docs.stripe.com/webhooks/signature).
- [ ] **Error and 404 pages exist.** Users should never see a blank screen or a stack trace.
- [ ] **Backups are on, and you know how to restore one.** See [Supabase backups](https://supabase.com/docs/guides/platform/backups).
- [ ] **A staging or preview environment exists.** Try changes there first. Most hosts create a preview link for every branch.
- [ ] **Basic security review.** Skim the [OWASP Top 10](https://owasp.org/Top10/) and ask your AI tool to check the app against it.

> [!WARNING]
> Missing access rules are the most common serious problem in AI-built apps. In 2025, researchers found 170 apps built with one popular builder that exposed user data this way ([CVE-2025-48757](https://nvd.nist.gov/vuln/detail/CVE-2025-48757)). Turning on Row Level Security without writing policies blocks everything, so test with two real accounts.

> [!WARNING]
> Login that works in preview but loops or fails on your real domain usually means the domain is missing from your auth provider's allowed redirect URLs. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

> [!WARNING]
> If payments succeed in Stripe but your app never updates, the webhook is usually pointing at the wrong URL, using a test-mode secret in live mode, or failing signature checks. Test locally with the [Stripe CLI](https://docs.stripe.com/stripe-cli).
