// @ts-check
import reflector from "rpc-reflector";

import { Api } from "./api.js";

const { createClient, createServer } = reflector;

/**
 * @template A
 *
 * @typedef {import('rpc-reflector/dist/client.js').ClientApi<A>} ClientApi
 */

/**
 * @param {import('stream').Duplex} channel
 * @param {(api: Api) => Api} [extend]
 *
 * @returns {{api: Api, close: () => void}}
 */
export function setupServer(channel, extend = (api) => api) {
  const api = extend(new Api());
  const { close } = createServer(api, channel);
  return { api, close };
}

/**
 * @template {Api} A
 *
 * @param {import('stream').Duplex} channel
 *
 * @returns {ClientApi<A>}
 */
export function setupClient(channel) {
  return createClient(channel);
}
