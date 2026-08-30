import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

/**
 * Backup trigger for the job crawl (GitHub Actions cron, manual curl).
 * Convex also runs this on a 6-hour schedule via crons.ts.
 */
export async function POST(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!secret || token !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
        return NextResponse.json({ error: "Convex URL missing" }, { status: 500 });
    }

    const client = new ConvexHttpClient(url);
    const result = await client.mutation(api.jobs.ensureCrawl, {});
    return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
    return POST(req);
}
