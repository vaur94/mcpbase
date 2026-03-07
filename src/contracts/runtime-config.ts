import { z } from 'zod';

export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

export const baseServerSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
});

export const baseLoggingSchema = z.object({
  level: logLevelSchema,
  includeTimestamp: z.boolean(),
});

export const baseRuntimeConfigSchema = z.object({
  server: baseServerSchema,
  logging: baseLoggingSchema,
});

function deepPartialShape(shape: Record<string, z.ZodTypeAny>): Record<string, z.ZodTypeAny> {
  const result: Record<string, z.ZodTypeAny> = {};
  for (const [key, field] of Object.entries(shape)) {
    if (field instanceof z.ZodObject) {
      result[key] = z
        .object(deepPartialShape(field.shape as Record<string, z.ZodTypeAny>))
        .optional();
    } else {
      result[key] = field.optional();
    }
  }
  return result;
}

export function createRuntimeConfigSchema<T extends z.ZodRawShape>(
  extensionSchema: z.ZodObject<T>,
) {
  return baseRuntimeConfigSchema.extend(extensionSchema.shape);
}

export function createPartialRuntimeConfigSchema<T extends z.ZodRawShape>(
  extensionSchema: z.ZodObject<T>,
) {
  const fullSchema = createRuntimeConfigSchema(extensionSchema);
  const shape = fullSchema.shape as unknown as Record<string, z.ZodTypeAny>;
  return z.object(deepPartialShape(shape));
}

export type BaseRuntimeConfig<TExtras = unknown> = z.infer<typeof baseRuntimeConfigSchema> &
  TExtras;

const securityExtensionSchema = z.object({
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

export const runtimeConfigSchema = createRuntimeConfigSchema(securityExtensionSchema);
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
