export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

export function getLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function generatePuzzleFromGrid(
  colors: string[],
  width: number,
  height: number
): { data: number[]; isValid: boolean } {
  if (colors.length !== width * height) {
    throw new Error("Grid dimensions do not match color array length");
  }

  const luminances = colors.map((hex) => {
    const rgb = hexToRgb(hex);
    return rgb ? getLuminance(rgb.r, rgb.g, rgb.b) : 255; // Default to white if invalid
  });

  const totalLuminance = luminances.reduce((sum, l) => sum + l, 0);
  const averageLuminance = totalLuminance / luminances.length;

  // Darker than average = Black (1), Lighter or equal = White (0)
  // Lower luminance means darker.
  const data = luminances.map((l) => (l < averageLuminance ? 1 : 0));

  const hasBlack = data.some((cell) => cell === 1);

  return { data, isValid: hasBlack };
}
