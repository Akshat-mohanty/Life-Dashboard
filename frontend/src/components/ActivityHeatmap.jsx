import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';

export default function ActivityHeatmap() {
  // Deterministic pseudo-random generation for a consistent aesthetic
  const grid = useMemo(() => {
    // 52 columns x 14 rows fills the card beautifully down to the bottom
    const cols = 52;
    const rows = 14;
    const newGrid = [];

    for (let c = 0; c < cols; c++) {
      const col = [];
      for (let r = 0; r < rows; r++) {
        const i = c * rows + r;
        
        // Generate a clustering effect using sine waves to simulate "streaks" of activity
        const noise = Math.sin(c * 0.25) * Math.cos(r * 0.6) + Math.sin(i * 0.15) * 0.9;
        
        // Map noise to colors (Obsidian/Indigo aesthetic)
        let colorClass = 'bg-zinc-50'; // Lowest activity (empty)
        if (noise > 1.3) colorClass = 'bg-indigo-500/40'; // Peak activity (rare)
        else if (noise > 0.7) colorClass = 'bg-zinc-300'; // High activity
        else if (noise > 0.1) colorClass = 'bg-zinc-200'; // Medium activity
        else if (noise > -0.3) colorClass = 'bg-zinc-100'; // Low activity
        
        col.push(colorClass);
      }
      newGrid.push(col);
    }
    return newGrid;
  }, []);

  return (
    <div className="flex-1 mt-2 bg-white/50 border border-zinc-200/50 rounded-2xl p-6 sm:p-8 flex flex-col overflow-hidden backdrop-blur-sm shadow-2xs transition-all duration-500 hover:bg-white hover:border-zinc-200/80">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-zinc-400" />
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Heat Map</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="flex gap-1.5 sm:gap-2 opacity-50 hover:opacity-100 transition-opacity duration-700 ease-in-out cursor-default"
          title="Activity Constellation"
        >
          {grid.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1.5 sm:gap-2">
              {col.map((colorClass, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[2px] sm:rounded-[3px] ${colorClass} hover:bg-indigo-400 hover:scale-110 transition-all duration-200`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
