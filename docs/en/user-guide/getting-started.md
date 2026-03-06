# Getting Started

## Initial Setup

```bash
npm install
npm run build
node dist/index.js --config examples/mcpbase.config.json
```

## First Use

- Define the stdio command in your host tool
- Verify the server identity with `server_info`
- Check that your `tools/call` flow works with `text_transform`

## Next Steps

Start replacing the example tools with your domain's tools at `src/application/example-tools.ts`.
