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
    case AnnotationStyle.COMB_34_WELL:
      // 34-well pattern: L1 A1 A2 B1 B2 C1 C2 D1 D2 E1 E2 F1 F2 G1 G2 H1 H2 A3 A4 B3 B4 C3 C4 D3 D4 E3 E4 F3 F4 G3 G4 H3 H4 L2
      // Each row adds 4 to the base (Row 0: 1-4, Row 1: 5-8, Row 2: 9-12, etc.)
      const baseNumber = (precedingRows * 4) + 1;

      if (col === 0) return `L${(precedingRows * 2) + 1}`;
      if (col === 33) return `L${(precedingRows * 2) + 2}`;

      // Middle columns follow pattern
      if (col >= 1 && col <= 16) {
        // First half: A1 A2 B1 B2 C1 C2 D1 D2 E1 E2 F1 F2 G1 G2 H1 H2
        const letterIndex = Math.floor((col - 1) / 2);
        const letter = String.fromCharCode('A'.charCodeAt(0) + letterIndex);
        const num = baseNumber + ((col - 1) % 2);
        return `${letter}${num}`;
      } else if (col >= 17 && col <= 32) {
        // Second half: A3 A4 B3 B4 C3 C4 D3 D4 E3 E4 F3 F4 G3 G4 H3 H4
        const letterIndex = Math.floor((col - 17) / 2);
        const letter = String.fromCharCode('A'.charCodeAt(0) + letterIndex);
        const num = baseNumber + 2 + ((col - 17) % 2);
        return `${letter}${num}`;
      }
      return `${effectiveRow + 1}-${col + 1}`;

    case AnnotationStyle.COMB_17_WELL:
      // 17-well pattern: L1 A1 B1 C1 D1 E1 F1 G1 H1 A2 B2 C2 D2 E2 F2 G2 H2 L2
      // Each row increments the number by 2 (A1-A2 for row 0, A3-A4 for row 1)
      const baseNum17 = (precedingRows * 2) + 1;

      if (col === 0) return `L${precedingRows + 1}`;
      if (col === 17) return `L${precedingRows + 2}`;

      if (col >= 1 && col <= 8) {
        // First half: A1 B1 C1 D1 E1 F1 G1 H1
        const letter = String.fromCharCode('A'.charCodeAt(0) + (col - 1));
        return `${letter}${baseNum17}`;
      } else if (col >= 9 && col <= 16) {
        // Second half: A2 B2 C2 D2 E2 F2 G2 H2
        const letter = String.fromCharCode('A'.charCodeAt(0) + (col - 9));
        return `${letter}${baseNum17 + 1}`;
      }
      return `${effectiveRow + 1}-${col + 1}`;
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
