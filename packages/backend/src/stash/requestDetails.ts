import type { SDK } from "caido:plugin";

import type { StashRequestDetails } from "./stashTypes";

function readBodyText(body: { toText(): string } | undefined): string | undefined {
  if (body === undefined) {
    return undefined;
  }

  const text = body.toText();
  return text.length > 0 ? text : undefined;
}

export async function loadRequestDetails(
  sdk: SDK,
  requestId: string,
): Promise<StashRequestDetails | undefined> {
  const pair = await sdk.requests.get(requestId);

  if (pair === undefined) {
    return undefined;
  }

  return {
    method: pair.request.getMethod(),
    url: pair.request.getUrl(),
    host: pair.request.getHost(),
    path: pair.request.getPath(),
    request: {
      headers: pair.request.getHeaders(),
      bodyText: readBodyText(pair.request.getBody()),
      rawRequest: pair.request.getRaw().toText(),
    },
    response:
      pair.response === undefined
        ? undefined
        : {
            statusCode: pair.response.getCode(),
            headers: pair.response.getHeaders(),
            bodyText: readBodyText(pair.response.getBody()),
          },
  };
}
