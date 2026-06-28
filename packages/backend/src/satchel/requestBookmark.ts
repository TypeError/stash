import type { Request } from "caido:utils";

import type { NewSatchelBookmark } from "./satchelTypes";

function readString(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

export function createBookmarkFromCaidoRequest(
  request: Request,
  caidoRequestId: string,
): NewSatchelBookmark {
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
