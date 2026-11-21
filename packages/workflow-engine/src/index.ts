export type TaskState =
  | "pending"
  | "analyzing"
  | "planning"
  | "in_progress"
  | "ready_for_test"
  | "testing"
  | "ready_for_review"
  | "reviewing"
  | "done"
  | "blocked";

const transitions: Record<TaskState, readonly TaskState[]> = {
  pending: ["analyzing", "blocked"],
  analyzing: ["planning", "blocked"],
  planning: ["in_progress", "blocked"],
  in_progress: ["ready_for_test", "blocked"],
  ready_for_test: ["testing", "blocked"],
  testing: ["in_progress", "ready_for_review", "blocked"],
  ready_for_review: ["reviewing", "blocked"],
  reviewing: ["in_progress", "done", "blocked"],
  done: [],
  blocked: ["in_progress"],
};

export interface CompletionEvidence {
  acceptanceCriteriaMet: boolean;
  selfTestPassed: boolean;
  testerPassed: boolean;
  reviewerPassed: boolean;
  blockingDefects: number;
}

export function canTransition(
  from: TaskState,
  to: TaskState,
  evidence?: CompletionEvidence,
): boolean {
  if (!transitions[from].includes(to)) return false;
  if (to !== "done") return true;
  return Boolean(
    evidence?.acceptanceCriteriaMet &&
    evidence.selfTestPassed &&
    evidence.testerPassed &&
    evidence.reviewerPassed &&
    evidence.blockingDefects === 0,
  );
}

export function assertTransition(
  from: TaskState,
  to: TaskState,
  evidence?: CompletionEvidence,
): void {
  if (!canTransition(from, to, evidence))
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
}
