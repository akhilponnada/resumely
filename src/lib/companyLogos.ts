const ATS_HOSTS = [
    "greenhouse.io",
    "boards.greenhouse.io",
    "job-boards.greenhouse.io",
    "lever.co",
    "jobs.lever.co",
    "ashbyhq.com",
    "jobs.ashbyhq.com",
    "myworkdayjobs.com",
    "remoteok.com",
    "remoteok.io",
    "arbeitnow.com",
    "jobicy.com",
];

type Brand = { icon: string; domain: string };

const BRANDS: Record<string, Brand> = {
    stripe: { icon: "stripe", domain: "stripe.com" },
    airbnb: { icon: "airbnb", domain: "airbnb.com" },
    coinbase: { icon: "coinbase", domain: "coinbase.com" },
    discord: { icon: "discord", domain: "discord.com" },
    figma: { icon: "figma", domain: "figma.com" },
    databricks: { icon: "databricks", domain: "databricks.com" },
    cloudflare: { icon: "cloudflare", domain: "cloudflare.com" },
    gitlab: { icon: "gitlab", domain: "gitlab.com" },
    reddit: { icon: "reddit", domain: "reddit.com" },
    dropbox: { icon: "dropbox", domain: "dropbox.com" },
    instacart: { icon: "instacart", domain: "instacart.com" },
    doordash: { icon: "doordash", domain: "doordash.com" },
    robinhood: { icon: "robinhood", domain: "robinhood.com" },
    pinterest: { icon: "pinterest", domain: "pinterest.com" },
    snowflake: { icon: "snowflake", domain: "snowflake.com" },
    datadog: { icon: "datadog", domain: "datadoghq.com" },
    mongodb: { icon: "mongodb", domain: "mongodb.com" },
    hashicorp: { icon: "hashicorp", domain: "hashicorp.com" },
    elastic: { icon: "elastic", domain: "elastic.co" },
    atlassian: { icon: "atlassian", domain: "atlassian.com" },
    shopify: { icon: "shopify", domain: "shopify.com" },
    twilio: { icon: "twilio", domain: "twilio.com" },
    plaid: { icon: "plaid", domain: "plaid.com" },
    airtable: { icon: "airtable", domain: "airtable.com" },
    asana: { icon: "asana", domain: "asana.com" },
    box: { icon: "box", domain: "box.com" },
    coursera: { icon: "coursera", domain: "coursera.org" },
    duolingo: { icon: "duolingo", domain: "duolingo.com" },
    etsy: { icon: "etsy", domain: "etsy.com" },
    github: { icon: "github", domain: "github.com" },
    grammarly: { icon: "grammarly", domain: "grammarly.com" },
    hubspot: { icon: "hubspot", domain: "hubspot.com" },
    intercom: { icon: "intercom", domain: "intercom.com" },
    lyft: { icon: "lyft", domain: "lyft.com" },
    mozilla: { icon: "mozilla", domain: "mozilla.org" },
    okta: { icon: "okta", domain: "okta.com" },
    spotify: { icon: "spotify", domain: "spotify.com" },
    zendesk: { icon: "zendesk", domain: "zendesk.com" },
    zoom: { icon: "zoom", domain: "zoom.us" },
    anthropic: { icon: "anthropic", domain: "anthropic.com" },
    "hugging face": { icon: "huggingface", domain: "huggingface.co" },
    huggingface: { icon: "huggingface", domain: "huggingface.co" },
    vercel: { icon: "vercel", domain: "vercel.com" },
    supabase: { icon: "supabase", domain: "supabase.com" },
    linear: { icon: "linear", domain: "linear.app" },
    notion: { icon: "notion", domain: "notion.so" },
    canva: { icon: "canva", domain: "canva.com" },
    revolut: { icon: "revolut", domain: "revolut.com" },
    openai: { icon: "openai", domain: "openai.com" },
    palantir: { icon: "palantir", domain: "palantir.com" },
    nvidia: { icon: "nvidia", domain: "nvidia.com" },
    apple: { icon: "apple", domain: "apple.com" },
    google: { icon: "google", domain: "google.com" },
    meta: { icon: "meta", domain: "meta.com" },
    amazon: { icon: "amazon", domain: "amazon.com" },
    netflix: { icon: "netflix", domain: "netflix.com" },
    uber: { icon: "uber", domain: "uber.com" },
    tesla: { icon: "tesla", domain: "tesla.com" },
    microsoft: { icon: "microsoft", domain: "microsoft.com" },
    salesforce: { icon: "salesforce", domain: "salesforce.com" },
    adobe: { icon: "adobe", domain: "adobe.com" },
    slack: { icon: "slack", domain: "slack.com" },
    sentry: { icon: "sentry", domain: "sentry.io" },
    posthog: { icon: "posthog", domain: "posthog.com" },
    gusto: { icon: "gusto", domain: "gusto.com" },
    brex: { icon: "brex", domain: "brex.com" },
    ramp: { icon: "ramp", domain: "ramp.com" },
    wise: { icon: "wise", domain: "wise.com" },
    anduril: { icon: "anduril", domain: "anduril.com" },
    "scale ai": { icon: "scale", domain: "scale.com" },
};

function hostOf(url: string): string | null {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

function isAtsHost(host: string): boolean {
    return ATS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function companyInitials(name: string): string {
    const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function companyLogoCandidates(
    company: string,
    applyUrl?: string,
    provided?: string
): string[] {
    const urls: string[] = [];
    if (provided) urls.push(provided);

    const brand = BRANDS[company.trim().toLowerCase()];
    if (brand) {
        urls.push(`https://cdn.simpleicons.org/${brand.icon}`);
        urls.push(`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`);
    }

    const host = applyUrl ? hostOf(applyUrl) : null;
    if (host && !isAtsHost(host)) {
        urls.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);
    }

    return [...new Set(urls)];
}

export function sourceLabel(source: string): string {
    const labels: Record<string, string> = {
        greenhouse: "Greenhouse",
        lever: "Lever",
        ashby: "Ashby",
        remoteok: "RemoteOK",
        arbeitnow: "Arbeitnow",
        jobicy: "Jobicy",
    };
    return labels[source] ?? source;
}

export function workplaceLabel(workplace: string): string {
    if (workplace === "unknown") return "Flexible";
    if (workplace === "onsite") return "On-site";
    return workplace.charAt(0).toUpperCase() + workplace.slice(1);
}
