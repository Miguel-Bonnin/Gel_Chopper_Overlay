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
      const seq34 = [
        'L1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2',
        'E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2',
        'A3', 'A4', 'B3', 'B4', 'C3', 'C4', 'D3', 'D4',
        'E3', 'E4', 'F3', 'F4', 'G3', 'G4', 'H3', 'H4', 'L2'
      ];
      if (col >= 0 && col < seq34.length) {
        return seq34[col];
      }
      return `${effectiveRow + 1}-${col + 1}`;
    case AnnotationStyle.COMB_17_WELL:
      // 17-well pattern: L1 A1 B1 C1 D1 E1 F1 G1 H1 A2 B2 C2 D2 E2 F2 G2 H2 L2
      const seq17 = [
        'L1', 'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1',
        'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'L2'
      ];
      if (col >= 0 && col < seq17.length) {
        return seq17[col];
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
