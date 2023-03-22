// @ts-check
import EventEmitter from "node:events";

/**
 * @typedef {Record<string, *>} MapeoType
 */

/**
 * @template {MapeoType} V
 * @typedef {Object} MapeoDoc
 *
 * @property {string} id
 * @property {string} version
 * @property {boolean} deleted
 * @property {string[]} links
 * @property {string[]} forks
 * @property {string} created_at
 * @property {string} updated_at
 * @property {V} value
 */

/**
 * @template {MapeoType} T
 *
 * @extends DataTypeDriver<T>
 */
export class DataTypeDriver {
  /** @type {MapeoDoc<T>[]} */
  _db = [];

  /**
   *
   * @param {string} name
   */
  constructor(name) {
    this._name = name;
  }

  /**
   * @param {MapeoDoc<T>['value']} value
   *
   * @returns {MapeoDoc<T>}
   */
  create(value) {
    const now = Date.now();

    const doc = {
      id: now.toString(),
      version: `${now}@1`,
      updated_at: new Date(now).toISOString(),
      created_at: new Date(now).toISOString(),
      deleted: false,
      value,
      forks: [],
      links: [],
    };

    this._db.push(doc);

    return doc;
  }

  /**
   *
   * @param {string} id
   *
   * @returns {MapeoDoc<T>}
   */
  getByDocId(id) {
    for (let i = this._db.length; i > -1; i--) {
      const doc = this._db[i];

      if (doc && doc.id === id) {
        return doc;
      }
    }

    throw new Error("Could not find");
  }

  /**
   * @param {string} id
   *
   * @returns {MapeoDoc<T>}
   */
  getByVersionId(id) {
    for (let i = this._db.length; i > -1; i--) {
      const doc = this._db[i];

      if (doc && doc.version === id) {
        return doc;
      }
    }

    throw new Error("Could not find");
  }

  /**
   * @param {{includeDeleted: boolean | undefined}} [opts]
   *
   * @returns {MapeoDoc<T>[]}
   */
  getMany(opts) {
    return opts && opts.includeDeleted
      ? this._db
      : this._db.filter((d) => !d.deleted);
  }

  /**
   * @param {string | string[]} version
   * @param {Partial<MapeoDoc<T>['value']>} value
   *
   * @returns {MapeoDoc<T>}
   */
  update(version, value) {
    if (Array.isArray(version))
      throw new Error("Version array not supported yet");

    const doc = this.getByVersionId(version);

    if (doc.deleted) throw new Error("Cannot update deleted doc");

    const [id, prevVersionNumber] = doc.version.split("@");

    const nextVersion = `${id}@${parseInt(prevVersionNumber, 10) + 1}`;

    const updated = {
      ...doc,
      version: nextVersion,
      links: [...doc.links, doc.version],
      updated_at: new Date().toISOString(),
      value: { ...doc.value, ...value },
    };

    this._db.push(updated);

    return updated;
  }

  /**
   * @param {string | string[]} version
   *
   * @returns {MapeoDoc<T>}
   */
  delete(version) {
    if (Array.isArray(version))
      throw new Error("Version array not supported yet");

    const doc = this.getByVersionId(version);

    const updated = {
      ...doc,
      deleted: true,
      links: [...doc.links, doc.version],
      updated_at: new Date().toISOString(),
    };

    this._db.push(updated);

    return updated;
  }
}

/** @typedef {'lan' | 'internet'} ConnectionType */

/**
 * @typedef {Object} SyncInfo
 *
 * @property {ConnectionType[]} discovery
 * @property {ConnectionType[]} sync
 */

export class SyncDriver extends EventEmitter {
  /** @type {Set<ConnectionType>} */
  _discovery = new Set();

  /** @type {Set<ConnectionType>} */
  _sync = new Set();

  constructor() {
    super();
  }

  /**
   * @returns {Promise<SyncInfo>}
   */
  async info() {
    return {
      discovery: Array.from(this._discovery.values()),
      sync: Array.from(this._sync.values()),
    };
  }

  /**
   * @param {ConnectionType[] | null} connectionTypes
   */
  async setDiscovery(connectionTypes) {
    const ct = connectionTypes || [];

    const wasEmpty = this._discovery.size === 0;

    this._discovery.clear();

    if (ct.length === 0 && !wasEmpty) {
      setTimeout(() => {
        this.emit("discovery:stop");
      }, 2000);

      return;
    }

    for (const val of ct) {
      this._discovery.add(val);
    }

    if (wasEmpty) {
      setTimeout(() => {
        this.emit("discovery:start");
      }, 2000);
    }
  }

  /**
   * @param {ConnectionType[] | null} connectionTypes
   */
  async setSync(connectionTypes) {
    const ct = connectionTypes || [];

    const wasEmpty = this._sync.size === 0;

    this._sync.clear();

    if (ct.length === 0 && !wasEmpty) {
      setTimeout(() => {
        this.emit("sync:stop");
      }, 2000);

      return;
    }

    for (const val of ct) {
      this._sync.add(val);
    }

    if (wasEmpty) {
      setTimeout(() => {
        this.emit("sync:start");
      }, 2000);
    }
  }
}

/**
 * @typedef {Object} DeviceInfo
 *
 * @property {string} id
 * @property {string} deviceId
 * @property {string?} name
 * @property {number} lastSynced
 * @property {number} lastSeen
 *
 */

/**
 * @typedef {Object} SyncExchangeInfo
 *
 * @property {number} has
 * @property {number} wants
 *
 */

/**
 * @typedef {Object} SyncState
 *
 * @property {string} id
 * @property {SyncExchangeInfo} db
 * @property {SyncExchangeInfo} media
 * @property {{timestamp: string, db: SyncExchangeInfo, media: SyncExchangeInfo}} atSyncStart
 * @property {string} lastCompletedAt
 * @property {{timestamp: string, error: string}?} syncError
 * @property {{timestamp: string, error: string}?} connectionError
 */

export class DeviceDriver extends EventEmitter {
  /** @type {Map<string, DeviceInfo>} */
  _devices = new Map();

  constructor() {
    super();
  }

  /**
   * @param {string} id
   * @returns {Promise<DeviceInfo | null>}
   */
  async get(id) {
    const found = this._devices.get(id);

    return found || null;
  }

  /**
   * @returns {Promise<DeviceInfo[]>}
   */
  async getAll() {
    return Array.from(this._devices.values());
  }

  /**
   *
   * @param {*} info
   */
  _triggerConnectEvent(info) {
    const device = this._devices.get(info.id);

    if (device) {
      this._devices.set(device.id, info);
      this.emit("connect", device);
    }
  }

  /**
   *
   * @param {string} id
   */
  _triggerDisconnectEvent(id) {
    const device = this._devices.get(id);

    if (device) {
      this._devices.delete(id);
      this.emit("disconnect", device);
    }
  }

  /**
   *
   * @param {string} id
   * @param {*} info
   */
  _triggerInfoEvent(id, info) {
    const device = this._devices.get(id);

    if (device) {
      const updated = { ...device, ...info };
      this._devices.set(id, updated);
      this.emit("info", updated);
    }
  }

  /**
   *
   * @param {string} id
   */
  _triggerSyncEvent(id) {
    const device = this._devices.get(id);

    if (device) {
      const now = new Date().toISOString();

      this.emit("sync", {
        id,
        db: { has: 10, wants: 10 },
        media: { has: 5, wants: 5 },
        atSyncStart: {
          timestamp: now,
          db: { has: 10, wants: 10 },
          media: { has: 5, wants: 5 },
        },
        lastCompletedAt: now,
        syncError: null,
        connectionError: null,
      });
    }
  }
}

/**
 * @typedef {Object} Project
 *
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {'creator' | 'coordinator' | 'member'} ProjectRole
 */

/**
 * @typedef {Object} ProjectMember
 *
 * @property {string} id
 * @property {string?} name
 * @property {ProjectRole} role
 */

export class ProjectDriver extends EventEmitter {
  /** @type {Map<string, ProjectMember>} */
  _members = new Map();

  /** @type {Map<string, {id: string, role: ProjectRole}>} */
  _invites = new Map();

  /**
   * @param {string} name
   */
  constructor(name) {
    super();

    this._id = Date.now().toString();
    this._name = name;
  }

  get member() {
    const self = this;

    /**
     * @param {string} id
     * @returns {Promise<ProjectMember | null>}
     */
    return {
      /**
       * @param {string} id
       *
       * @returns {Promise<ProjectMember | null>}
       */
      async get(id) {
        const member = self._members.get(id);

        return member || null;
      },

      /**
       *
       * @param {*} opts
       * @returns
       */
      async getMany(opts) {
        return Array.from(self._members.values());
      },

      /**
       * @param {string} id
       * @param {{name:  string?, role: ProjectRole}} info
       *
       * @returns {Promise<ProjectMember>}
       */
      async add(id, info) {
        if (self._members.has(id)) throw new Error("Already exists");
        const member = { ...info, id };
        self._members.set(id, member);
        return member;
      },
      /**
       * @param {string} id
       */
      async remove(id) {
        if (!self._members.has(id)) throw new Error("Does not exist");
        self._members.delete(id);
      },

      /**
       * @param {string} id
       * @param {{name:  string?, role: ProjectRole}} info
       *
       * @returns {Promise<ProjectMember>}
       */
      async update(id, info) {
        const member = self._members.get(id);

        if (!member) throw new Error("Does not exist");

        const updated = { ...member, ...info };

        self._members.set(id, updated);

        return updated;
      },
    };
  }

  get invite() {
    const self = this;

    return {
      /**
       *
       * @param {*} id
       * @param {*} role
       */
      async create(id, role) {
        if (!self._invites.has(id)) {
          self._invites.set(id, { id, role });
          // Not an actual event to implement and use
          self.emit("invite:send", { id, role });
        }
      },

      /**
       *
       * @param {*} opts
       * @returns
       */
      async getMany(opts) {
        return Array.from(self._invites.values());
      },
    };
  }

  /**
   * @returns {Promise<Project>}
   */
  async info() {
    return { id: this._id, name: this._name };
  }

  /**
   *
   * @param {string} id
   * @param {*} info
   */
  _triggerInviteAcceptedEvent(id, info) {
    if (this._invites.has(id)) {
      this.emit("invite:accepted", id, info);
      this._invites.delete(id);
    }
  }

  /**
   *
   * @param {*} id
   * @param {*} info
   */
  _triggerInviteDeclinedEvent(id, info) {
    if (this._invites.has(id)) {
      this.emit("invite:declined", id, info);
      this._invites.delete(id);
    }
  }
}

export class ProjectsManagementDriver extends EventEmitter {
  _id = Date.now().toString();

  /** @type {Map<string, ProjectDriver>} */
  _projects = new Map();

  constructor() {
    super();
  }

  /**
   * @param {string} id
   *
   * @returns {Promise<Project | null>}
   */
  async get(id) {
    const project = this._projects.get(id);

    if (!project) return null;

    return project.info();
  }

  /**
   *
   * @param {*} opts
   *
   * @returns {Promise<Project[]>}
   */
  async getMany(opts) {
    return Promise.all(
      Array.from(this._projects.values()).map((p) => p.info())
    );
  }

  /**
   * @param {{ name: string }} opts
   *
   * @returns {Promise<Project>}
   */
  async create(opts) {
    const project = new ProjectDriver(opts.name);

    project.addListener("invite:send", (id, info) => {
      this.emit("invite:received", id, info);
    });

    const info = await project.info();

    this._projects.set(info.id, project);

    return info;
  }

  /**
   *
   * @param {string} id
   * @param {{ name: string }} info
   *
   * @returns {Promise<Project>}
   */
  async update(id, info) {
    const project = this._projects.get(id);

    if (!project) throw new Error("Not found");

    // TODO: Project class need some kind of update method?
    project._name = info.name;

    return project.info();
  }

  /**
   * @param {string} id
   *
   * @returns {Promise<Project>}
   */
  async delete(id) {
    const project = this._projects.get(id);

    if (!project) throw new Error("Not found");

    this._projects.delete(id);

    return project.info();
  }

  get invite() {
    const self = this;

    return {
      /**
       *
       * @param {string} id
       * @param {*} params
       */
      async accept(id, params) {
        const project = self._projects.get(id);

        if (project) {
          project._triggerInviteAcceptedEvent(id, params);
        }
      },

      /**
       *
       * @param {string} id
       * @param {*} params
       */
      async decline(id, params) {
        const project = self._projects.get(id);

        if (project) {
          project._triggerInviteDeclinedEvent(id, params);
        }
      },
    };
  }

  /**
   *
   * @param {*} info
   */
  _triggerInviteReceivedEvent(info) {
    this.emit("invite:received", info);
  }
}
