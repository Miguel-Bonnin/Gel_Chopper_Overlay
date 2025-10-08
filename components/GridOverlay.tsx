import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GridState, AnnotationPosition, AnnotationStyle } from '../types';
import { generateAnnotation } from '../utils/grid';

interface GridOverlayProps {
  gridState: GridState;
  setGridState: (updater: React.SetStateAction<GridState>) => void;
  imageRef: React.RefObject<HTMLImageElement>;
  parentTransform: { scale: number; x: number; y: number };
  addGap: (orientation: 'horizontal' | 'vertical', afterIndex: number) => void;
  updateGap: (orientation: 'horizontal' | 'vertical', id: string, newSize: number) => void;
  isActive: boolean;
  onSelect: () => void;
  precedingRows: number;
}

type DragAction = 'move' | 'resize-br' | 'resize-bl' | 'resize-tr' | 'resize-tl' | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r' | `gap-h-${string}` | `gap-v-${string}` | null;

const GridOverlay: React.FC<GridOverlayProps> = ({ gridState, setGridState, imageRef, parentTransform, addGap, updateGap, isActive, onSelect, precedingRows }) => {
  const [dragAction, setDragAction] = useState<DragAction>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartGrid = useRef(gridState);
  
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const {
    id, position, size, rows, columns, lineColor, lineThickness,
    opacity, horizontalGaps, verticalGaps, showAnnotations, annotationStyle,
    annotationColor, annotationPosition, customAnnotations, passFailState
  } = gridState;

  const { totalHorizontalGap, totalVerticalGap, cellWidth, cellHeight, hGapsWithPos, vGapsWithPos } = useMemo(() => {
    const totalHorizontalGap = horizontalGaps.reduce((sum, gap) => sum + gap.size, 0);
    const totalVerticalGap = verticalGaps.reduce((sum, gap) => sum + gap.size, 0);
    const cellWidth = (size.width - totalVerticalGap) / columns;
    const cellHeight = (size.height - totalHorizontalGap) / rows;
    
    const hGapsWithPos = horizontalGaps.map(gap => {
        const precedingGaps = horizontalGaps.filter(g => g.after < gap.after).reduce((sum, g) => sum + g.size, 0);
        return { ...gap, y: (gap.after + 1) * cellHeight + precedingGaps };
    });
    const vGapsWithPos = verticalGaps.map(gap => {
        const precedingGaps = verticalGaps.filter(g => g.after < gap.after).reduce((sum, g) => sum + g.size, 0);
        return { ...gap, x: (gap.after + 1) * cellWidth + precedingGaps };
    });

    return { totalHorizontalGap, totalVerticalGap, cellWidth, cellHeight, hGapsWithPos, vGapsWithPos };
  }, [rows, columns, size, horizontalGaps, verticalGaps]);


  useEffect(() => {
    if (editingCell && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
    }
  }, [editingCell]);
  
  useEffect(() => {
    if (!dragAction) return;

    const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();

        const startGrid = dragStartGrid.current;
        const dx = (e.clientX - dragStartPos.current.x) / parentTransform.scale;
        const dy = (e.clientY - dragStartPos.current.y) / parentTransform.scale;

        if (dragAction.startsWith('gap-h-')) {
            const id = dragAction.replace('gap-h-', '');
            const startGap = startGrid.horizontalGaps.find(g => g.id === id);
            if (startGap) {
                updateGap('horizontal', id, Math.max(0, startGap.size + dy));
            }
            return;
        }
        if (dragAction.startsWith('gap-v-')) {
            const id = dragAction.replace('gap-v-', '');
            const startGap = startGrid.verticalGaps.find(g => g.id === id);
            if (startGap) {
                updateGap('vertical', id, Math.max(0, startGap.size + dx));
            }
            return;
        }

        setGridState(currentGridState => {
            let newPos = { ...startGrid.position };
            let newSize = { ...startGrid.size };

            switch (dragAction) {
                case 'move':
                    newPos = { x: startGrid.position.x + dx, y: startGrid.position.y + dy };
                    break;
                case 'resize-br':
                    newSize = { width: Math.max(20, startGrid.size.width + dx), height: Math.max(20, startGrid.size.height + dy) };
                    break;
                case 'resize-bl':
                    newPos = { x: startGrid.position.x + dx, y: startGrid.position.y };
                    newSize = { width: Math.max(20, startGrid.size.width - dx), height: Math.max(20, startGrid.size.height + dy) };
                    break;
                case 'resize-tr':
                    newPos = { x: startGrid.position.x, y: startGrid.position.y + dy };
                    newSize = { width: Math.max(20, startGrid.size.width + dx), height: Math.max(20, startGrid.size.height - dy) };
                    break;
                case 'resize-tl':
                    newPos = { x: startGrid.position.x + dx, y: startGrid.position.y + dy };
                    newSize = { width: Math.max(20, startGrid.size.width - dx), height: Math.max(20, startGrid.size.height - dy) };
                    break;
                case 'resize-r':
                    newSize = { ...startGrid.size, width: Math.max(20, startGrid.size.width + dx) };
                    break;
                case 'resize-l':
                    newPos = { ...startGrid.position, x: startGrid.position.x + dx };
                    newSize = { ...startGrid.size, width: Math.max(20, startGrid.size.width - dx) };
                    break;
                case 'resize-b':
                    newSize = { ...startGrid.size, height: Math.max(20, startGrid.size.height + dy) };
                    break;
                case 'resize-t':
                    newPos = { ...startGrid.position, y: startGrid.position.y + dy };
                    newSize = { ...startGrid.size, height: Math.max(20, startGrid.size.height - dy) };
                    break;
            }
            return { ...currentGridState, position: newPos, size: newSize };
        });
    };

    const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        setDragAction(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragAction, parentTransform.scale, setGridState, updateGap]);

  const getCellPosition = (row: number, col: number) => {
    const hGapsBefore = horizontalGaps.filter(g => g.after < row).reduce((sum, gap) => sum + gap.size, 0);
    const vGapsBefore = verticalGaps.filter(g => g.after < col).reduce((sum, gap) => sum + gap.size, 0);
    return {
      top: row * cellHeight + hGapsBefore,
      left: col * cellWidth + vGapsBefore,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, action: DragAction) => {
    if (e.button === 1 || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartGrid.current = gridState;
    setDragAction(action);
  }, [gridState, onSelect]);

  const handleEditCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editingCell) return;
    const key = `${editingCell.r}-${editingCell.c}`;

    const defaultValue = generateAnnotation(editingCell.r, editingCell.c, annotationStyle, {}, { precedingRows, columns });

    setGridState(prev => {
        const newCustomAnnotations = { ...prev.customAnnotations };
        if (editText === defaultValue || editText.trim() === '') {
            delete newCustomAnnotations[key];
        } else {
            newCustomAnnotations[key] = editText;
        }
        return { ...prev, customAnnotations: newCustomAnnotations };
    });
    handleEditCancel();
  }, [editingCell, editText, annotationStyle, setGridState, handleEditCancel, precedingRows, columns]);

  const handleEditStart = useCallback((r: number, c: number) => {
    onSelect();
    setEditingCell({r, c});
    setEditText(generateAnnotation(r, c, annotationStyle, customAnnotations, { precedingRows, columns }));
  }, [annotationStyle, customAnnotations, onSelect, precedingRows, columns]);
  
  const handlePassFailToggle = useCallback((r: number, c: number) => {
    const key = `${r}-${c}`;
    setGridState(prev => {
      const currentStatus = prev.passFailState[key] ?? true; // Default to Pass (true)
      const newPassFailState = { ...prev.passFailState, [key]: !currentStatus };
      return { ...prev, passFailState: newPassFailState };
    });
  }, [setGridState]);
  
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleEditSave();
    else if (e.key === 'Escape') handleEditCancel();
  };
  
  const getAnnotationPositionClass = () => {
    switch(annotationPosition) {
        case AnnotationPosition.CENTER: return 'items-center justify-center';
        case AnnotationPosition.TOP_LEFT: return 'items-start justify-start';
        case AnnotationPosition.TOP_CENTER: return 'items-start justify-center';
        case AnnotationPosition.TOP_RIGHT: return 'items-start justify-end';
        case AnnotationPosition.BOTTOM_LEFT: return 'items-end justify-start';
        case AnnotationPosition.BOTTOM_CENTER: return 'items-end justify-center';
        case AnnotationPosition.BOTTOM_RIGHT: return 'items-end justify-end';
        default: return 'items-center justify-center';
    }
  };

  const handleWrapperMouseDown = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          handleMouseDown(e, 'move');
      }
  }
  
  const activeHandleClass = 'bg-blue-500 border-blue-200 ring-1 ring-white';
  const inactiveHandleClass = 'bg-white border-gray-800';
  const handleClasses = isActive ? activeHandleClass : inactiveHandleClass;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        opacity: opacity,
        boxShadow: isActive ? `0 0 0 2px rgba(59, 130, 246, 0.7)` : 'none',
        zIndex: isActive ? 10 : 1
      }}
      onMouseDown={handleWrapperMouseDown}
    >
      <div 
        className="w-full h-full relative"
        style={{ cursor: dragAction ? 'grabbing' : 'grab' }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: columns }).map((_, c) => {
            const { top, left } = getCellPosition(r, c);
            const isEditing = editingCell?.r === r && editingCell?.c === c;
            const canShowLabel = showAnnotations && cellWidth > 25 && cellHeight > 15 && annotationStyle !== AnnotationStyle.NONE;
            const dynamicFontSize = Math.max(8, Math.min(cellWidth * 0.4, cellHeight * 0.5, 20));
            
            const passFailKey = `${r}-${c}`;
            const isPass = passFailState?.[passFailKey] ?? true;

            return (
              <div
                key={`${r}-${c}`}
                className={`absolute flex p-1 box-border select-none ${isEditing ? 'z-20' : ''}`}
                style={{
                  top, left,
                  width: cellWidth, height: cellHeight,
                  color: annotationColor,
                  ... (c < columns - 1 && { borderRight: `${lineThickness}px solid ${lineColor}` }),
                  ... (r < rows - 1 && { borderBottom: `${lineThickness}px solid ${lineColor}` }),
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(r, c) }}
              >
                {!isPass && <div className="absolute inset-0 bg-red-500 bg-opacity-30 pointer-events-none"></div>}

                {!isEditing && canShowLabel && (
                  <div className={`w-full h-full flex ${getAnnotationPositionClass()}`}>
                      <span className="bg-black bg-opacity-40 rounded px-1 py-0.5 leading-none" style={{fontSize: dynamicFontSize}}>
                        {generateAnnotation(r, c, annotationStyle, customAnnotations, { precedingRows, columns })}
                      </span>
                  </div>
                )}
                {isEditing && (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditSave}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    className="w-full h-full bg-gray-900 text-white text-center border-2 border-blue-500 outline-none p-0 m-0 rounded"
                    style={{ fontSize: dynamicFontSize }}
                  />
                )}
                <input
                    type="checkbox"
                    checked={isPass}
                    onChange={() => handlePassFailToggle(r, c)}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    title={`Mark as ${isPass ? 'Fail' : 'Pass'}`}
                    className="absolute top-1 right-1 z-10 w-4 h-4 cursor-pointer"
                />
              </div>
            );
          })
        )}
        
        {hGapsWithPos.map(gap => (
             <div key={`gap-h-${gap.id}`} className="absolute w-full group z-20" style={{ top: gap.y, height: gap.size, background: 'rgba(0,255,255,0.1)'}}>
                <div className="absolute top-0 w-full h-full cursor-ns-resize" onMouseDown={(e) => handleMouseDown(e, `gap-h-${gap.id}`)}>
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        ))}
        {vGapsWithPos.map(gap => (
             <div key={`gap-v-${gap.id}`} className="absolute h-full group z-20" style={{ left: gap.x, width: gap.size, background: 'rgba(0,255,255,0.1)'}}>
                <div className="absolute left-0 h-full w-full cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, `gap-v-${gap.id}`)}>
                    <div className="absolute left-1/2 -translate-x-1/2 h-full w-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        ))}

        {Array.from({length: rows - 1}).map((_, r) => {
            if (horizontalGaps.some(g => g.after === r)) return null;
            const { top } = getCellPosition(r, 0);
            return <div key={`add-h-${r}`} className="absolute w-full h-2 -translate-y-1 hover:bg-cyan-500 hover:bg-opacity-50 cursor-pointer z-10" style={{ top: top + cellHeight }} onClick={(e) => { e.stopPropagation(); onSelect(); addGap('horizontal', r); }} />
        })}
        {Array.from({length: columns - 1}).map((_, c) => {
            if (verticalGaps.some(g => g.after === c)) return null;
            const { left } = getCellPosition(0, c);
            return <div key={`add-v-${c}`} className="absolute h-full w-2 -translate-x-1 hover:bg-cyan-500 hover:bg-opacity-50 cursor-pointer z-10" style={{ left: left + cellWidth }} onClick={(e) => { e.stopPropagation(); onSelect(); addGap('vertical', c); }} />
        })}
        
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-tl')} className={`absolute -top-1 -left-1 w-3 h-3 border rounded-full cursor-nwse-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-tr')} className={`absolute -top-1 -right-1 w-3 h-3 border rounded-full cursor-nesw-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-bl')} className={`absolute -bottom-1 -left-1 w-3 h-3 border rounded-full cursor-nesw-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-br')} className={`absolute -bottom-1 -right-1 w-3 h-3 border rounded-full cursor-nwse-resize z-30 ${handleClasses}`}></div>

        <div onMouseDown={(e) => handleMouseDown(e, 'resize-t')} className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 border rounded-sm cursor-ns-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-b')} className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 border rounded-sm cursor-ns-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-l')} className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 border rounded-sm cursor-ew-resize z-30 ${handleClasses}`}></div>
        <div onMouseDown={(e) => handleMouseDown(e, 'resize-r')} className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 border rounded-sm cursor-ew-resize z-30 ${handleClasses}`}></div>
      </div>
    </div>
  );
};

export default GridOverlay;