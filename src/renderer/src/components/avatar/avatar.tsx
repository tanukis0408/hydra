import { PersonIcon } from "@primer/octicons-react";
import cn from "classnames";
import { useMemo, useState, type CSSProperties } from "react";

import "./avatar.scss";

export interface AvatarProps
  extends Omit<
    React.DetailedHTMLProps<
      React.ImgHTMLAttributes<HTMLImageElement>,
      HTMLImageElement
    >,
    "src"
  > {
  size: number;
  src?: string | null;
  shape?: "rounded" | "circle";
  ring?: boolean;
  accent?: string;
}

const getAccentFromString = (value?: string | null) => {
  if (!value) return "var(--kraken-primary, var(--md-sys-color-primary))";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue} 78% 58%)`;
};

export function Avatar({
  size,
  alt,
  src,
  className,
  shape = "rounded",
  ring = false,
  accent,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const fallbackText = useMemo(() => {
    const trimmed = alt?.trim();
    if (!trimmed) return "";
    const [first, second] = trimmed.split(/\s+/);
    const firstLetter = first?.[0] ?? "";
    const secondLetter = second?.[0] ?? "";
    return `${firstLetter}${secondLetter}`.toUpperCase();
  }, [alt]);

  const showImage = Boolean(src) && !hasError;
  const accentColor = accent ?? getAccentFromString(alt);
  const radiusValue =
    shape === "circle" ? "999px" : `${Math.max(12, Math.round(size * 0.22))}px`;

  return (
    <div
      className={cn(
        "profile-avatar",
        ring && "profile-avatar--ring",
        shape === "circle" && "profile-avatar--circle"
      )}
      style={
        {
          width: size,
          height: size,
          "--avatar-size": `${size}px`,
          "--avatar-radius": radiusValue,
          "--avatar-accent": accentColor,
        } as CSSProperties
      }
    >
      {showImage ? (
        <img
          className={cn("profile-avatar__image", className)}
          alt={alt}
          src={src}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          {...props}
        />
      ) : (
        <div className="profile-avatar__fallback">
          {fallbackText ? (
            <span className="profile-avatar__initials">{fallbackText}</span>
          ) : (
            <PersonIcon size={size * 0.65} />
          )}
        </div>
      )}
    </div>
  );
}
