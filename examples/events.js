// @ts-check
import DuplexPair from "native-duplexpair";

import { setupServer, setupClient } from "../index.js";

console.log("\nEVENTS EXAMPLE:\n");

// 1. Setup server + client
const { socket1, socket2 } = new DuplexPair({ objectMode: true });

const { api, close } = setupServer(socket1);
const client = setupClient(socket2);

// 2. Add listeners to server
api.once("discovery-start", () => {
  const invite = {
    id: Date.now().toString(),
    project: api.$project.info(),
    from: {
      id: "abc123",
      name: null,
    },
    role: "member",
  };

  console.log("SERVER: DISCOVERY STARTED, SENDING INVITE", invite);

  // For demo purposes
  api.emit("invite-received", invite);
});

api.once("invite-accepted", (invite) => {
  console.log("SERVER: CLIENT ACCEPTED INVITE, CLOSING", invite);
  close();
  console.log("DONE");
  process.exit(0);
});

// 3. Add listeners to client
client.$sync.setDiscovery(["lan"]).then(() => {
  // For demo purposes
  api.emit("discovery-start");
});

client.once("invite-received", (invite) => {
  console.log("CLIENT: RECEIVED INVITE, ACCEPTING", invite);
  client.$projectsManagement.invite.accept(invite.id, {}).then(() => {
    // For demo purposes
    api.emit("invite-accepted", invite);
  });
});
