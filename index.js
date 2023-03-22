// @ts-check
import { TypedEmitter } from "tiny-typed-emitter";
const { createClient, createServer } = require("rpc-reflector");

// @ts-expect-error
import DuplexPair from "native-duplexpair";

/**
 * @typedef {import('./types/api').ApiEvents} ApiEvents
 */

/**
 * @extends {TypedEmitter<ApiEvents>}
 */
class Api extends TypedEmitter {
  constructor() {
    super();
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

  /**
   * @param {keyof import('./types/api').ApiEvents} eventName
   */
  function simulateApiEvent(eventName) {
    setTimeout(() => {
      api.emit(eventName);
    }, 1000);
  }

  // 1. Set up the server
  function setupServer() {
    api.on("discovery:start", () => {
      console.log("discovery started");
      simulateApiEvent("invite:received");
    });

    api.on("invite:accepted", () => {
      console.log("invite was accepted");
    });

    const { close } = createServer(api, serverStream);

    return close;
  }

  const close = setupServer();

  // 2. Set up the client
  function setupClient() {
    /**
     * @type {import('rpc-reflector/dist/client').ClientApi<typeof api>}
     */
    const client = createClient(clientStream);

    client.on("invite:received", async () => {
      console.log("client received invite, accepting");
      await client.$projectsManagement.invite.accept();
    });

    return client;
  }

  const client = setupClient();

  // 3. Run stuff using the client
  await client.$sync.setDiscovery();
  simulateApiEvent("discovery:start");
})();
