export interface ApiEvents {
  "device:connect": () => void;
  "device:disconnect": () => void;
  "device:info": () => void;
  "device:sync": () => void;
  "discovery:start": () => void;
  "discovery:stop": () => void;
  "sync:start": () => void;
  "sync:stop": () => void;
  "invite:received": () => void;
  "invite:accepted": () => void;
  "invite:declined": () => void;
}
