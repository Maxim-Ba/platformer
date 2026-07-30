export function normalizeKeyCodes(binding: string | string[]): string[] {
  if (Array.isArray(binding)) {
    return binding.filter((code) => code.length > 0);
  }

  return binding.length > 0 ? [binding] : [];
}
