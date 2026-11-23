export interface ProfileRequestIdentity {
  subjectEmail: string;
  generation: number;
}

export function isCurrentProfileRequest(
  request: ProfileRequestIdentity,
  currentSubjectEmail: string | null,
  currentGeneration: number,
  aborted = false,
) {
  return (
    !aborted &&
    request.subjectEmail === currentSubjectEmail &&
    request.generation === currentGeneration
  );
}
