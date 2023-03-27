// @ts-check
import reflector from "rpc-reflector";
import DuplexPair from "native-duplexpair";

import { Api } from "./api.js";

const { createClient, createServer } = reflector;

/**
 * @template A
 *
 * @typedef {import('rpc-reflector/dist/client.js').ClientApi<A>} ClientApi
 */

/**
 * @param {Api} api
 * @param {import('stream').Duplex} channel
 *
 * @returns {() => void}
 */
function setupServer(api, channel) {
  return createServer(api, channel).close;
}

/**
 * @template {Api} A
 *
 * @param {import('stream').Duplex} channel
 *
 * @returns {ClientApi<A>}
 */
function setupClient(channel) {
  return createClient(channel);
}

async function runEventsExample() {
  console.log("\nEVENTS EXAMPLE:\n");

  const { socket1, socket2 } = new DuplexPair({ objectMode: true });

  const api = new Api();

  api.once("discovery:start", () => {
    console.log("discovery started");
    api.emit("invite:received");
  });

  api.once("invite:accepted", () => {
    console.log("invite was accepted");
  });

  const close = setupServer(api, socket1);

  /** @type {ClientApi<typeof api>} */
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

  const api = new Api();

  const close = setupServer(api, socket1);

  /** @type {ReturnType<typeof setupClient<typeof api>>} */
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
