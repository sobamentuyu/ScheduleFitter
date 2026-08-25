const STORAGE_KEY = 'sf-user-id'

export function getUserId(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null && /^[1-9]\d*$/.test(stored)) {
    return stored
  }

  const generated = String(crypto.getRandomValues(new Uint32Array(1))[0] || 1)
  localStorage.setItem(STORAGE_KEY, generated)
  return generated
}
