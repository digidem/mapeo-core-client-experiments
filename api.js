// @ts-check
import { TypedEmitter } from "tiny-typed-emitter";

import { DataTypeDriver } from "./mapeo-drivers.js";

/**
 * @typedef {import('./types/api.js').ApiEvents} ApiEvents
 * @typedef {import('./types/mapeo.js').Observation} Observation
 */

/**
 * @extends {TypedEmitter<ApiEvents>}
 */
export class Api extends TypedEmitter {
  /** @type {DataTypeDriver<Observation>} */
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
