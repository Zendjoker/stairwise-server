// Until real profile names exist (see the "Edit profile" TODO), fall back to
// a privacy-conscious label instead of exposing the full phone number.
export function displayName(user: { name: string | null; phone: string }): string {
  if (user.name) return user.name;
  const last4 = user.phone.slice(-4);
  return `Member •${last4}`;
}
