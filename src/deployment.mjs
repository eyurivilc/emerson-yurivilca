export function deploymentConfig(env) {
  if (!env.DEPLOY_TARGET || env.DEPLOY_TARGET === "github") {
    return { site: "https://eyurivilc.github.io", base: "/emerson-yurivilca" };
  }
  if (env.DEPLOY_TARGET !== "cloudflare")
    throw new Error("Unknown DEPLOY_TARGET");
  let url;
  try {
    url = new URL(env.SITE_URL);
  } catch {
    throw new Error("SITE_URL must be an HTTPS origin");
  }
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error("SITE_URL must be an HTTPS origin");
  return { site: url.origin, base: "/" };
}
export function analyticsToken(value) {
  if (!value) return undefined;
  if (!/^[a-zA-Z0-9-]+$/.test(value))
    throw new Error("Invalid Cloudflare analytics token");
  return value;
}
