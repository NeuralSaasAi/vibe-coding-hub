/** Public website address. Change this (and SITE_URL in the Pages workflow variables) when moving to a custom domain. */
export const SITE_URL = "https://neuralsaasai.github.io/vibe-coding-hub";

/** README links to the site carry a UTM-free path, so GitHub traffic shows up as referral traffic. */
export const siteLink = (path = "") => `${SITE_URL}/${path.replace(/^\//, "")}`;
