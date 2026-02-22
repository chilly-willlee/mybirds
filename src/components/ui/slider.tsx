"use client";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
}

export function Slider({ value, min = 1, max = 25, onChange, label }: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-slate">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-forest"
      />
      <span className="text-sm font-medium w-12 text-right">{value} mi</span>
    </div>
  );
}
