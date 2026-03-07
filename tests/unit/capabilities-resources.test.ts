import { describe, expect, it, vi } from 'vitest';

import type {
  ResourceDefinition,
  ResourceTemplateDefinition,
} from '../../src/capabilities/resources.js';
import { registerResources, registerResourceTemplates } from '../../src/capabilities/resources.js';

function createMockServer() {
  return {
    resource: vi.fn(),
  };
}

describe('ResourceDefinition arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const definition: ResourceDefinition = {
      uri: 'file:///logs/app.log',
      name: 'Uygulama Gunlugu',
      handler: () => ({ contents: [] }),
    };

    expect(definition.uri).toBe('file:///logs/app.log');
    expect(definition.name).toBe('Uygulama Gunlugu');
    expect(definition.handler).toBeTypeOf('function');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const definition: ResourceDefinition = {
      uri: 'file:///data/config.json',
      name: 'Yapilandirma',
      description: 'Uygulama yapilandirma dosyasi',
      mimeType: 'application/json',
      handler: () => ({ contents: [] }),
    };

    expect(definition.description).toBe('Uygulama yapilandirma dosyasi');
    expect(definition.mimeType).toBe('application/json');
  });
});

describe('ResourceTemplateDefinition arayuzu', () => {
  it('zorunlu alanlari kabul eder', () => {
    const definition: ResourceTemplateDefinition = {
      uriTemplate: 'file:///logs/{name}.log',
      name: 'Gunluk Sablonu',
      handler: () => ({ contents: [] }),
    };

    expect(definition.uriTemplate).toBe('file:///logs/{name}.log');
    expect(definition.name).toBe('Gunluk Sablonu');
    expect(definition.handler).toBeTypeOf('function');
  });

  it('opsiyonel alanlari kabul eder', () => {
    const definition: ResourceTemplateDefinition = {
      uriTemplate: 'file:///data/{id}.json',
      name: 'Veri Sablonu',
      description: 'Veri dosyalari sablonu',
      mimeType: 'application/json',
      handler: () => ({ contents: [] }),
    };

    expect(definition.description).toBe('Veri dosyalari sablonu');
    expect(definition.mimeType).toBe('application/json');
  });
});

describe('registerResources', () => {
  it('tek bir statik kaynak kaydeder', () => {
    const server = createMockServer();
    const handler = vi.fn(() => ({ contents: [] }));

    const resources: ResourceDefinition[] = [
      {
        uri: 'file:///logs/app.log',
        name: 'Uygulama Gunlugu',
        handler,
      },
    ];

    registerResources(server as never, resources);

    expect(server.resource).toHaveBeenCalledOnce();
    expect(server.resource).toHaveBeenCalledWith(
      'Uygulama Gunlugu',
      'file:///logs/app.log',
      handler,
    );
  });

  it('metadata ile statik kaynak kaydeder', () => {
    const server = createMockServer();
    const handler = vi.fn(() => ({ contents: [] }));

    const resources: ResourceDefinition[] = [
      {
        uri: 'file:///data/config.json',
        name: 'Yapilandirma',
        description: 'Uygulama yapilandirmasi',
        mimeType: 'application/json',
        handler,
      },
    ];

    registerResources(server as never, resources);

    expect(server.resource).toHaveBeenCalledOnce();
    expect(server.resource).toHaveBeenCalledWith(
      'Yapilandirma',
      'file:///data/config.json',
      { description: 'Uygulama yapilandirmasi', mimeType: 'application/json' },
      handler,
    );
  });

  it('birden fazla kaynak kaydeder', () => {
    const server = createMockServer();

    const resources: ResourceDefinition[] = [
      {
        uri: 'file:///a.txt',
        name: 'A',
        handler: () => ({ contents: [] }),
      },
      {
        uri: 'file:///b.txt',
        name: 'B',
        description: 'B dosyasi',
        handler: () => ({ contents: [] }),
      },
    ];

    registerResources(server as never, resources);

    expect(server.resource).toHaveBeenCalledTimes(2);
  });

  it('bos dizi ile hata vermez', () => {
    const server = createMockServer();

    registerResources(server as never, []);

    expect(server.resource).not.toHaveBeenCalled();
  });
});

describe('registerResourceTemplates', () => {
  it('tek bir sablon kaynak kaydeder', () => {
    const server = createMockServer();
    const handler = vi.fn(() => ({ contents: [] }));

    const templates: ResourceTemplateDefinition[] = [
      {
        uriTemplate: 'file:///logs/{name}.log',
        name: 'Gunluk Sablonu',
        handler,
      },
    ];

    registerResourceTemplates(server as never, templates);

    expect(server.resource).toHaveBeenCalledOnce();
    const call = server.resource.mock.calls[0]!;
    expect(call[0]).toBe('Gunluk Sablonu');
    expect(call[1]).toBeDefined();
    expect(call[2]).toBe(handler);
  });

  it('metadata ile sablon kaynak kaydeder', () => {
    const server = createMockServer();
    const handler = vi.fn(() => ({ contents: [] }));

    const templates: ResourceTemplateDefinition[] = [
      {
        uriTemplate: 'file:///data/{id}.json',
        name: 'Veri Sablonu',
        description: 'Veri dosyalari',
        mimeType: 'application/json',
        handler,
      },
    ];

    registerResourceTemplates(server as never, templates);

    expect(server.resource).toHaveBeenCalledOnce();
    const call = server.resource.mock.calls[0]!;
    expect(call[0]).toBe('Veri Sablonu');
    expect(call[1]).toBeDefined();
    expect(call[2]).toEqual({ description: 'Veri dosyalari', mimeType: 'application/json' });
    expect(call[3]).toBe(handler);
  });

  it('birden fazla sablon kaydeder', () => {
    const server = createMockServer();

    const templates: ResourceTemplateDefinition[] = [
      {
        uriTemplate: 'file:///a/{id}.txt',
        name: 'A',
        handler: () => ({ contents: [] }),
      },
      {
        uriTemplate: 'file:///b/{id}.txt',
        name: 'B',
        handler: () => ({ contents: [] }),
      },
    ];

    registerResourceTemplates(server as never, templates);

    expect(server.resource).toHaveBeenCalledTimes(2);
  });

  it('bos dizi ile hata vermez', () => {
    const server = createMockServer();

    registerResourceTemplates(server as never, []);

    expect(server.resource).not.toHaveBeenCalled();
  });
});
