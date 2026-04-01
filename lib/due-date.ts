/**
 * Returns a human-readable due-date status label and color.
 * Examples:  "DUE IN 28 DAYS",  "DUE IN 3 DAYS",  "OVERDUE BY 7 DAYS"
 */
export function getDueDateStatus(dueDate: string | null): {
  label: string;
  color: "blue" | "orange" | "red" | "gray";
} {
  if (!dueDate) return { label: "—", color: "gray" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "DUE TODAY", color: "orange" };
  if (diffDays > 0)
    return {
      label: `DUE IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`,
      color: diffDays <= 5 ? "orange" : "blue",
    };
  const overdue = Math.abs(diffDays);
  return {
    label: `OVERDUE BY ${overdue} DAY${overdue > 1 ? "S" : ""}`,
    color: "red",
  };
}
