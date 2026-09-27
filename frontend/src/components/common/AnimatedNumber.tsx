import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (val: number) => string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 800,
  format = (v) => v.toString(),
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (endValue - startValue) * easeProgress);
      
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span className={`transition-all ${className}`}>{format(displayValue)}</span>;
}
