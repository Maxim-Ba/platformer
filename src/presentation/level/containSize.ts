export interface ContainedSize {
  width: number;
  height: number;
}

/** Scale source to fit inside a box without stretching (contain). */
export function containSize(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): ContainedSize {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: boxWidth, height: boxHeight };
  }

  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}
