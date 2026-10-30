export type ParticipantRoleRule = {
  roleKey: string
  isRequired: boolean
  minParticipants: number
  maxParticipants: number | null
}

export type ParticipantSubmission = {
  roleKey: string
  personaId?: string
  persona?: Record<string, unknown>
}

export type ParticipantPolicyIssue =
  | { code: "PARTICIPANT_ROLE_UNKNOWN"; roleKey: string }
  | { code: "PARTICIPANT_ROLE_CONFIG_INVALID"; roleKey: string }
  | {
      code: "PARTICIPANT_MIN_NOT_MET" | "PARTICIPANT_MAX_EXCEEDED"
      roleKey: string
      expected: number
      actual: number
    }
  | { code: "PARTICIPANT_DUPLICATE"; roleKey: string }

const identityFields = [
  "fullName",
  "fullNameAr",
  "nationalId",
  "phone",
  "email",
  "birthDate",
  "birthPlace",
  "addressLine1",
  "city",
  "gender",
  "occupation",
  "employer",
] as const

function normalizedIdentity(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized.toUpperCase() : null
}

export function hasParticipantIdentity(participant: ParticipantSubmission) {
  if (normalizedIdentity(participant.personaId)) return true
  return identityFields.some((field) => normalizedIdentity(participant.persona?.[field]))
}

function participantIdentityKeys(participant: ParticipantSubmission) {
  const keys: string[] = []
  const personaId = normalizedIdentity(participant.personaId)
  if (personaId) keys.push(`persona:${personaId}`)
  const nationalId = normalizedIdentity(participant.persona?.nationalId)
  if (nationalId) keys.push(`national:${nationalId}`)
  const email = normalizedIdentity(participant.persona?.email)
  if (email) keys.push(`email:${email}`)
  const phone = normalizedIdentity(participant.persona?.phone)
  if (phone) keys.push(`phone:${phone}`)
  const fullName =
    normalizedIdentity(participant.persona?.fullName) ??
    normalizedIdentity(participant.persona?.fullNameAr)
  if (fullName && phone) keys.push(`name-phone:${fullName}|${phone}`)

  const inlineIdentity = identityFields
    .map((field) => `${field}:${normalizedIdentity(participant.persona?.[field]) ?? ""}`)
    .join("|")
  if (hasParticipantIdentity(participant)) keys.push(`inline:${inlineIdentity}`)
  return keys
}

export function validateParticipantSubmission(
  roles: ParticipantRoleRule[],
  participants: ParticipantSubmission[],
): ParticipantPolicyIssue[] {
  const issues: ParticipantPolicyIssue[] = []
  const rolesByKey = new Map(roles.map((role) => [role.roleKey, role]))

  for (const participant of participants) {
    if (!rolesByKey.has(participant.roleKey)) {
      issues.push({ code: "PARTICIPANT_ROLE_UNKNOWN", roleKey: participant.roleKey })
    }
  }

  for (const role of roles) {
    const minimum = role.isRequired ? Math.max(1, role.minParticipants) : 0
    if (
      !Number.isSafeInteger(role.minParticipants) ||
      role.minParticipants < 0 ||
      (role.maxParticipants !== null &&
        (!Number.isSafeInteger(role.maxParticipants) || role.maxParticipants < minimum))
    ) {
      issues.push({ code: "PARTICIPANT_ROLE_CONFIG_INVALID", roleKey: role.roleKey })
      continue
    }

    const submitted = participants.filter(
      (participant) =>
        participant.roleKey === role.roleKey && hasParticipantIdentity(participant),
    )
    if (submitted.length < minimum) {
      issues.push({
        code: "PARTICIPANT_MIN_NOT_MET",
        roleKey: role.roleKey,
        expected: minimum,
        actual: submitted.length,
      })
    }
    if (role.maxParticipants !== null && submitted.length > role.maxParticipants) {
      issues.push({
        code: "PARTICIPANT_MAX_EXCEEDED",
        roleKey: role.roleKey,
        expected: role.maxParticipants,
        actual: submitted.length,
      })
    }

    const identities = new Set<string>()
    for (const participant of submitted) {
      const participantKeys = participantIdentityKeys(participant)
      if (participantKeys.some((identity) => identities.has(identity))) {
        issues.push({ code: "PARTICIPANT_DUPLICATE", roleKey: role.roleKey })
        break
      }
      for (const identity of participantKeys) identities.add(identity)
    }
  }

  return issues
}
