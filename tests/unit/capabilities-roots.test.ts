import { describe, expect, it, vi } from 'vitest';

import type { Root, RootsChangeHandler, RootsHandler } from '../../src/capabilities/roots.js';
import { createRootsHandler } from '../../src/capabilities/roots.js';

describe('Root arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const root: Root = {
      uri: 'file:///home/user/projects',
    };

    expect(root.uri).toBe('file:///home/user/projects');
    expect(root.name).toBeUndefined();
  });

  it('opsiyonel name alanini kabul eder', () => {
    const root: Root = {
      uri: 'file:///home/user/documents',
      name: 'Belge Klasoru',
    };

    expect(root.uri).toBe('file:///home/user/documents');
    expect(root.name).toBe('Belge Klasoru');
  });
});

describe('RootsChangeHandler tipi', () => {
  it('fonksiyon tipi olarak kabul edilir', () => {
    const handler: RootsChangeHandler = (roots) => {
      console.log('Roots changed:', roots.length);
    };

    expect(handler).toBeTypeOf('function');
  });

  it('async fonksiyon olarak kabul edilir', async () => {
    const handler: RootsChangeHandler = async (roots) => {
      await Promise.resolve();
    };

    const result = handler([]);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('createRootsHandler', () => {
  it('RootsHandler olusturur', () => {
    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);

    expect(handler).toBeDefined();
    expect(handler.listRoots).toBeDefined();
    expect(handler.onRootsChanged).toBeDefined();
  });

  it('listRoots ile mevcut kokleri listeler', async () => {
    const mockRoots = [
      { uri: 'file:///home/user/projects', name: 'Projeler' },
      { uri: 'file:///home/user/documents', name: 'Belge Klasoru' },
    ];

    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: mockRoots }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);
    const roots = await handler.listRoots();

    expect(roots).toEqual(mockRoots);
    expect(mockServer.server.listRoots).toHaveBeenCalledOnce();
  });

  it('listRoots bos dizi dondurur', async () => {
    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);
    const roots = await handler.listRoots();

    expect(roots).toEqual([]);
  });

  it('onRootsChanged ile degisim handler i kaydeder', () => {
    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);
    const changeHandler = vi.fn();

    handler.onRootsChanged(changeHandler);

    expect(mockServer.server.setNotificationHandler).toHaveBeenCalledOnce();
  });

  it('birden fazla roots change handler kaydedebilir', () => {
    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    handler.onRootsChanged(handler1);
    handler.onRootsChanged(handler2);

    // Notification handler is registered once, then dispatches to all callbacks
    expect(mockServer.server.setNotificationHandler).toHaveBeenCalledOnce();
  });
});

describe('RootsHandler listRoots', () => {
  it('promise dondurur', async () => {
    const mockServer = {
      server: {
        listRoots: vi.fn().mockResolvedValue({ roots: [] }),
        setNotificationHandler: vi.fn(),
      },
    };

    const handler = createRootsHandler(mockServer as never);
    const result = handler.listRoots();

    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});
