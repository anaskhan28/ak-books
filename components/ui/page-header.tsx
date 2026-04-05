import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex  flex-row items-center justify-between gap-3 mb-3 md:mb-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="hidden md:block text-[13px] text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
