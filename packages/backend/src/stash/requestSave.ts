import type { Request } from "caido:utils";

import type { NewStashSave } from "./stashTypes";

function readString(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

export function createStashSaveFromCaidoRequest(
  request: Request,
  caidoRequestId: string,
): NewStashSave {
  const now = new Date().toISOString();

  return {
    caidoRequestId,
    method: readString(request.getMethod()),
    url: readString(request.getUrl()),
    host: readString(request.getHost()),
    path: readString(request.getPath()),
    createdAt: now,
    updatedAt: now,
  };
}
