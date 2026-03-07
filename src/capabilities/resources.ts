import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  ReadResourceCallback,
  ReadResourceTemplateCallback,
  ResourceMetadata,
} from '@modelcontextprotocol/sdk/server/mcp.js';

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface ResourceDefinition {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly handler: ReadResourceCallback;
}

export interface ResourceTemplateDefinition {
  readonly uriTemplate: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
  readonly handler: ReadResourceTemplateCallback;
}

function buildMetadata(
  description: string | undefined,
  mimeType: string | undefined,
): ResourceMetadata | undefined {
  if (description === undefined && mimeType === undefined) {
    return undefined;
  }

  const metadata: ResourceMetadata = {};
  if (description !== undefined) {
    metadata.description = description;
  }
  if (mimeType !== undefined) {
    metadata.mimeType = mimeType;
  }
  return metadata;
}

export function registerResources(server: McpServer, resources: ResourceDefinition[]): void {
  for (const resource of resources) {
    const metadata = buildMetadata(resource.description, resource.mimeType);

    if (metadata) {
      server.resource(resource.name, resource.uri, metadata, resource.handler);
    } else {
      server.resource(resource.name, resource.uri, resource.handler);
    }
  }
}

export function registerResourceTemplates(
  server: McpServer,
  templates: ResourceTemplateDefinition[],
): void {
  for (const template of templates) {
    const resourceTemplate = new ResourceTemplate(template.uriTemplate, { list: undefined });
    const metadata = buildMetadata(template.description, template.mimeType);

    if (metadata) {
      server.resource(template.name, resourceTemplate, metadata, template.handler);
    } else {
      server.resource(template.name, resourceTemplate, template.handler);
    }
  }
}
