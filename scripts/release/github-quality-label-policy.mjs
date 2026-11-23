export const REQUIRED_LABEL = "quality-contract-change-approved";

export function resolvePullRequestNumber(matches, branch) {
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `No open pull request found for branch '${branch}'`
        : `Multiple open pull requests found for branch '${branch}'`,
    );
  }
  return matches[0].number;
}

export function evaluateQualityLabel(labelExists, pullRequest) {
  const findings = [];
  if (!labelExists) findings.push(`repository label '${REQUIRED_LABEL}' does not exist`);
  if (pullRequest.state !== "OPEN") {
    findings.push(`PR #${pullRequest.number} is ${pullRequest.state}, not OPEN`);
  }
  if (!(pullRequest.labels ?? []).some((label) => label.name === REQUIRED_LABEL)) {
    findings.push(`PR #${pullRequest.number} lacks '${REQUIRED_LABEL}'`);
  }
  return findings;
}
