import dns from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";

dns.setDefaultResultOrder("ipv4first");

setGlobalDispatcher(
  new Agent({
    connect: {
      lookup(hostname, options, callback) {
        return dns.lookup(hostname, { ...options, family: 4 }, callback);
      },
    },
  }),
);
