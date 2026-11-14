#!/usr/bin/env bash
# Lighthouse scores for the built site. Start `npx astro preview --port 4330` in site/ first.
set -euo pipefail
BASE="${SITE_PREVIEW:-http://localhost:4330/vibe-coding-hub}"
export CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")"
for p in "" tools pricing roadmap which-tool when-it-breaks; do
  name="${p:-home}"
  npx -y lighthouse "$BASE/$p" --quiet --chrome-flags="--headless=new" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="/tmp/lh-$name.json" > /dev/null 2>&1
  node -e "const r=require('/tmp/lh-$name.json');console.log('$name'.padEnd(15),Object.values(r.categories).map(c=>c.id+'='+Math.round(c.score*100)).join('  '))"
done
