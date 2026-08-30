/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authz from "../authz.js";
import type * as chats from "../chats.js";
import type * as crons from "../crons.js";
import type * as jobSources from "../jobSources.js";
import type * as jobSync from "../jobSync.js";
import type * as jobs from "../jobs.js";
import type * as messages from "../messages.js";
import type * as resumes from "../resumes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  authz: typeof authz;
  chats: typeof chats;
  crons: typeof crons;
  jobSources: typeof jobSources;
  jobSync: typeof jobSync;
  jobs: typeof jobs;
  messages: typeof messages;
  resumes: typeof resumes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
