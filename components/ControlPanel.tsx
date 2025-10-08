import React, { useState } from 'react';
import { GridState, AnnotationStyle, AnnotationPosition } from '../types';
import XCircleIcon from './icons/XCircleIcon';

interface ControlPanelProps {
  grids: GridState[];
  activeGrid: GridState | null;
  setActiveGridId: (id: string | null) => void;
  onAddGrid: (combType: AnnotationStyle) => void;
  onDeleteGrid: () => void;
  setGridState: (updater: React.SetStateAction<GridState>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onExportCsv: (format: 'sequential' | 'column-wise' | 'row-wise' | 'plate-format') => void;
  removeGap: (orientation: 'horizontal' | 'vertical', id: string) => void;
  resetGrid: () => void;
  onAddRow: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; disabled?: boolean; defaultOpen?: boolean }> = ({ title, children, disabled = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <fieldset className={`border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <legend 
        className="px-2 font-semibold text-lg cursor-pointer flex items-center justify-between w-full" 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {title}
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </legend>
      {isOpen && <div className="mt-4">{children}</div>}
    </fieldset>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({
  grids, activeGrid, setActiveGridId, onAddGrid, onDeleteGrid,
  setGridState, onImageUpload, onExport, onExportCsv, removeGap, resetGrid, onAddRow
}) => {
  const [selectedCombType, setSelectedCombType] = useState<AnnotationStyle>(AnnotationStyle.COMB_34_WELL);
  const [csvFormat, setCsvFormat] = useState<'sequential' | 'column-wise' | 'row-wise' | 'plate-format'>('sequential');

  const handleGridChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!activeGrid) return;
    const { name, value, type } = e.target;
    const isNumber = type === 'number' || type === 'range';
    setGridState(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value } as GridState));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeGrid) return;
    const { name, value } = e.target;
    setGridState(prev => ({ ...prev, [name]: value } as GridState));
  };

  const isGridSelected = activeGrid !== null;

  return (
    <aside className="w-80 lg:w-96 bg-gray-50 dark:bg-gray-800 shadow-lg h-full overflow-y-auto p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Controls</h1>
        
        <div className="mb-4">
             <label className="w-full cursor-pointer bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
              <span>Upload New Image</span>
              <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
            </label>
        </div>

        <Section title="Manage Grids">
            <div className="mb-4">
                <label htmlFor="combType" className="block text-sm font-medium mb-1">Comb Type for New Grid</label>
                <select
                    id="combType"
                    value={selectedCombType}
                    onChange={e => setSelectedCombType(e.target.value as AnnotationStyle)}
                    className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                    <option value={AnnotationStyle.COMB_34_WELL}>34-Well Comb</option>
                    <option value={AnnotationStyle.COMB_17_WELL}>17-Well Comb</option>
                    <option value={AnnotationStyle.A1}>A1 Style</option>
                    <option value={AnnotationStyle.NUMERIC}>Numeric</option>
                    <option value={AnnotationStyle.NONE}>None</option>
                </select>
            </div>
            <div className="mb-4">
                <button onClick={() => onAddGrid(selectedCombType)} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors">Add New Grid</button>
            </div>
            <div className="mb-4">
                <label htmlFor="activeGrid" className="block text-sm font-medium mb-1">Selected Grid</label>
                <select
                    id="activeGrid"
                    value={activeGrid?.id || ''}
                    onChange={e => setActiveGridId(e.target.value)}
                    className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                    {grids.map((grid, index) => (
                        <option key={grid.id} value={grid.id}>Grid {index + 1}</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <button onClick={onDeleteGrid} disabled={grids.length <= 1} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed">Delete Grid</button>
            </div>
        </Section>

        <Section title="Grid Layout" disabled={!isGridSelected} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="rows" className="block text-sm font-medium">Rows</label>
                    <input type="number" name="rows" id="rows" min="1" value={activeGrid?.rows || 1} onChange={handleGridChange} className="mt-1 w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="columns" className="block text-sm font-medium">Columns</label>
                    <input type="number" name="columns" id="columns" min="1" value={activeGrid?.columns || 1} onChange={handleGridChange} className="mt-1 w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                 <button onClick={onAddRow} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded hover:bg-teal-700 transition-colors">
                    Add New Row
                </button>
                 <button onClick={resetGrid} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors">
                    Reset Grid Position/Size
                </button>
            </div>
        </Section>

        <Section title="Grid Appearance" disabled={!isGridSelected} defaultOpen={false}>
            <div className="mb-4">
                <label htmlFor="lineColor" className="block text-sm font-medium">Line Color</label>
                <input type="color" name="lineColor" id="lineColor" value={activeGrid?.lineColor || '#00FFFF'} onChange={handleColorChange} className="mt-1 w-full h-10 p-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" />
            </div>
            <div className="mb-4">
                <label htmlFor="lineThickness" className="block text-sm font-medium">Line Thickness ({activeGrid?.lineThickness || 1}px)</label>
                <input type="range" name="lineThickness" id="lineThickness" min="0.5" max="10" step="0.5" value={activeGrid?.lineThickness || 1} onChange={handleGridChange} className="mt-1 w-full" />
            </div>
            <div className="mb-4">
                <label htmlFor="opacity" className="block text-sm font-medium">Opacity ({Math.round((activeGrid?.opacity || 0) * 100)}%)</label>
                <input type="range" name="opacity" id="opacity" min="0" max="1" step="0.05" value={activeGrid?.opacity || 0.7} onChange={handleGridChange} className="mt-1 w-full" />
            </div>
        </Section>

        <Section title="Gaps" disabled={!isGridSelected} defaultOpen={false}>
            <div className="mb-2">
                <h4 className="font-semibold mb-2">Horizontal Gaps</h4>
                {activeGrid?.horizontalGaps.length === 0 && <p className="text-xs text-gray-500">Click between rows on the image to add gaps.</p>}
                {activeGrid?.horizontalGaps.map(gap => (
                    <div key={gap.id} className="flex items-center gap-2 mb-1">
                        <span className="text-sm">After Row {gap.after + 1}</span>
                        <button onClick={() => removeGap('horizontal', gap.id)} className="text-red-500 hover:text-red-700"><XCircleIcon /></button>
                    </div>
                ))}
            </div>
            <div>
                <h4 className="font-semibold mb-2">Vertical Gaps</h4>
                 {activeGrid?.verticalGaps.length === 0 && <p className="text-xs text-gray-500">Click between columns on the image to add gaps.</p>}
                {activeGrid?.verticalGaps.map(gap => (
                    <div key={gap.id} className="flex items-center gap-2 mb-1">
                        <span className="text-sm">After Col {gap.after + 1}</span>
                        <button onClick={() => removeGap('vertical', gap.id)} className="text-red-500 hover:text-red-700"><XCircleIcon /></button>
                    </div>
                ))}
            </div>
        </Section>

        <Section title="Annotations" disabled={!isGridSelected} defaultOpen={false}>
            <div className="flex items-center justify-between mb-4">
                <label htmlFor="showAnnotations" className="block text-sm font-medium">Show Labels</label>
                <input type="checkbox" name="showAnnotations" id="showAnnotations" checked={activeGrid?.showAnnotations || false} onChange={e => setGridState(p => ({ ...p, showAnnotations: e.target.checked }))} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
            </div>
            {activeGrid?.showAnnotations && <>
                <div className="mb-4">
                    <label htmlFor="annotationStyle" className="block text-sm font-medium">Comb Used</label>
                    <select name="annotationStyle" id="annotationStyle" value={activeGrid?.annotationStyle} onChange={handleGridChange} className="mt-1 w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                        {Object.values(AnnotationStyle).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="annotationPosition" className="block text-sm font-medium">Label Position</label>
                    <select name="annotationPosition" id="annotationPosition" value={activeGrid?.annotationPosition} onChange={handleGridChange} className="mt-1 w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                        {Object.values(AnnotationPosition).map(s => <option key={s} value={s}>{s.replace('_', '-')}</option>)}
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="annotationColor" className="block text-sm font-medium">Label Color</label>
                    <input type="color" name="annotationColor" id="annotationColor" value={activeGrid?.annotationColor} onChange={handleColorChange} className="mt-1 w-full h-10 p-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600" />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                  <p><strong>Pro Tip:</strong> Double-click a cell to edit its label. Check the box in a cell's corner to mark it as Pass/Fail.</p>
                  <p>Label size is adjusted automatically.</p>
                </div>
            </>}
        </Section>
        
        <div className="mt-auto pt-4 space-y-2">
            <button onClick={onExport} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors">
                Export as PNG
            </button>
            <div className="space-y-2">
                <label htmlFor="csvFormat" className="block text-sm font-medium">CSV Export Format</label>
                <select
                    id="csvFormat"
                    value={csvFormat}
                    onChange={e => setCsvFormat(e.target.value as any)}
                    className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                    <option value="sequential">Sequential (As shown)</option>
                    <option value="column-wise">Column-wise (A1, B1, C1...)</option>
                    <option value="row-wise">Row-wise (A1, A2, A3...)</option>
                    <option value="plate-format">Plate Format (12x8 matrix)</option>
                </select>
                <button onClick={() => onExportCsv(csvFormat)} className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded hover:bg-sky-700 transition-colors">
                    Export as CSV
                </button>
            </div>
        </div>
    </aside>
  );
});

export default ControlPanel;