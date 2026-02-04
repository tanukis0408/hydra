import cn from "classnames";
import { PlacesType, Tooltip } from "react-tooltip";
import { useId } from "react";
import { Ripple } from "../ripple";

import "./button.scss";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  /**
   * Button variant following Material Expressive 3
   * @default "primary"
   */
  variant?: "primary" | "tonal" | "outline" | "text" | "dark" | "danger";
  /**
   * Legacy prop for variant (use 'variant' instead)
   * @deprecated Use 'variant' instead
   */
  theme?: "primary" | "outline" | "dark" | "danger";
  /**
   * Whether the button should take up the full width
   */
  fullWidth?: boolean;
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode;
  /**
   * Size of the button
   * @default "medium"
   */
  size?: "small" | "medium" | "large";
  /**
   * Tooltip text
   */
  tooltip?: string;
  /**
   * Tooltip placement
   * @default "top"
   */
  tooltipPlace?: PlacesType;
  /**
   * Show loading spinner and make button busy
   */
  loading?: boolean;
}

export function Button({
  children,
  variant,
  theme,
  fullWidth = false,
  icon,
  size = "medium",
  className,
  tooltip,
  tooltipPlace = "top",
  disabled,
  loading = false,
  ...props
}: Readonly<ButtonProps>) {
  // Use theme prop for backward compatibility, fallback to variant
  const resolvedVariant = theme ?? variant ?? "primary";

  const id = useId();

  const tooltipProps = tooltip
    ? {
        "data-tooltip-id": id,
        "data-tooltip-place": tooltipPlace,
        "data-tooltip-content": tooltip,
      }
    : {};

  return (
    <>
      <button
        type="button"
        className={cn(
          "button",
          `button--${resolvedVariant}`,
          `button--${size}`,
          fullWidth && "button--full-width",
          disabled && "button--disabled",
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...tooltipProps}
        {...props}
      >
        <Ripple disabled={disabled} />
        {icon && !loading && <span className="button__icon">{icon}</span>}
        {loading && (
          <svg className="button__spinner" viewBox="0 0 24 24">
            <circle
              className="button__spinner-path"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        )}
        {children}
      </button>

      {tooltip && <Tooltip id={id} />}
    </>
  );
}
