# Troubleshooting

## Server Does Not Start

- Check if `npm run build` completed successfully
- Check if your Node.js version is `>=20.11.0`

## Tool List Returns Empty

- Relevant feature flags might be disabled
- Verify you are using the correct `dist/index.js` path in the host stdio command

## Logs Look Broken

- Make sure you are following stderr instead of stdout
- Do not use `console.log` in your derived project
