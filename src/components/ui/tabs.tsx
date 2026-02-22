"use client";

import { useState, type ReactNode } from "react";

interface TabsProps {
  tabs: { label: string; content: ReactNode }[];
  defaultIndex?: number;
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-4 py-3 text-sm font-medium transition-colors cursor-pointer
              ${active === i
                ? "text-forest border-b-2 border-forest"
                : "text-slate hover:text-charcoal"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">{tabs[active].content}</div>
    </div>
  );
}
