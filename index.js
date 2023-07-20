// @ts-check
import reflector from "rpc-reflector";

import { Api } from "./api.js";

const { createClient, createServer } = reflector;

/**
 * @param {Parameters<typeof createClient>[0]} channel
 *
 * @returns {{api: Api, close: () => void}}
 */
function setupServer(channel, ) {
  const api = new Api()
  const { close } = createServer(api, channel);
  return { api, close };
}

/**
 * @param {Parameters<typeof createClient>[0]} channel
 *
 * @returns {import('rpc-reflector').ClientApi<Api>}
 */
function setupClient(channel) {
  return createClient(channel);
}

export { Api, setupClient, setupServer };
