export function calculateHints(data: number[], width: number, height: number) {
  const rowHints: number[][] = [];
  const colHints: number[][] = [];

  // Rows
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 1) {
        count++;
      } else if (count > 0) {
        row.push(count);
        count = 0;
      }
    }
    if (count > 0) row.push(count);
    rowHints.push(row);
  }

  // Cols
  for (let x = 0; x < width; x++) {
    const col: number[] = [];
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (data[y * width + x] === 1) {
        count++;
      } else if (count > 0) {
        col.push(count);
        count = 0;
      }
    }
    if (count > 0) col.push(count);
    colHints.push(col);
  }

  return { rowHints, colHints };
}
