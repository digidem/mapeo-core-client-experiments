// @ts-check
import { TypedEmitter } from "tiny-typed-emitter";

import {
  DataTypeDriver,
  PeerDriver,
  ProjectDriver,
  ProjectsManagementDriver,
  SyncDriver,
} from "./mapeo-drivers.js";

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

  /** @type {SyncDriver} */
  #sync;

  /** @type {PeerDriver} */
  #peer;

  /** @type {ProjectDriver} */
  #project;

  /** @type {ProjectsManagementDriver} */
  #projectsManager;

  constructor() {
    super();

    this.#observation = new DataTypeDriver("observation");
    this.#sync = new SyncDriver();
    this.#peer = new PeerDriver();
    this.#project = new ProjectDriver("mapeo");
    this.#projectsManager = new ProjectsManagementDriver(this.#project);
  }

  get observation() {
    return this.#observation;
  }

  get $sync() {
    return this.#sync;
  }

  get $peer() {
    return this.#peer;
  }

  get $project() {
    return this.#project;
  }

  get $projectsManagement() {
    return this.#projectsManager;
  }
}
