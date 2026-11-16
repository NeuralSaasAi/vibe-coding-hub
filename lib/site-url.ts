/** Public website address, used for README links. The deployed site reads SITE_URL from the Pages workflow variables. */
export const SITE_URL = "https://vibe-coding.neuralsaasai.com";

/** README links to the site carry a UTM-free path, so GitHub traffic shows up as referral traffic. */
export const siteLink = (path = "") => `${SITE_URL}/${path.replace(/^\//, "")}`;
