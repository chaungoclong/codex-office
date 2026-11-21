export type RequestId = number;
export interface JsonRpcRequest {
  method: string;
  id: RequestId;
  params?: unknown;
}
export interface JsonRpcNotification {
  method: string;
  params?: unknown;
}
export interface JsonRpcResponse {
  id: RequestId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}
export type JsonRpcMessage =
  JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

export interface ThreadStartParams {
  cwd: string;
  model?: string;
  baseInstructions?: string;
  approvalPolicy?: "untrusted" | "on-request" | "never";
  sandbox?: "read-only" | "workspace-write" | "danger-full-access";
}
export interface ThreadStartResponse {
  thread: { id: string; [key: string]: unknown };
  model: string;
  [key: string]: unknown;
}
export interface ThreadListResponse {
  data: Array<{ id: string; [key: string]: unknown }>;
  nextCursor: string | null;
}
export interface TurnStartResponse {
  turn: { id: string; status: string; [key: string]: unknown };
}
export interface ApprovalRequest {
  requestId: RequestId;
  method: string;
  params: unknown;
}

export const approvalMethods = new Set([
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval",
  "item/permissions/requestApproval",
  "mcpServer/elicitation/request",
  "applyPatchApproval",
  "execCommandApproval",
]);
