import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "No data yet",
  message = "Get started by adding your first entry.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-4">
        <Inbox size={24} className="text-primary" />
      </div>
      <p className="text-[15px] font-normal text-muted mb-1">{title}</p>
      <p className="text-[13px] text-muted max-w-xs">{message}</p>
    </div>
  );
}
