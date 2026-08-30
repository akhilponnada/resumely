import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("sync job boards", { hours: 6 }, internal.jobSync.syncAll, {});

export default crons;
