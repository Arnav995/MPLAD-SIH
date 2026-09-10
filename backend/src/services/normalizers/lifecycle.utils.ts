import { WorkLifecycleStatus } from "@prisma/client";

export function mapLifecycleStatus(
  stage: string | null | undefined,
): WorkLifecycleStatus {
  if (!stage) {
    return WorkLifecycleStatus.UNKNOWN;
  }

  const value = stage.trim().toLowerCase();

  if (value.includes("pending for sanction")) {
    return WorkLifecycleStatus.RECOMMENDED;
  }

  if (value.includes("physical inspection")) {
    return WorkLifecycleStatus.RECOMMENDED;
  }

  if (value.includes("vendor identification")) {
    return WorkLifecycleStatus.SANCTIONED;
  }

  if (value.includes("partially completed")) {
    return WorkLifecycleStatus.IN_PROGRESS;
  }

  if (value.includes("work completed")) {
    return WorkLifecycleStatus.COMPLETED;
  }

  if (value.includes("time estimation")) {
    return WorkLifecycleStatus.RECOMMENDED;
  }

  return WorkLifecycleStatus.UNKNOWN;
}