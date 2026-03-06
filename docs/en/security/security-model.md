# Security Model

## Deny-by-default

`mcpbase` aims to prevent risky behaviors from being used without explicit permission. Therefore, feature flag, command allowlist, and path allowlist helpers are provided together.

## Guard Philosophy

- Feature flag: Is a tool or capability enabled
- Command restriction: Which commands are allowed
- Path restriction: Under which root can work be performed

## Safe Extension Rules

- If adding shell or file tools, guards are mandatory
- New config fields are not added without documentation
- Do not silently continue on error
- Logs flow only over stderr
