# Contributing

## Expected workflow

1. Make small, meaningful changes.
2. Do not open a pull request unless `npm run ci:check` passes.
3. Use conventional commit messages.
4. If you add a new tool, include its documentation and tests in the same pull request.

## Expectations

- no placeholders
- no TODO comments
- no untested changes in critical flows
- stdout is reserved for the MCP protocol only

## Review focus

- layer boundaries stay intact
- new config fields are documented
- security guard needs are handled correctly
- release and CI flows remain healthy
