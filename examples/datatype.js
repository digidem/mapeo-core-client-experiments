// @ts-check
import DuplexPair from "native-duplexpair";

import { setupServer, setupClient } from "../index.js";

console.log("\nDATATYPE EXAMPLE:\n");

// 1. Setup server and client
const { socket1, socket2 } = new DuplexPair({ objectMode: true });

const { api, close } = setupServer(socket1);

const client = setupClient(socket2);

// 2. Create, update, and delete data
const obs = await client.observation.create({
  lat: 0,
  lon: 0,
  tags: {
    type: "animal",
  },
});

console.log(obs);

const updatedObs = await client.observation.update(obs.version, {
  ...obs.value,
  tags: {
    type: "place",
  },
});

console.log(updatedObs);

const allObs = await client.observation.getMany({ includeDeleted: true });

console.log(allObs.length); // should be 2

const deletedObs = await client.observation.delete(updatedObs.version);

console.log(deletedObs.deleted); // should be true

close();
