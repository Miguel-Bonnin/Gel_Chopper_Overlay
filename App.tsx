import React, { useState, useCallback, useRef, useMemo } from 'react';
import { GridState, AnnotationStyle, AnnotationPosition, Gap } from './types';
import ControlPanel from './components/ControlPanel';
import ImageWorkspace from './components/ImageWorkspace';
import { exportToPng, exportToCsv } from './utils/export';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const createNewGrid = (id: string, combType: AnnotationStyle = AnnotationStyle.COMB_34_WELL): GridState => {
  const columns = combType === AnnotationStyle.COMB_34_WELL ? 34 : combType === AnnotationStyle.COMB_17_WELL ? 18 : 18;

  return {
    id,
    position: { x: 50, y: 50 },
    size: { width: 800, height: 150 },
    rows: 1,
    columns,
    lineColor: '#00FFFF',
    lineThickness: 1,
    opacity: 0.7,
    horizontalGaps: [],
    verticalGaps: [],
    showAnnotations: true,
    annotationStyle: combType,
    annotationSize: 12,
    annotationColor: '#FFFFFF',
    annotationPosition: AnnotationPosition.TOP_CENTER,
    customAnnotations: {},
    passFailState: {},
  };
};

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [grids, setGrids] = useState<GridState[]>(() => [createNewGrid(generateId())]);
  const [activeGridId, setActiveGridId] = useState<string | null>(grids[0]?.id || null);

  const activeGrid = useMemo(() => grids.find(g => g.id === activeGridId) || null, [grids, activeGridId]);

  const updateGrid = useCallback((id: string, updater: (grid: GridState) => GridState) => {
    setGrids(prevGrids => prevGrids.map(g => g.id === id ? updater(g) : g));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleExport = useCallback(() => {
    if (imageRef.current) {
      exportToPng(imageRef.current, grids);
    } else {
      alert("Please upload an image first.");
    }
  }, [grids]);
  
  const handleExportCsv = useCallback(() => {
    exportToCsv(grids);
  }, [grids]);

  const handleAddGrid = (combType: AnnotationStyle) => {
    const newId = generateId();
    const lastGrid = grids[grids.length - 1];
    const newGrid = createNewGrid(newId, combType);
    if(lastGrid) {
        newGrid.position = { x: lastGrid.position.x + 20, y: lastGrid.position.y + 20 };
    }
    setGrids(prev => [...prev, newGrid]);
    setActiveGridId(newId);
  };

  const handleDeleteGrid = () => {
      if (!activeGridId || grids.length <= 1) {
          alert("Cannot delete the last grid.");
          return;
      }
      const remainingGrids = grids.filter(g => g.id !== activeGridId);
      setGrids(remainingGrids);
      setActiveGridId(remainingGrids[remainingGrids.length-1]?.id || null);
  };

  const setActiveGridState = (updater: React.SetStateAction<GridState>) => {
    if (activeGridId) {
      updateGrid(activeGridId, (prevGrid) => {
        return typeof updater === 'function' ? updater(prevGrid) : updater;
      });
    }
  };

  const addGap = (gridId: string, orientation: 'horizontal' | 'vertical', afterIndex: number) => {
    updateGrid(gridId, grid => {
      const newGap: Gap = { id: Date.now().toString(), after: afterIndex, size: 20 };
      const gaps = orientation === 'horizontal' ? 'horizontalGaps' : 'verticalGaps';
      const updatedGaps = [...grid[gaps], newGap].sort((a,b) => a.after - b.after);
      return { ...grid, [gaps]: updatedGaps };
    });
  };

  const updateGap = (gridId: string, orientation: 'horizontal' | 'vertical', id: string, newSize: number) => {
    updateGrid(gridId, grid => {
      const gapsKey = orientation === 'horizontal' ? 'horizontalGaps' : 'verticalGaps';
      const updatedGaps = grid[gapsKey].map(gap => 
        gap.id === id ? { ...gap, size: newSize } : gap
      );
      return { ...grid, [gapsKey]: updatedGaps };
    });
  };

  const removeGap = (orientation: 'horizontal' | 'vertical', id: string) => {
     if (!activeGridId) return;
     updateGrid(activeGridId, grid => {
      const gapsKey = orientation === 'horizontal' ? 'horizontalGaps' : 'verticalGaps';
      const updatedGaps = grid[gapsKey].filter(gap => gap.id !== id);
      return { ...grid, [gapsKey]: updatedGaps };
    });
  };
  
  const resetGrid = () => {
     if (!activeGridId) return;
     updateGrid(activeGridId, grid => ({
        ...grid,
        position: { x: 50, y: 50 },
        size: { width: 800, height: 150 },
        rows: 1,
        columns: 18,
        horizontalGaps: [],
        verticalGaps: [],
        customAnnotations: {},
        passFailState: {},
     }));
  }

  const handleAddRow = () => {
    if (!activeGridId) return;
    updateGrid(activeGridId, grid => ({
      ...grid,
      rows: grid.rows + 1,
    }));
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200">
      <ControlPanel
        grids={grids}
        activeGrid={activeGrid}
        setActiveGridId={setActiveGridId}
        onAddGrid={handleAddGrid}
        onDeleteGrid={handleDeleteGrid}
        setGridState={setActiveGridState}
        onImageUpload={handleImageUpload}
        onExport={handleExport}
        onExportCsv={handleExportCsv}
        removeGap={removeGap}
        resetGrid={resetGrid}
        onAddRow={handleAddRow}
      />
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {image ? (
          <ImageWorkspace 
            imageSrc={image} 
            imageRef={imageRef} 
            grids={grids}
            activeGridId={activeGridId}
            setActiveGridId={setActiveGridId}
            updateGrid={updateGrid}
            addGap={addGap}
            updateGap={updateGap}
          />
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-gray-400 rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Image Grid Overlay Tool</h2>
            <p className="mb-4">Upload an image to begin analysis.</p>
            <label className="cursor-pointer bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">
              <span>Upload Image</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;