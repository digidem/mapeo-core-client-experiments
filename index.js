// @ts-check
import reflector from "rpc-reflector";

import { Api } from "./api.js";

/**
 * @param {Parameters<typeof reflector.createServer>[1]} channel
 *
 * @returns {{api: Api, close: () => void}}
 */
function createServer(channel) {
  const api = new Api();
  const { close } = reflector.createServer(api, channel);
  return { api, close };
}

/**
 * @param {Parameters<typeof reflector.createClient>[0]} channel
 *
 * @returns {import('rpc-reflector').ClientApi<Api>}
 */
function createClient(channel) {
  return reflector.createClient(channel);
}

export { Api, createClient, createServer };
