import * as React from "react";

export function useAnimatedValue(target: number, duration = 800) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(target * easeOutExpo);
      
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    
    setValue(0);
    animationFrame = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [target, duration]);

  return value;
}
