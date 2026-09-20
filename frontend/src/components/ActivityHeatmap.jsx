import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';

export default function ActivityHeatmap({ isDemo = true, activityItems = [] }) {
  // Generate the grid based on whether it's a demo or a real logged-in user
  const grid = useMemo(() => {
    const cols = 52;
    const rows = 14;
    const newGrid = [];

    // If it's the demo version, we retain the beautifully generated pseudo-random sine wave pattern
    // so it doesn't look blank and empty for new visitors.
    if (isDemo) {
      for (let c = 0; c < cols; c++) {
        const col = [];
        for (let r = 0; r < rows; r++) {
          const i = c * rows + r;
          const noise = Math.sin(c * 0.25) * Math.cos(r * 0.6) + Math.sin(i * 0.15) * 0.9;
          
          let colorClass = 'bg-zinc-50';
          if (noise > 1.3) colorClass = 'bg-indigo-500/40';
          else if (noise > 0.7) colorClass = 'bg-zinc-300';
          else if (noise > 0.1) colorClass = 'bg-zinc-200';
          else if (noise > -0.3) colorClass = 'bg-zinc-100';
          
          col.push(colorClass);
        }
        newGrid.push(col);
      }
      return newGrid;
    }

    // For a real logged-in user, we build an actual heatmap based on their data.
    // Calculate activity frequencies per day.
    const activityMap = {};
    activityItems.forEach(item => {
      // Safely extract a date string from the item, defaulting to today if none exists.
      const dateString = item.createdAt || item.updatedAt || item.date || item.dueDate || new Date().toISOString();
      try {
        const dayKey = dateString.split('T')[0];
        activityMap[dayKey] = (activityMap[dayKey] || 0) + 1;
      } catch (e) {
        // ignore invalid dates
      }
    });

    // We build 728 blocks (52 cols * 14 rows) representing the last 728 days.
    const totalDays = cols * rows;
    const today = new Date();
    
    // We map blocks to dates, starting from (today - totalDays) to today
    for (let c = 0; c < cols; c++) {
      const col = [];
      for (let r = 0; r < rows; r++) {
        // Calculate how many days ago this block represents
        // The bottom-right block (c = 51, r = 13) is today.
        const daysAgo = (cols - 1 - c) * rows + (rows - 1 - r);
        
        const blockDate = new Date(today);
        blockDate.setDate(today.getDate() - daysAgo);
        const dayKey = blockDate.toISOString().split('T')[0];
        
        const count = activityMap[dayKey] || 0;
        
        let colorClass = 'bg-zinc-50'; // Empty / No activity
        if (count >= 5) colorClass = 'bg-indigo-500/40'; // Very high
        else if (count >= 3) colorClass = 'bg-zinc-300'; // High
        else if (count >= 2) colorClass = 'bg-zinc-200'; // Medium
        else if (count >= 1) colorClass = 'bg-zinc-100'; // Low activity
        
        col.push(colorClass);
      }
      newGrid.push(col);
    }

    return newGrid;
  }, [isDemo, activityItems]);

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
