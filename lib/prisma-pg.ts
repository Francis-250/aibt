import dns from "node:dns";
import net from "node:net";
import type { PoolConfig } from "pg";

function normalizeDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

function createIpv4StreamFactory(databaseHost: string) {
  return () => {
    const socket = new net.Socket();
    const socketWithConnect = socket as unknown as {
      connect: (...args: unknown[]) => net.Socket;
    };
    const originalConnect = socketWithConnect.connect.bind(socket);

    socketWithConnect.connect = (...args: unknown[]) => {
      const [port, host] = args;

      if (typeof port === "number" && host === databaseHost) {
        dns.lookup(databaseHost, { family: 4 }, (error, address) => {
          if (error) {
            socket.destroy(error);
            return;
          }

          originalConnect(port, address);
        });

        return socket;
      }

      return originalConnect(...(args as Parameters<typeof socket.connect>));
    };

    return socket;
  };
}

export function createPrismaPgConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const normalizedConnectionString = normalizeDatabaseUrl(connectionString);
  const databaseHost = new URL(normalizedConnectionString).hostname;

  return {
    connectionString: normalizedConnectionString,
    connectionTimeoutMillis: 10_000,
    stream: createIpv4StreamFactory(databaseHost),
  };
}
