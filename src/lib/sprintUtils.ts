/**
 * Utility helper to shorten Sprint topic names for select dropdowns.
 * Example: "Sprint 1: CSDL Schema & Auth Microservices" -> "Sprint 1"
 */
export function getShortSprintName(sprintName: string | undefined | null): string {
  if (!sprintName) return "Sprint 1";
  const match = sprintName.match(/^(Sprint\s*\d+)/i);
  return match ? match[1] : sprintName;
}
