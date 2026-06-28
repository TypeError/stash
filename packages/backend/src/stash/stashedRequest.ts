import type { Request } from "caido:utils";

import type { NewStashedRequest, StashRequestInput } from "./stashTypes";

function readString(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

export function createStashRequestFromCaidoRequest(
  request: Request,
  input: StashRequestInput,
): NewStashedRequest {
  const now = new Date().toISOString();

  return {
    requestId: input.requestId,
    httpHistoryId: input.httpHistoryId,
    method: readString(request.getMethod()),
    url: readString(request.getUrl()),
    host: readString(request.getHost()),
    path: readString(request.getPath()),
    createdAt: now,
    updatedAt: now,
  };
}
