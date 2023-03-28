export type Peer = {
  id: string;
  name: string | null;
  lastSynced: string;
  lastSeen: string;
};

export type SyncExchangeInfo = {
  has: number;
  wants: number;
};

type SyncState = {
  // Peer id
  id: string;
  // Sync exchange info for database records
  db: SyncExchangeInfo;
  // Sync exchange info for media
  media: SyncExchangeInfo;
  // Snapshot of the sync exchange info when the sync started
  atSyncStart: {
    timestamp: string;
    db: SyncExchangeInfo;
    media: SyncExchangeInfo;
  };
  // The last time a sync completed
  lastCompletedAt: string;
  // Populated if an error occurred when trying to sync
  syncError: {
    timestamp: string;
    error: string;
  } | null;
  // Populated if an error occurrred when trying to connect to peer
  connectionError: {
    timestamp: string;
    error: string;
  } | null;
};

type Invite = {
  id: string;
  project: {
    id: string;
    name: string | null;
  };
  from: {
    id: string;
    name: string | null;
  };
  role: ProjectRole;
};

export interface ApiEvents {
  "peer-connect": (peer: Peer) => void;
  "peer-disconnect": (peer: Peer) => void;
  "peer-info": (peer: Peer) => void;
  "peer-sync": (state: SyncState) => void;
  "discovery-start": () => void;
  "discovery-stop": () => void;
  "sync-start": () => void;
  "sync-stop": () => void;
  "invite-received": (invite: Invite) => void;
  "invite-accepted": (invite: Invite) => void;
  "invite-declined": (invite: Invite) => void;
}
