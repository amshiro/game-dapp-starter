import type { ComponentPropsWithoutRef } from "react";

type OriViewportProps = ComponentPropsWithoutRef<"div">;

export function OriViewport({ className, ...props }: OriViewportProps) {
  const classes = className
    ? `ori-app-viewport ${className}`
    : "ori-app-viewport";

  return <div className={classes} {...props} />;
}
