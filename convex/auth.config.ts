// Tells the Convex backend which identity provider to trust.
// `domain` is the Clerk Frontend API origin; `applicationID` must match the
// `aud` claim in the Clerk JWT template named "convex".
export default {
  providers: [
    {
      domain: "https://clerk.resumely.online",
      applicationID: "convex",
    },
  ],
};
