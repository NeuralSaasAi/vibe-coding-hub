# Moving the website to a custom domain

The site is built so a custom domain is a configuration change, with no code changes. These steps use `vibecodinghub.neuralsaasai.com` as the example.

## 1. Add a DNS record

At your DNS provider, add:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `vibecodinghub` | `neuralsaasai.github.io` |

DNS changes can take up to a day to spread, but usually take minutes.

## 2. Tell GitHub Pages about the domain

Repository **Settings → Pages → Custom domain**: enter `vibecodinghub.neuralsaasai.com`, save, and wait for the DNS check to pass. Then tick **Enforce HTTPS**.

Or from the terminal:

```bash
gh api -X PUT repos/NeuralSaasAi/vibe-coding-hub/pages -f cname=vibecodinghub.neuralsaasai.com
```

The site deploys with GitHub Actions, so you don't need a `CNAME` file in the repository.

## 3. Set the build variables

Repository **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
| --- | --- |
| `SITE_URL` | `https://vibecodinghub.neuralsaasai.com` |
| `BASE_PATH` | `/` |

Or:

```bash
gh variable set SITE_URL -R NeuralSaasAi/vibe-coding-hub -b https://vibecodinghub.neuralsaasai.com
gh variable set BASE_PATH -R NeuralSaasAi/vibe-coding-hub -b /
```

`BASE_PATH=/` means "serve from the root of the domain". Leaving it empty keeps the `/vibe-coding-hub` path used on github.io.

## 4. Update the README links

Change `SITE_URL` in [`lib/site-url.ts`](../lib/site-url.ts), then run:

```bash
npm run readme
```

Replace the old address in `README.md` text links (search for `neuralsaasai.github.io/vibe-coding-hub`).

## 5. Redeploy and check

Run the **Deploy website** workflow (Actions tab → Deploy website → Run workflow), then check:

- `https://vibecodinghub.neuralsaasai.com/` loads.
- The old `https://neuralsaasai.github.io/vibe-coding-hub/` address redirects to the new one. GitHub does this automatically once a custom domain is set.
- Canonical URLs point at the new domain: view the page source and search for `rel="canonical"`.
- `https://vibecodinghub.neuralsaasai.com/robots.txt` lists the new sitemap.

To test locally first:

```bash
SITE_URL=https://vibecodinghub.neuralsaasai.com BASE_PATH=/ npm run build --prefix site
```

## Linking from neuralsaasai.com

Once the site is on its final address, add it to the main website's footer and to the organization's `sameAs` list in its structured data. That change happens in the neuralsaasai.com repository.
