# Tool Conventions

## Naming

- Use `snake_case` for tool names
- Name should clearly describe its behavior

## Input Schema Rules

- All tools are defined with `zod` schema
- Avoid empty or ambiguous input fields
- Using explicit `description` is preferred

## Output Rules

- The `content` field must contain at least one text block
- If possible, provide machine-readable results with `structuredContent`
- Error cases should be normalized and not silently swallowed

## Metadata Rules

- `title` and `description` must be filled
- If a feature flag is needed, define `security.requiredFeature`
