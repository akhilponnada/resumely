import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Returns the Clerk user id of the caller, or throws if the request carries no
 * valid identity token.
 *
 * Every query and mutation that touches user data must derive the owner from
 * this rather than accepting a userId argument - an argument is supplied by the
 * browser and can be set to anyone's id.
 */
export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not signed in");
    }
    // `subject` is the Clerk user id (user_xxx), which is what rows are keyed by.
    return identity.subject;
}

/**
 * Loads a document and confirms the caller owns it.
 * Throws rather than returning null so a caller can never silently act on
 * someone else's row.
 */
export async function requireOwned<T extends { userId: string }>(
    ctx: QueryCtx | MutationCtx,
    doc: T | null,
    userId: string
): Promise<T> {
    if (!doc) {
        throw new Error("Not found");
    }
    if (doc.userId !== userId) {
        // Same message as "not found" on purpose: distinguishing the two would
        // confirm to a prober that a given id exists.
        throw new Error("Not found");
    }
    return doc;
}
