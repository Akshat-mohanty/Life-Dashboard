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
      {/* 1. Top Face (Reference #F5F7F8 with soft clean perimeter) */}
      <polygon
        points="50,15 82,33.5 50,52 18,33.5"
        fill="#F5F7F8"
        stroke="#E2E8F0"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 2. Left Face (Reference Steel Slate #B1C1CB) */}
      <polygon
        points="18,33.5 50,52 50,87 18,68.5"
        fill="#B1C1CB"
        stroke="#B1C1CB"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 3. Upper Right Facet (Reference Mid Slate #879EAF) */}
      <polygon
        points="50,52 82,33.5 82,51 66,60"
        fill="#879EAF"
        stroke="#879EAF"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 4. Inner Notch Recessed Wall (Reference Shadow Slate #66859A) */}
      <polygon
        points="50,52 66,60 66,63 50,71"
        fill="#66859A"
        stroke="#66859A"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 5. Lower Right Block (Reference Light Slate Block #DCE2E8) */}
      <polygon
        points="66,60 82,51 82,68.5 50,87 50,71"
        fill="#DCE2E8"
        stroke="#DCE2E8"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
