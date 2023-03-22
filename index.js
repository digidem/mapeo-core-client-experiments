// @ts-check
import { TypedEmitter } from "tiny-typed-emitter";
import reflector from "rpc-reflector";

// @ts-expect-error
import DuplexPair from "native-duplexpair";

import { DataTypeDriver } from "./mapeo-drivers.js";

const { createClient, createServer } = reflector;

/**
 * @typedef {import('./types/api').ApiEvents} ApiEvents
 */

/**
 * @extends {TypedEmitter<ApiEvents>}
 */
class Api extends TypedEmitter {
  /** @type {import('./mapeo-drivers').DataTypeDriver<import('./types/mapeo').Observation>} */
  #observation;

  constructor() {
    super();

    this.#observation = new DataTypeDriver("observation");
  }

  get observation() {
    return this.#observation;
  }

  get $sync() {
    console.log("$sync");

    return {
      info() {
        console.log("\tinfo");
      },
      setDiscovery() {
        console.log("\tsetDiscovery");
      },
      setSync() {
        console.log("\tsetSync");
      },
    };
  }

  get $device() {
    console.log("$device");
    return {
      get() {
        console.log("\tget");
      },
      getAll() {
        console.log("\tgetAll");
      },
    };
  }

  get $project() {
    console.log("$project");

    return {
      info() {
        console.log("\tinfo");
      },
      member: {
        get() {
          console.log("\tmember.get");
        },
        getMany() {
          console.log("\tmember.getMany");
        },
        add() {
          console.log("\tmember.add");
        },
        update() {
          console.log("\tmember.update");
        },
        remove() {
          console.log("\tmember.remove");
        },
      },
      invite: {
        create() {
          console.log("\tinvite.create");
        },
        getMany() {
          console.log("\tinvite.getMany");
        },
      },
    };
  }

  get $projectsManagement() {
    console.log("$projectsManagement");

    return {
      get() {
        console.log("\tget");
      },
      getMany() {
        console.log("\tgetMany");
      },
      create() {
        console.log("\tcreate");
      },
      update() {
        console.log("\tupdate");
      },
      delete() {
        console.log("\tdelete");
      },
      invite: {
        accept() {
          console.log("\tinvite.accept");
        },
        decline() {
          console.log("\tinvite.decline");
        },
      },
    };
  }
}

(async function main() {
  const { socket1, socket2 } = new DuplexPair({ objectMode: true });

  const serverStream = socket1;
  const clientStream = socket2;

  const api = new Api();

  // 1. Set up the server
  const { close } = createServer(api, serverStream);

  // 2. Set up the client
  /**
   * @type {import('rpc-reflector/dist/client').ClientApi<typeof api>}
   */
  const client = createClient(clientStream);

  // 3. Run stuff using the client
  eventsExample: {
    api.once("discovery:start", () => {
      console.log("discovery started");
      api.emit("invite:received");
    });

    api.once("invite:accepted", () => {
      console.log("invite was accepted");
    });

    client.once("invite:received", async () => {
      console.log("client received invite, accepting");
      await client.$projectsManagement.invite.accept();
    });

    await client.$sync.setDiscovery();

    api.emit("discovery:start");
  }

  dataTypeExample: {
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
  }
})();
