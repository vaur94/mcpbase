export type ToolState = 'enabled' | 'disabled' | 'hidden';

export interface ToolStateEntry {
  readonly name: string;
  readonly state: ToolState;
  readonly reason?: string;
}

export interface ToolStateManager {
  getState(toolName: string): ToolState;
  setState(toolName: string, state: ToolState, reason?: string): void;
  listStates(): readonly ToolStateEntry[];
  isCallable(toolName: string): boolean;
  isVisible(toolName: string): boolean;
  onChange(listener: (toolName: string, state: ToolState) => void): void;
}

export function createToolStateManager(toolNames: string[]): ToolStateManager {
  const entries = new Map<string, ToolStateEntry>();
  const listeners = new Set<(toolName: string, state: ToolState) => void>();

  for (const toolName of toolNames) {
    entries.set(toolName, {
      name: toolName,
      state: 'enabled',
    });
  }

  return {
    getState(toolName) {
      return entries.get(toolName)?.state ?? 'enabled';
    },
    setState(toolName, state, reason) {
      entries.set(toolName, {
        name: toolName,
        state,
        ...(reason !== undefined ? { reason } : {}),
      });

      for (const listener of listeners) {
        listener(toolName, state);
      }
    },
    listStates() {
      return [...entries.values()];
    },
    isCallable(toolName) {
      return (entries.get(toolName)?.state ?? 'enabled') === 'enabled';
    },
    isVisible(toolName) {
      return (entries.get(toolName)?.state ?? 'enabled') === 'enabled';
    },
    onChange(listener) {
      listeners.add(listener);
    },
  };
}
