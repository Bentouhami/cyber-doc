export const REQUIRED_CHECKS = [
  "Static, security and build gates",
  "Gitleaks secret scan",
  "Dependency review",
  "Production container targets",
  "Database and critical E2E gates",
];

export function contextsFrom(protection) {
  return protection.required_status_checks?.contexts ?? [];
}

export function hasRequiredContexts(protection) {
  const contexts = contextsFrom(protection);
  return (
    contexts.length === REQUIRED_CHECKS.length &&
    REQUIRED_CHECKS.every((check) => contexts.includes(check))
  );
}

export function evaluateProtection(protection) {
  const needsContextChange = !hasRequiredContexts(protection);
  return {
    needsContextChange,
    needsChange: needsContextChange,
  };
}
