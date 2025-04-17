'use client';

import { useEffect, useState } from 'react';

export default function TooltipWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // 브라우저에서만 true
  }, []);

  if (!isClient) return null;

  return (
    <div
      id="tooltip-toggle"
      role="tooltip"
      className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-2xs opacity-0 tooltip"
    >
      Toggle dark mode
      <div className="tooltip-arrow" data-popper-arrow></div>
    </div>
  );
}
