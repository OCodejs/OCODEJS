# OCodeJS managed shared UI assets

These files are a managed, opt-in payload from [OCodeJS Central](https://github.com/OCodejs/ocodejs.github.io).

## Modules
- `design-system/tokens.css`: semantic design tokens.
- `shared-ui/ui.css`: accessible, square-corner UI primitives.
- `navigation/navigation.js`: central navigation contract.

## Adoption
These assets are staged but are not automatically imported into the application entrypoint. Integrate them only after app-specific review:
1. Load design-system tokens before shared-ui CSS.
2. Import the navigation module only in a client/browser entrypoint.
3. Preserve existing routes, auth provider, API, database and runtime.
4. Account link is a source/status link only. Authentication is not verified and no login/session is implemented by these assets.

Do not place secrets, OAuth credentials, session tokens, or environment files here.
