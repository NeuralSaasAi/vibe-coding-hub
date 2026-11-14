# Contributing to Vibe Coding Hub

Thanks for helping. This list is only useful if it stays accurate, and every correction counts, including a single price.

## Ways to help

- **Add a tool:** add one YAML file (see below), or use the [Add a tool](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=add-tool.yml) form if you'd rather not edit files.
- **Update a price or free tier:** edit the tool's YAML file, or use the [Pricing update](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=pricing-update.yml) form.
- **Report a broken link:** use the [Broken link](https://github.com/NeuralSaasAi/vibe-coding-hub/issues/new?template=broken-link.yml) form.
- **Improve the guide:** the five stages of "Keep your vibe-coded app alive" live in [`content/guide/`](content/guide). Suggest clearer wording, better official sources, or advice we're missing.

## Where things live

The README and the website are both built from the data files. **Don't edit the tool lists or tables in `README.md` directly**, because the next build overwrites them.

| What | File |
| --- | --- |
| One tool, its free tier and its prices | `data/tools/<tool-name>.yml` |
| Category names and intros | `data/categories.yml` |
| "Which tool for which job" | `data/jobs.yml` |
| Guide stages | `content/guide/*.md` |
| Everything else in the README | `README.md`, outside the `<!-- BEGIN -->` / `<!-- END -->` markers |

New to pull requests? Open the file on GitHub, click the pencil icon, make your edit, and GitHub walks you through the rest. You don't need to install anything; the checks run on your pull request.

## Add a tool

Create `data/tools/<tool-name>.yml`. Use lowercase letters, numbers and dashes for the file name, for example `data/tools/my-tool.yml`.

```yaml
name: My Tool
url: https://mytool.com
category: ai-app-builders # see data/categories.yml for the ids
description: What it helps you do, in one plain sentence.
free_tier: true # only if you checked the pricing page this month
open_source: false
repo: owner/name # optional, GitHub repo for open-source tools
```

Optional blocks, if you checked the vendor's own pricing page:

```yaml
free_details:
  whats_free: Building and hosting
  limits: 5 projects, 1 GB storage
  source:
    label: Pricing
    url: https://mytool.com/pricing
  last_verified: "2026-11"

pricing:
  free_plan: "Yes"
  entry: Pro $20
  entry_usd: 20 # number used for the price chart
  higher: Team $40 per user
  unit: Credits
  sources:
    - label: Pricing
      url: https://mytool.com/pricing
  last_verified: "2026-11"
```

## What gets included

A tool is a good fit when it:

- is live and usable today (no waitlist-only products);
- helps people build, ship, secure or maintain software with AI;
- links to its official website or repository, not a review site, affiliate link or tracking link;
- is not a duplicate of an existing entry.

We may remove tools that shut down, stay broken, or change into something unrelated.

## Writing descriptions

- Write the description in your own words. Don't copy marketing copy or text from other lists.
- Describe what the tool does, not how great it is. Skip words like "best", "revolutionary" or "game-changing".
- Keep it under about 200 characters.

## Pricing rules

- Use only the vendor's own pricing page, docs or help center as the source. Blog posts and review sites go out of date.
- Use USD per month, before tax. If the only price shown is billed yearly, say so and add `entry_yearly: true`.
- Set `last_verified` to the current month (`YYYY-MM`) for any tool you check, even if the price didn't change.
- If a plan changed name, use the new name.

## Disclosure

If you work for, own, or are paid by a tool you're adding or editing, say so in the pull request. You're welcome to contribute; we just need to know. Undisclosed self-promotion will be closed.

## Run the checks locally (optional)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run validate   # checks every data file against the schema
npm run readme     # rebuilds the README sections and images from the data
npm test           # runs the tests
npx markdownlint-cli2
lychee --config lychee.toml "./**/*.md"   # link check, see https://lychee.cli.rs
```

If you changed a data file, run `npm run readme` and commit the updated `README.md` and `assets/` too. The pull request check fails if they are out of date.

## Code of Conduct

By taking part, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
