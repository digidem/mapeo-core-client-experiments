// @ts-check
import reflector from "rpc-reflector";

import { Api } from "./api.js";

const { createClient, createServer } = reflector;

/**
 * @param {Parameters<typeof createClient>[0]} channel
 * @param {(api: Api) => Api} [extend]
 *
 * @returns {{api: Api, close: () => void}}
 */
function setupServer(channel, extend = (api) => api) {
  const api = extend(new Api());
  const { close } = createServer(api, channel);
  return { api, close };
}

/**
 * @template {Api} A
 *
 * @param {Parameters<typeof createClient>[0]} channel
 *
 * @returns {import('rpc-reflector').ClientApi<A>}
 */
function setupClient(channel) {
  return createClient(channel);
}

export { Api, setupClient, setupServer };
