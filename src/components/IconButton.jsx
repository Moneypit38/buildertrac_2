import { forwardRef } from "react";

// A phone-friendly icon button: 44px tap area (Apple's recommended minimum), while the
// negative margin keeps the layout as compact as the old tiny buttons.
const IconButton = forwardRef(function IconButton({ children, className = "", destructive = false, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center h-11 w-11 -m-2 shrink-0 rounded-xl text-muted-foreground transition-colors active:bg-accent hover:bg-accent ${destructive ? "hover:text-destructive active:text-destructive" : "hover:text-foreground"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default IconButton;
