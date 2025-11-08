export function isValidUri(uriString: string): boolean {
  try {
    new URL(uriString);
    return true;
  } catch {
    return false;
  }
}

