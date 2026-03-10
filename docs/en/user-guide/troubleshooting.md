# Troubleshooting

Turkce surum: [docs/user-guide/troubleshooting.md](../../user-guide/troubleshooting.md)

## Server Does Not Start

- Check if `npm run build` completed successfully
- Check that your Node.js version is `>=22.14.0` and npm is `>=10.0.0`

## Tool List Returns Empty

- Relevant feature flags might be disabled
- Verify you are using the correct `dist/index.js` path in the host stdio command

## Logs Look Broken

- Make sure you are following stderr instead of stdout
- Do not use `console.log` in your derived project

Last updated: 2026-03-11
