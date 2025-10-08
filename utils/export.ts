import { GridState, AnnotationStyle, AnnotationPosition } from '../types';
import { generateAnnotation } from './grid';

export const exportToPng = (imageElement: HTMLImageElement, grids: GridState[]) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert("Canvas context could not be created.");
    return;
  }

  // Use the image's natural dimensions for full quality export
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  // Draw the image first
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  
  // Scale factor to map from display size to natural size
  const scaleX = imageElement.naturalWidth / imageElement.width;
  const scaleY = imageElement.naturalHeight / imageElement.height;

  let totalRowsSoFar = 0;
  // --- Loop through each grid and draw it ---
  for (const gridState of grids) {
    const {
      position, size, rows, columns, lineColor, lineThickness,
      horizontalGaps, verticalGaps, showAnnotations, annotationStyle,
      annotationColor, annotationPosition, customAnnotations, opacity
    } = gridState;
    
    ctx.save();
    ctx.globalAlpha = opacity;

    const scaledGridPos = { x: position.x * scaleX, y: position.y * scaleY };
    const scaledGridSize = { width: size.width * scaleX, height: size.height * scaleY };
    const scaledLineThickness = lineThickness * Math.min(scaleX, scaleY);

    const scaledHGaps = horizontalGaps.map(g => ({ ...g, size: g.size * scaleY }));
    const scaledVGaps = verticalGaps.map(g => ({ ...g, size: g.size * scaleX }));

    const totalHorizontalGap = scaledHGaps.reduce((sum, gap) => sum + gap.size, 0);
    const totalVerticalGap = scaledVGaps.reduce((sum, gap) => sum + gap.size, 0);

    const cellWidth = (scaledGridSize.width - totalVerticalGap) / columns;
    const cellHeight = (scaledGridSize.height - totalHorizontalGap) / rows;
    
    if (cellWidth <= 0 || cellHeight <= 0) {
        console.warn(`Skipping grid ${gridState.id} from export due to invalid dimensions.`);
        continue;
    }

    ctx.translate(scaledGridPos.x, scaledGridPos.y);

    // Set up context for annotations if they are shown
    if (showAnnotations) {
        ctx.fillStyle = annotationColor;
        
        const setTextAlign = (pos: AnnotationPosition) => {
            if (pos.includes('LEFT')) ctx.textAlign = 'left';
            else if (pos.includes('RIGHT')) ctx.textAlign = 'right';
            else ctx.textAlign = 'center';
        };
        
        const setTextBaseline = (pos: AnnotationPosition) => {
            if (pos.includes('TOP')) ctx.textBaseline = 'top';
            else if (pos.includes('BOTTOM')) ctx.textBaseline = 'bottom';
            else ctx.textBaseline = 'middle';
        }
        
        setTextAlign(annotationPosition);
        setTextBaseline(annotationPosition);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const hGapsBefore = scaledHGaps.filter(g => g.after < r).reduce((sum, gap) => sum + gap.size, 0);
        const vGapsBefore = scaledVGaps.filter(g => g.after < c).reduce((sum, gap) => sum + gap.size, 0);

        const x = c * cellWidth + vGapsBefore;
        const y = r * cellHeight + hGapsBefore;

        // Draw lines
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = scaledLineThickness;
        if (c < columns - 1) {
            const lineX = x + cellWidth;
            ctx.beginPath();
            ctx.moveTo(lineX, y);
            ctx.lineTo(lineX, y + cellHeight);
            ctx.stroke();
        }
        if (r < rows - 1) {
            const lineY = y + cellHeight;
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + cellWidth, lineY);
            ctx.stroke();
        }
        
        // Draw annotations
        const canShowLabel = showAnnotations && annotationStyle !== AnnotationStyle.NONE && cellWidth > 30 && cellHeight > 20;
        if (canShowLabel) {
            const scaledDynamicFontSize = Math.max(8, Math.min(cellWidth * 0.35, cellHeight * 0.6, 24));
            ctx.font = `bold ${scaledDynamicFontSize}px sans-serif`;

            const label = generateAnnotation(r, c, annotationStyle, customAnnotations, { precedingRows: totalRowsSoFar, columns });
            const padding = scaledDynamicFontSize * 0.25;
            let textX = x, textY = y;
            
            if (ctx.textAlign === 'center') textX += cellWidth / 2;
            else if (ctx.textAlign === 'right') textX += cellWidth - padding;
            else textX += padding;
            
            if (ctx.textBaseline === 'middle') textY += cellHeight / 2;
            else if (ctx.textBaseline === 'bottom') textY += cellHeight - padding;
            else textY += padding;
            
            ctx.fillText(label, textX, textY);
        }
      }
    }
    ctx.restore();
    totalRowsSoFar += rows;
  }
  
  // Trigger download
  const link = document.createElement('a');
  link.download = `annotated-image-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export type CsvExportFormat = 'sequential' | 'column-wise' | 'row-wise' | 'plate-format';

export const exportToCsv = (grids: GridState[], format: CsvExportFormat = 'sequential') => {
  let csvContent = "";
  let totalRowsSoFar = 0;

  // Collect all well data
  interface WellData {
    annotation: string;
    status: string;
    row: number;
    col: number;
  }
  const allWells: WellData[] = [];

  for (const grid of grids) {
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.columns; c++) {
        const annotation = generateAnnotation(r, c, grid.annotationStyle, grid.customAnnotations, { precedingRows: totalRowsSoFar, columns: grid.columns });

        if (grid.annotationStyle === AnnotationStyle.NONE || annotation === '') continue;

        const key = `${r}-${c}`;
        const isPass = grid.passFailState?.[key] ?? true;
        const status = isPass ? "Pass" : "Fail";

        allWells.push({ annotation, status, row: r, col: c });
      }
    }
    totalRowsSoFar += grid.rows;
  }

  if (format === 'plate-format') {
    // 12 x 8 matrix format (96-well plate style)
    csvContent = ",1,2,3,4,5,6,7,8,9,10,11,12\n";
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // Create a map for quick lookup
    const wellMap = new Map<string, string>();
    allWells.forEach(well => {
      wellMap.set(well.annotation, well.status);
    });

    for (let row = 0; row < 8; row++) {
      const rowLetter = letters[row];
      csvContent += rowLetter;
      for (let col = 1; col <= 12; col++) {
        const wellName = `${rowLetter}${col}`;
        const status = wellMap.get(wellName) || "";
        csvContent += `,${status}`;
      }
      csvContent += "\n";
    }
  } else if (format === 'column-wise') {
    csvContent = "Well,Status\n";
    // Sort by letter first, then by number: A1, B1, C1... then A2, B2, C2...
    const sorted = [...allWells].sort((a, b) => {
      const aMatch = a.annotation.match(/([A-Z]+)(\d+)/);
      const bMatch = b.annotation.match(/([A-Z]+)(\d+)/);

      if (aMatch && bMatch) {
        const [, aLetter, aNum] = aMatch;
        const [, bLetter, bNum] = bMatch;

        if (aNum !== bNum) return parseInt(aNum) - parseInt(bNum);
        return aLetter.localeCompare(bLetter);
      }
      return a.annotation.localeCompare(b.annotation);
    });

    sorted.forEach(well => {
      csvContent += `"${well.annotation}",${well.status}\n`;
    });
  } else if (format === 'row-wise') {
    csvContent = "Well,Status\n";
    // Sort by letter first, then by number: A1, A2, A3... then B1, B2, B3...
    const sorted = [...allWells].sort((a, b) => {
      const aMatch = a.annotation.match(/([A-Z]+)(\d+)/);
      const bMatch = b.annotation.match(/([A-Z]+)(\d+)/);

      if (aMatch && bMatch) {
        const [, aLetter, aNum] = aMatch;
        const [, bLetter, bNum] = bMatch;

        if (aLetter !== bLetter) return aLetter.localeCompare(bLetter);
        return parseInt(aNum) - parseInt(bNum);
      }
      return a.annotation.localeCompare(b.annotation);
    });

    sorted.forEach(well => {
      csvContent += `"${well.annotation}",${well.status}\n`;
    });
  } else {
    // Sequential (original order)
    csvContent = "Well,Status\n";
    allWells.forEach(well => {
      csvContent += `"${well.annotation}",${well.status}\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `band-analysis-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};