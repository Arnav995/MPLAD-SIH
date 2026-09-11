export function getRiskAssessment(project) {
  return project?.riskAssessment ?? null;
}

export function getRiskIndex(project) {
  return Number(project?.riskAssessment?.riskIndex ?? 0);
}

export function getRiskTier(project) {
  return project?.riskAssessment?.tier ?? "CLEAN";
}

export function getRiskReasons(project) {
  return project?.riskAssessment?.explanation?.reasons ?? [];
}

export function getRiskSignals(project) {
  return project?.riskSignals ?? [];
}

export function hasSignal(project, type) {
  return getRiskSignals(project).some(
    (signal) => signal.type === type
  );
}

export function getPrimaryReason(project) {
  return (
    getRiskReasons(project)[0] ??
    getRiskSignals(project)[0]?.reason ??
    "No current risk signal"
  );
}

export function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getLocation(project) {
  return [
    project?.constituency?.name ??
      project?.constituencyNameFromSource,
    project?.state?.name ??
      project?.stateNameFromSource,
  ]
    .filter(Boolean)
    .join(", ") || "—";
}

export function getRiskLabel(tier) {
  switch (tier) {
    case "TIER_2":
      return "High";
    case "TIER_1":
      return "Medium";
    default:
      return "Low";
  }
}