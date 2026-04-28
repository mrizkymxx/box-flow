import { cn } from "@/lib/utils";
import { SO_STATUS_LABEL, SO_STATUS_TONE, PRIORITY_TONE, MAT_STATUS_LABEL, MAT_STATUS_TONE, type SoStatus, type SoPriority, type MatStatus } from "@/lib/status";

export function SoStatusBadge({ status }: { status: SoStatus }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap", SO_STATUS_TONE[status])}>{SO_STATUS_LABEL[status]}</span>;
}
export function PriorityBadge({ priority }: { priority: SoPriority }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize", PRIORITY_TONE[priority])}>{priority}</span>;
}
export function MatStatusBadge({ status }: { status: MatStatus }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", MAT_STATUS_TONE[status])}>{MAT_STATUS_LABEL[status]}</span>;
}
