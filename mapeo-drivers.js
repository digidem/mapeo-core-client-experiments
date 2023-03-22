// @ts-check
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

export class SyncDriver {
  /** @type {Set<ConnectionType>} */
  _discovery = new Set();

  /** @type {Set<ConnectionType>} */
  _sync = new Set();

  /**
   * @returns {SyncInfo}
   */
  info() {
    return {
      discovery: Array.from(this._discovery.values()),
      sync: Array.from(this._sync.values()),
    };
  }

  /**
   * @param {ConnectionType[] | null} connectionTypes
   */
  setDiscovery(connectionTypes) {
    const ct = connectionTypes || [];

    this._discovery.clear();

    for (const val of ct) {
      this._discovery.add(val);
    }
  }

  /**
   * @param {ConnectionType[] | null} connectionTypes
   */
  setSync(connectionTypes) {
    const ct = connectionTypes || [];

    this._sync.clear();

    for (const val of ct) {
      this._sync.add(val);
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

export class DeviceDriver {
  /** @type {Map<string, DeviceInfo>} */
  _devices = new Map();

  /**
   * @param {string} id
   * @returns {DeviceInfo | null}
   */
  get(id) {
    const found = this._devices.get(id);

    return found || null;
  }

  /**
   * @returns {DeviceInfo[]}
   */
  getAll() {
    return Array.from(this._devices.values());
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

export class ProjectDriver {
  /** @type {Map<string, ProjectMember>} */
  _members = new Map();

  /** @type {Map<string, {id: string, role: ProjectRole}>} */
  _invites = new Map();

  /**
   * @param {string} name
   */
  constructor(name) {
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
       * @return {ProjectMember | null}
       */
      get(id) {
        const member = self._members.get(id);

        return member || null;
      },

      /**
       * @param {*} opts
       * @returns {ProjectMember[]}
       */
      getMany(opts) {
        return Array.from(self._members.values());
      },

      /**
       * @param {string} id
       * @param {{name:  string?, role: ProjectRole}} info
       *
       * @returns {ProjectMember}
       */
      add(id, info) {
        if (self._members.has(id)) throw new Error("Already exists");
        const member = { ...info, id };
        self._members.set(id, member);
        return member;
      },
      /**
       * @param {string} id
       */
      remove(id) {
        if (!self._members.has(id)) throw new Error("Does not exist");
        self._members.delete(id);
      },

      /**
       * @param {string} id
       * @param {{name:  string?, role: ProjectRole}} info
       *
       * @returns {ProjectMember}
       */
      update(id, info) {
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
       * @param {string} id
       * @param {ProjectRole} role
       */
      create(id, role) {
        if (!self._invites.has(id)) {
          self._invites.set(id, { id, role });
        }
      },

      /**
       * @param {*} opts
       * @returns {{id: string, role: ProjectRole}[]}
       */
      getMany(opts) {
        return Array.from(self._invites.values());
      },
    };
  }

  /**
   * @returns {Project}
   */
  info() {
    return { id: this._id, name: this._name };
  }
}

export class ProjectsManagementDriver {
  _id = Date.now().toString();

  /** @type {Map<string, ProjectDriver>} */
  _projects = new Map();

  /**
   * @param {string} id
   *
   * @returns {Project | null}
   */
  get(id) {
    const project = this._projects.get(id);

    if (!project) return null;

    return project.info();
  }

  /**
   * @param {*} opts
   *
   * @returns {Project[]}
   */
  getMany(opts) {
    return Array.from(this._projects.values()).map((p) => p.info());
  }

  /**
   * @param {{ name: string }} opts
   *
   * @returns {Project}
   */
  create(opts) {
    const project = new ProjectDriver(opts.name);

    const info = project.info();

    this._projects.set(info.id, project);

    return info;
  }

  /**
   * @param {string} id
   * @param {{ name: string }} info
   *
   * @returns {Project}
   */
  update(id, info) {
    const project = this._projects.get(id);

    if (!project) throw new Error("Not found");

    // TODO: Project class need some kind of update method?
    project._name = info.name;

    return project.info();
  }

  /**
   * @param {string} id
   *
   * @returns {Project}
   */
  delete(id) {
    const project = this._projects.get(id);

    if (!project) throw new Error("Not found");

    this._projects.delete(id);

    return project.info();
  }

  get invite() {
    const self = this;

    return {
      /**
       * @param {string} id
       * @param {*} params
       */
      accept(id, params) {},

      /**
       * @param {string} id
       * @param {*} params
       */
      async decline(id, params) {},
    };
  }
}