import { z } from 'zod';

export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

export const runtimeConfigSchema = z.object({
  server: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
  }),
  logging: z.object({
    level: logLevelSchema,
    includeTimestamp: z.boolean(),
  }),
  security: z.object({
    features: z.object({
      serverInfoTool: z.boolean(),
      textTransformTool: z.boolean(),
    }),
    commands: z.object({
      allowed: z.array(z.string().min(1)),
    }),
    paths: z.object({
      allowed: z.array(z.string().min(1)),
    }),
  }),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const partialRuntimeConfigSchema = z.object({
  server: runtimeConfigSchema.shape.server.partial().optional(),
  logging: runtimeConfigSchema.shape.logging.partial().optional(),
  security: z
    .object({
      features: runtimeConfigSchema.shape.security.shape.features.partial().optional(),
      commands: runtimeConfigSchema.shape.security.shape.commands.partial().optional(),
      paths: runtimeConfigSchema.shape.security.shape.paths.partial().optional(),
    })
    .partial()
    .optional(),
});

export type PartialRuntimeConfig = z.infer<typeof partialRuntimeConfigSchema>;
