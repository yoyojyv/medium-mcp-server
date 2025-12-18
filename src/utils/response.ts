/**
 * MCP Tool 응답 유틸리티
 */

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * 성공 응답 생성
 */
export function successResponse(data: unknown): ToolResponse {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * 에러 응답 생성
 */
export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * JSON 에러 응답 생성 (구조화된 에러)
 */
export function jsonErrorResponse(error: { error: string; details?: string }): ToolResponse {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(error, null, 2) }],
    isError: true,
  };
}
