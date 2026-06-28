import type { FrontendSDK } from "@/types";

const STASH_REPLAY_COLLECTION_NAME = "Stash";

type ReplaySession = ReturnType<FrontendSDK["replay"]["getSessions"]>[number];
type ReplayCollection = ReturnType<FrontendSDK["replay"]["getCollections"]>[number];

let stashReplayCollectionId: string | undefined;

function findStashReplayCollection(sdk: FrontendSDK): ReplayCollection | undefined {
  return sdk.replay
    .getCollections()
    .find((collection) => collection.name === STASH_REPLAY_COLLECTION_NAME);
}

async function getStashReplayCollectionId(sdk: FrontendSDK): Promise<string> {
  if (stashReplayCollectionId !== undefined) {
    return stashReplayCollectionId;
  }

  const existingCollection = findStashReplayCollection(sdk);

  if (existingCollection !== undefined) {
    stashReplayCollectionId = existingCollection.id;
    return existingCollection.id;
  }

  await sdk.replay.createCollection(STASH_REPLAY_COLLECTION_NAME);

  const createdCollection = findStashReplayCollection(sdk);

  if (createdCollection === undefined) {
    throw new Error("Could not create Stash Replay collection.");
  }

  stashReplayCollectionId = createdCollection.id;

  return createdCollection.id;
}

function getReplaySessionIds(sdk: FrontendSDK): Set<string> {
  return new Set(sdk.replay.getSessions().map((session) => session.id));
}

function findCreatedReplaySession(
  sdk: FrontendSDK,
  previousSessionIds: Set<string>,
): ReplaySession | undefined {
  return sdk.replay.getSessions().find((session) => !previousSessionIds.has(session.id));
}

export async function openRequestInReplay(
  sdk: FrontendSDK,
  requestId: string,
): Promise<ReplaySession> {
  const collectionId = await getStashReplayCollectionId(sdk);
  const previousSessionIds = getReplaySessionIds(sdk);

  await sdk.replay.createSession(
    {
      type: "ID",
      id: requestId,
    },
    collectionId,
  );

  const session = findCreatedReplaySession(sdk, previousSessionIds);

  if (session === undefined) {
    throw new Error("Could not find the created Replay session.");
  }

  sdk.replay.openTab(session.id, { select: true });
  sdk.navigation.goTo({ id: "Replay" });

  return session;
}
