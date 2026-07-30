const KEY_CODE_LABELS: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Space: 'Space',
  Escape: 'Esc',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  AltLeft: 'Alt',
  AltRight: 'Alt',
};

export function formatKeyCode(code: string): string {
  if (KEY_CODE_LABELS[code]) {
    return KEY_CODE_LABELS[code];
  }

  if (code.startsWith('Key')) {
    return code.slice(3);
  }

  if (code.startsWith('Digit')) {
    return code.slice(5);
  }

  return code;
}

export function formatKeyBinding(binding: string | string[]): string {
  const codes = Array.isArray(binding) ? binding : [binding];
  return codes.map((code) => formatKeyCode(code)).join('/');
}
