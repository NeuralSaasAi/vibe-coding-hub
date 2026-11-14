---
id: when-something-breaks
title: When something breaks
short: When it breaks
emoji: 🛟
topics:
  - Reproduce it
  - Read the real error
  - Find the change
  - Roll back
  - Give the AI context
  - Stop the loop
checklist:
  - I can reproduce the problem step by step
  - I have the exact error message
  - I know the last version that worked
order: 4
summary: It will happen, and it is fixable. Use the same calm method every time, whatever tool you use.
---

1. **Reproduce it.** Write down the exact steps, what you expected and what happened. If you cannot make it happen again, you cannot confirm a fix.
2. **Read the real error.** Open your browser's [developer console](https://developer.chrome.com/docs/devtools/console) and [network tab](https://developer.chrome.com/docs/devtools/network), and check your host's logs. The error message is usually more useful than the symptom.
3. **Find the change that caused it.** Ask "what changed since it last worked?" Compare commits, or use [git bisect](https://git-scm.com/docs/git-bisect) to find the exact commit.
4. **Roll back if you are stuck.** Restoring the last working version is a valid fix while you investigate. Use your host's rollback (for example [Vercel instant rollback](https://vercel.com/docs/instant-rollback)) or [git revert](https://git-scm.com/docs/git-revert).
5. **Give the AI the right context.** Paste the exact error, the steps to reproduce and the relevant file. Ask it to explain the cause before it changes anything.
6. **Stop the loop.** If three attempts have not fixed it, stop prompting. Each new attempt can add more changes on top of the problem. Roll back, then try a fresh conversation with a clear summary.

Copy-paste prompts:

```text
Here is an error from my app: [paste error]. Steps to reproduce: [steps].
Before changing any code, explain what is causing this and which files are involved.
```

```text
This worked at commit [hash or description] and broke after [change].
Compare the two and tell me which change caused the problem. Do not edit anything yet.
```

```text
Fix only this issue. Do not change unrelated files, rename things or add new packages.
After the fix, list every file you changed and why.
```

> [!WARNING]
> If your app builds on your computer or in preview but fails on deploy, check for missing environment variables on the host and package version differences first. See [Vercel: troubleshoot a build](https://vercel.com/docs/deployments/troubleshoot-a-build).
