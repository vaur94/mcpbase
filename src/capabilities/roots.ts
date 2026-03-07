import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RootsListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

export interface Root {
  readonly uri: string;
  readonly name?: string;
}

export type RootsChangeHandler = (roots: Root[]) => void | Promise<void>;

export interface RootsHandler {
  onRootsChanged(handler: RootsChangeHandler): void;
  listRoots(): Promise<Root[]>;
}

export function createRootsHandler(server: McpServer): RootsHandler {
  const handlers: RootsChangeHandler[] = [];

  server.server.setNotificationHandler(RootsListChangedNotificationSchema, async () => {
    const result = await server.server.listRoots();
    const roots: Root[] = result.roots.map((r) => ({
      uri: r.uri,
      name: r.name,
    }));

    for (const handler of handlers) {
      await handler(roots);
    }
  });

  return {
    onRootsChanged(handler: RootsChangeHandler): void {
      handlers.push(handler);
    },

    async listRoots(): Promise<Root[]> {
      const result = await server.server.listRoots();
      return result.roots.map((r) => ({
        uri: r.uri,
        name: r.name,
      }));
    },
  };
}
