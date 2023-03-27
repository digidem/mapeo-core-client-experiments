// @ts-check
import DuplexPair from "native-duplexpair";

import { setupServer, setupClient } from "./index.js";

async function runEventsExample() {
  console.log("\nEVENTS EXAMPLE:\n");

  const { socket1, socket2 } = new DuplexPair({ objectMode: true });

  const { api, close } = setupServer(socket1, (api) => {
    api.once("discovery:start", () => {
      console.log("discovery started");
      api.emit("invite:received");
    });

    api.once("invite:accepted", () => {
      console.log("invite was accepted");
    });

    return api;
  });

  /** @type {import('./index.js').ClientApi<typeof api>} */
  const client = setupClient(socket2);

  client.once("invite:received", async () => {
    console.log("client received invite, accepting");
    await client.$projectsManagement.invite.accept();
  });

  await client.$sync.setDiscovery();

  api.emit("discovery:start");

  return new Promise((res) => {
    client.once("invite:received", async () => {
      console.log("client received invite, accepting");
      await client.$projectsManagement.invite.accept();
      console.log("done");
      close();
      res("done");
    });
  });
}

async function runDataTypeExample() {
  console.log("\nDATATYPE EXAMPLE:\n");

  const { socket1, socket2 } = new DuplexPair({ objectMode: true });

  const { api, close } = setupServer(socket1);

  /** @type {import('./index.js').ClientApi<typeof api>} */
  const client = setupClient(socket2);

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
}

await runEventsExample();
await runDataTypeExample();
