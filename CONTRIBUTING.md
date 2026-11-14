# Contributing to Vibe Coding Hub

Thanks for helping. This list is only useful if it stays accurate, and every correction counts, including a single price.

## Ways to help

- **Add a tool:** open a pull request, or use the [Add a tool](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=add-tool.yml) form if you'd rather not edit files.
- **Update a price or free tier:** use the [Pricing update](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=pricing-update.yml) form, or edit the table directly.
- **Report a broken link:** use the [Broken link](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=broken-link.yml) form.
- **Improve the guide:** suggest clearer wording, better official sources, or advice we're missing.

New to pull requests? Click the pencil icon on [README.md](README.md), make your edit, and GitHub walks you through the rest.

## What gets included

A tool is a good fit when it:

- is live and usable today (no waitlist-only products);
- helps people build, ship, secure or maintain software with AI;
- links to its official website or repository, not a review site, affiliate link or tracking link;
- is not a duplicate of an existing entry.

We may remove tools that shut down, stay broken, or change into something unrelated.

## Entry format

Add the tool to the right category, in alphabetical order:

```markdown
- [Tool name](https://official-site.com) - What it helps you do, in one plain sentence. `Free tier`
```

- Write the description in your own words. Don't copy marketing copy or text from other lists.
- Describe what the tool does, not how great it is. Skip words like "best", "revolutionary" or "game-changing".
- Add `Free tier` only if you checked the vendor's pricing page this month and a free plan exists.
- Add `Open source` only if the main product's code is public under an open-source license.

## Pricing rules

- Use only the vendor's own pricing page, docs or help center as the source. Blog posts and review sites go out of date.
- Use USD per month, before tax. Note "billed yearly" if that's the only price shown.
- Update the **Last verified** column to the current month (`YYYY-MM`) for any row you check, even if the price didn't change.
- If a plan changed name, use the new name.

## Disclosure

If you work for, own, or are paid by a tool you're adding or editing, say so in the pull request. You're welcome to contribute; we just need to know. Undisclosed self-promotion will be closed.

## Before you open a pull request

The checks run automatically, but you can run them locally:

```bash
npx markdownlint-cli2 "**/*.md"
lychee --config lychee.toml "./**/*.md"
```

[lychee](https://lychee.cli.rs) is the link checker. Install it with `brew install lychee` or see its docs.

## Code of Conduct

By taking part, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
