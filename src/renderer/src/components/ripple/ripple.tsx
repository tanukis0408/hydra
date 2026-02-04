import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";

import "./ripple.scss";

interface RippleProps {
  /**
   * Whether the ripple effect is centered
   */
  centered?: boolean;
  /**
   * Custom class name for the ripple element
   */
  className?: string;
  /**
   * Color of the ripple (defaults to current color)
   */
  color?: string;
  /**
   * Whether the ripple is enabled
   */
  disabled?: boolean;
}

interface RippleState {
  x: number;
  y: number;
  size: number;
  key: number;
}

export function Ripple({
  centered = false,
  className,
  color,
  disabled = false,
}: Readonly<RippleProps>) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [ripples, setRipples] = useState<RippleState[]>([]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (disabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = centered
        ? rect.width / 2 - size / 2
        : event.clientX - rect.left - size / 2;
      const y = centered
        ? rect.height / 2 - size / 2
        : event.clientY - rect.top - size / 2;

      const newRipple: RippleState = {
        x,
        y,
        size,
        key: Date.now(),
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes (600ms)
      setTimeout(() => {
        setRipples((prev) =>
          prev.filter((ripple) => ripple.key !== newRipple.key)
        );
      }, 600);
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener("pointerdown", handleClick);
    }

    return () => {
      if (element) {
        element.removeEventListener("pointerdown", handleClick);
      }
    };
  }, [centered, disabled]);

  return (
    <span
      ref={containerRef}
      className={cn("ripple", className, {
        "ripple--disabled": disabled,
      })}
      style={{ "--ripple-color": color } as React.CSSProperties}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.key}
          className="ripple__inner"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size * 2,
            height: ripple.size * 2,
          }}
        />
      ))}
    </span>
  );
}
