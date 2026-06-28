export type StashItem = {
  id: number;
  caidoRequestId: string;
  method: string | undefined;
  url: string | undefined;
  host: string | undefined;
  path: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type StashDetail = StashItem & {
  available: boolean;
  request:
    | {
        headers: Record<string, string[]>;
        bodyText: string | undefined;
        rawRequest: string | undefined;
      }
    | undefined;
  response:
    | {
        statusCode: number | undefined;
        headers: Record<string, string[]>;
        bodyText: string | undefined;
      }
    | undefined;
};
