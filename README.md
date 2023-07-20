# Mapeo Core Client Experiments

Experiments around combining [Mapeo Core Next](https://github.com/digidem/mapeo-core-next) and [`rpc-reflector`](https://github.com/gmaclennan/rpc-reflector/) to create an easy to use client for Mapeo.

## Usage

Desired API usage looks like this:

```js
// server.js
import { createServer } from 'mapeo-core-client'

// `channel` is an interface that adheres to rpc-reflector's requirements
// https://github.com/digidem/rpc-reflector#const--close---createserverapi-channel
const server = createServer(channel)

// You can add additional event listeners to the API instance `server.api`
// See `ApiEvents` in `types/api.d.ts`` for a list of available built-in events
server.api.on('sync-start', onSyncStart)

// You can emit custom events
server.api.emit('heartbeat', status)

// Eventually close the server using the `close` method
server.close()
```

```js
import { createClient } from "mapeo-core-client";

// `channel` is an interface that adheres to rpc-reflector's requirements
// https://github.com/digidem/rpc-reflector#const--close---createserverapi-channel
const client = createClient();

// You can add additional event listeners to the client
// See `ApiEvents` in `types/api.d.ts`` for a list of available built-in events
client.on("sync-start", onSyncStart);

// You can listen to custom events
client.on("heartbeat", (status) => {...});

// You have direct access to the server API
// Look Ma, no transport boilerplate!
const obs = await client.observation.create(...);
```

See additional examples in the [`examples`](./examples/) directory.

### Development

- The `mapeo-core` directory is a dummy implementation of `mapeo-core-next`. In reality, we'd be specifying `mapeo-core-next` as a dep for this project and then using that.

- Run examples using `node` e.g. `node examples/datatype.js`
