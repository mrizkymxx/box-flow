export type SoStatus = "new"|"waiting_material"|"ready_plan"|"planned"|"running"|"partial"|"completed"|"hold"|"late";
export type SoPriority = "low"|"normal"|"high"|"urgent";
export type MatStatus = "ready"|"partial"|"shortage"|"waiting_supplier";

export const SO_STATUS_LABEL: Record<SoStatus, string> = {
  new: "New", waiting_material: "Waiting Material", ready_plan: "Ready Plan",
  planned: "Planned", running: "Running", partial: "Partial",
  completed: "Completed", hold: "Hold", late: "Late",
};

export const SO_STATUS_TONE: Record<SoStatus, string> = {
  new: "bg-muted text-muted-foreground border-border",
  waiting_material: "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  ready_plan: "bg-info/15 text-info border-info/30",
  planned: "bg-info/15 text-info border-info/30",
  running: "bg-primary/15 text-primary border-primary/30",
  partial: "bg-warning/15 dark:text-warning text-warning-foreground border-warning/30",
  completed: "bg-success/15 text-success border-success/30",
  hold: "bg-muted text-muted-foreground border-border",
  late: "bg-destructive/15 text-destructive border-destructive/30",
};

export const PRIORITY_TONE: Record<SoPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/20 dark:text-warning text-warning-foreground",
  urgent: "bg-destructive/15 text-destructive",
};

export const MAT_STATUS_LABEL: Record<MatStatus, string> = {
  ready: "Ready", partial: "Partial", shortage: "Shortage", waiting_supplier: "Waiting Supplier",
};
export const MAT_STATUS_TONE: Record<MatStatus, string> = {
  ready: "bg-success/15 text-success border-success/30",
  partial: "bg-warning/15 dark:text-warning text-warning-foreground border-warning/30",
  shortage: "bg-destructive/15 text-destructive border-destructive/30",
  waiting_supplier: "bg-muted text-muted-foreground border-border",
};
