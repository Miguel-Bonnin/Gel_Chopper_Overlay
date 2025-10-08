import { AnnotationStyle } from '../types';

export function generateAnnotation(
  row: number,
  col: number,
  style: AnnotationStyle,
  customAnnotations: { [key: string]: string } = {},
  options: { precedingRows?: number, columns?: number } = {}
): string {
  const customKey = `${row}-${col}`;
  if (customAnnotations.hasOwnProperty(customKey)) {
    return customAnnotations[customKey];
  }

  const { precedingRows = 0, columns = 18 } = options;
  const effectiveRow = row + precedingRows;

  switch (style) {
    case AnnotationStyle.GEL:
      if (effectiveRow === 0) {
        const firstRowSeq = [
          'L1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2',
          'E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'L2'
        ];
        if (col >= 0 && col < firstRowSeq.length) {
          return firstRowSeq[col];
        }
        // Fallback for user extending columns on first row past the pattern
        return `${effectiveRow + 1}-${col + 1}`;
      } else {
        // Logic for subsequent rows with L lanes
        if (columns > 1) {
            if (col === 0) {
                return `L${2 * effectiveRow + 1}`; // e.g., effRow 1 -> L3
            }
            if (col === columns - 1) {
                return `L${2 * effectiveRow + 2}`; // e.g., effRow 1 -> L4
            }
        }
        
        // For columns in between the L-lanes
        const effectiveCol = col - 1; // Adjust col index because of the first L-lane
        if (effectiveCol < 0) return ''; // Should not happen if columns > 1

        const letter = String.fromCharCode('A'.charCodeAt(0) + Math.floor(effectiveCol / 2));
        const number = (effectiveCol % 2) + (2 * effectiveRow) + 1;
        return `${letter}${number}`;
      }
    case AnnotationStyle.A1:
      const letter = String.fromCharCode('A'.charCodeAt(0) + effectiveRow);
      return `${letter}${col + 1}`;
    case AnnotationStyle.NUMERIC:
      return `${effectiveRow + 1}-${col + 1}`;
    case AnnotationStyle.NONE:
      return '';
    default:
      return '';
  }
}
