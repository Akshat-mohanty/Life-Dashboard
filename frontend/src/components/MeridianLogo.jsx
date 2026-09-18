import React from 'react';

/**
 * Meridian 3D Isometric Notched Cube Logo
 * Precision 3D isometric faceted geometry inspired by modern technical cubes.
 */
export default function MeridianLogo({ className = "w-9 h-9" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} flex-shrink-0 transition-transform duration-300 hover:scale-105`}
    >
      {/* 1. Top Face (Pure White Highlight) */}
      <polygon
        points="50,15 82,33.5 50,52 18,33.5"
        fill="#FFFFFF"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 2. Left Face (Clean Neutral Gray) */}
      <polygon
        points="18,33.5 50,52 50,87 18,68.5"
        fill="#D4D4D8"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 3. Upper Right Facet (Mid-tone Shadow Gray) */}
      <polygon
        points="50,52 82,33.5 82,49 64,59.4"
        fill="#71717A"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 4. Inner Notch Recessed Wall (Deep Shadow Charcoal) */}
      <polygon
        points="50,52 64,59.4 64,71 50,63.6"
        fill="#18181B"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 5. Inner Horizontal Shelf (Reflective Shelf Step) */}
      <polygon
        points="50,63.6 64,71 72,66.4 58,59"
        fill="#D4D4D8"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 6. Lower Right Block Front & Side (Light Gray Facet) */}
      <polygon
        points="64,59.4 82,49 82,66.5 50,87 50,63.6 64,71"
        fill="#E4E4E7"
        stroke="#18181B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
