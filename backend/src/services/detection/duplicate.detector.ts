export interface DuplicateSignal {
  workId: number;
  matchedWorkId: number;
  score: number;
  reason: string;
}

function normalizeText(value: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectDuplicatePairs(
  works: Array<{
    id: number;
    recommendationDtlId: bigint;
    activityName: string | null;
    description: string | null;
    constituencyNameFromSource: string | null;
  }>,
): DuplicateSignal[] {
  const signals: DuplicateSignal[] = [];

  for (let i = 0; i < works.length; i++) {
    for (let j = i + 1; j < works.length; j++) {
      const a = works[i];
      const b = works[j];

      if (
        !a.activityName ||
        !b.activityName ||
        !a.description ||
        !b.description ||
        !a.constituencyNameFromSource ||
        !b.constituencyNameFromSource
      ) {
        continue;
      }

      const constituencyA = normalizeText(
        a.constituencyNameFromSource,
      );

      const constituencyB = normalizeText(
        b.constituencyNameFromSource,
      );

      if (constituencyA !== constituencyB) {
        continue;
      }

      const activityA = normalizeText(a.activityName);
      const activityB = normalizeText(b.activityName);

      const descriptionA = normalizeText(a.description);
      const descriptionB = normalizeText(b.description);

      if (
        activityA !== activityB ||
        descriptionA !== descriptionB
      ) {
        continue;
      }

      signals.push({
        workId: a.id,
        matchedWorkId: b.id,
        score: 90,
        reason:
          "Works in the same constituency have identical activity and description details.",
      });
    }
  }

  return signals;
}