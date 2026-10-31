// OWNER: Builder B. Build order of a monster in the lab. Stage n means the first n parts are done.
export const BUILD_STAGES = ["frame", "ectoplasm", "eyes", "accessories", "aura"] as const;
export type BuildStage = (typeof BUILD_STAGES)[number];
