/**
 * Generate avatar initials from a name, email, or identifier
 * @param source - The source string (name, email, or identifier)
 * @returns Up to 2 uppercase initials or "U" as fallback
 */
export function getAvatarInitials(source: string | undefined | null): string {
  if (!source || !source.trim()) {
    return "U";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";

  const initials = parts
    .map((part) => (part && part[0]) || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}
