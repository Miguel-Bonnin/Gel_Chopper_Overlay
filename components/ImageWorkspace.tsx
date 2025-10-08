import React, { useState, useRef, useCallback, useMemo } from 'react';
import { GridState } from '../types';
import GridOverlay from './GridOverlay';

interface ImageWorkspaceProps {
  imageSrc: string;
  imageRef: React.RefObject<HTMLImageElement>;
  grids: GridState[];
  activeGridId: string | null;
  setActiveGridId: (id: string | null) => void;
  updateGrid: (id: string, updater: (grid: GridState) => GridState) => void;
  addGap: (gridId: string, orientation: 'horizontal' | 'vertical', afterIndex: number) => void;
  updateGap: (gridId: string, orientation: 'horizontal' | 'vertical', id: string, newSize: number) => void;
}

const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  imageSrc,
  imageRef,
  grids,
  activeGridId,
  setActiveGridId,
  updateGrid,
  addGap,
  updateGap,
}) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const precedingRowCounts = useMemo(() => {
    const counts: { [gridId: string]: number } = {};
    let totalRows = 0;
    for (const grid of grids) {
      counts[grid.id] = totalRows;
      totalRows += grid.rows;
    }
    return counts;
  }, [grids]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(10, transform.scale + scaleAmount));
    
    const rect = workspaceRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = transform.x - (mouseX - transform.x) * (newScale / transform.scale - 1);
    const newY = transform.y - (mouseY - transform.y) * (newScale / transform.scale - 1);

    setTransform({ scale: newScale, x: newX, y: newY });
  };
  
  const panMove = useCallback((event: MouseEvent) => {
    if (!isPanning.current) return;
    event.preventDefault();
    const dx = event.clientX - lastMousePosition.current.x;
    const dy = event.clientY - lastMousePosition.current.y;
    lastMousePosition.current = { x: event.clientX, y: event.clientY };
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const panEnd = useCallback(() => {
    isPanning.current = false;
    if (workspaceRef.current) {
        workspaceRef.current.style.cursor = 'grab';
    }
    window.removeEventListener('mousemove', panMove);
    window.removeEventListener('mouseup', panEnd);
  }, [panMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Pan with middle mouse button OR left button + alt key
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      isPanning.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      if (workspaceRef.current) {
        workspaceRef.current.style.cursor = 'grabbing';
      }
      window.addEventListener('mousemove', panMove);
      window.addEventListener('mouseup', panEnd);
    }
  }, [panMove, panEnd]);

  return (
    <div
      ref={workspaceRef}
      className="w-full h-full bg-gray-200 dark:bg-gray-900 overflow-hidden relative touch-none select-none cursor-grab"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Analysis subject"
          className="max-w-none max-h-none"
          draggable="false"
          style={{ imageRendering: 'pixelated' }}
        />
        {grids.map(grid => (
          <GridOverlay
            key={grid.id}
            gridState={grid}
            setGridState={(updater) => updateGrid(grid.id, typeof updater === 'function' ? updater : () => updater)}
            imageRef={imageRef}
            parentTransform={transform}
            addGap={(orientation, afterIndex) => addGap(grid.id, orientation, afterIndex)}
            updateGap={(orientation, id, size) => updateGap(grid.id, orientation, id, size)}
            isActive={grid.id === activeGridId}
            onSelect={() => setActiveGridId(grid.id)}
            precedingRows={precedingRowCounts[grid.id] || 0}
          />
        ))}
      </div>
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white text-xs rounded p-2 pointer-events-none shadow-lg">
        <p><strong className="font-semibold">Scroll:</strong> Zoom</p>
        <p><strong className="font-semibold">Middle-Click/Alt+Drag:</strong> Pan</p>
      </div>
    </div>
  );
};

export default ImageWorkspace;