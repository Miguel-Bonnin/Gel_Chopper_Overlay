export interface Gap {
  id: string;
  after: number; // The index of the row/column AFTER which the gap is placed
  size: number; // in pixels
}

export enum AnnotationStyle {
  GEL = 'Gel',
  A1 = 'A1',
  NUMERIC = 'Numeric',
  NONE = 'None',
}

export enum AnnotationPosition {
  CENTER = 'Center',
  TOP_LEFT = 'Top-Left',
  TOP_CENTER = 'Top-Center',
  TOP_RIGHT = 'Top-Right',
  BOTTOM_LEFT = 'Bottom-Left',
  BOTTOM_CENTER = 'Bottom-Center',
  BOTTOM_RIGHT = 'Bottom-Right',
}

export interface GridState {
  id: string;
  position: { x: number; y: number }; // in pixels
  size: { width: number; height: number }; // in pixels
  rows: number;
  columns: number;
  lineColor: string;
  lineThickness: number;
  opacity: number;
  horizontalGaps: Gap[];
  verticalGaps: Gap[];
  showAnnotations: boolean;
  annotationStyle: AnnotationStyle;
  annotationSize: number;
  annotationColor: string;
  annotationPosition: AnnotationPosition;
  customAnnotations: { [key: string]: string };
  passFailState: { [key: string]: boolean }; // true: Pass, false: Fail
}
