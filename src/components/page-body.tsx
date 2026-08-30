import { cn } from "@/lib/utils";

export function PageBody({
  children,
  size = "default",
  className,
}: {
  children: React.ReactNode;
  size?: "narrow" | "default" | "wide" | "full";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 py-8 md:px-8",
        size === "narrow" && "max-w-2xl",
        size === "default" && "max-w-4xl",
        size === "wide" && "max-w-6xl",
        size === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
