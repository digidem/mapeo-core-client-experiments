// @ts-check
import DuplexPair from "native-duplexpair";

import { setupServer, setupClient } from "./index.js";

function runEventsExample() {
  console.log("\nEVENTS EXAMPLE:\n");

  const { socket1, socket2 } = new DuplexPair({ objectMode: true });

  return new Promise(async (res, rej) => {
    try {
      const { api, close } = setupServer(socket1, (api) => {
        api.once("discovery-start", () => {
          const invite = {
            id: Date.now().toString(),
            project: api.$project.info(),
            from: {
              id: "abc123",
              name: null,
            },
            role: "member",
          };

          console.log("SERVER: DISCOVERY STARTED, SENDING INVITE", invite);

          // For demo purposes
          api.emit("invite-received", invite);
        });

        api.once("invite-accepted", (invite) => {
          console.log("SERVER: CLIENT ACCEPTED INVITE, CLOSING", invite);
          close();
          res("DONE");
        });

        return api;
      });

      /** @type {import('./index.js').ClientApi<typeof api>} */
      const client = setupClient(socket2);

      client.$sync.setDiscovery(["lan"]).then(() => {
        // For demo purposes
        api.emit("discovery-start");
      });

      client.once("invite-received", (invite) => {
        console.log("CLIENT: RECEIVED INVITE, ACCEPTING", invite);
        client.$projectsManagement.invite.accept(invite.id, {}).then(() => {
          // For demo purposes
          api.emit("invite-accepted", invite);
        });
      });
    } catch (thrown) {
      rej(thrown);
    }
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
