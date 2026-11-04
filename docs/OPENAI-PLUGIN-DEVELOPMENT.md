# OpenAI Plugin Development for OCode.js

OCode.js integrations for ChatGPT and Codex use a combination of **Skills**, **MCP tools**, and optional user interfaces. This guide describes the repository's recommended architecture; it does not describe the retired legacy ChatGPT Plugins manifest/API.

## 1. Choose the integration surface

| Component | Responsibility | When to use |
|---|---|---|
| Skill | Instructions, workflow, guardrails and domain knowledge | When the assistant needs repeatable task guidance |
| MCP server | Authenticated tools and access to external systems | When the assistant must read data or perform actions |
| App UI | Forms, tables, previews and interactive workflows | When a visual surface materially improves the task |

Do not add an MCP server or UI when a Skill alone is sufficient.

## 2. Define the contract before implementation

For each tool, document:

- A stable, namespaced tool name.
- A concise description that states what the tool does.
- A JSON Schema input contract with required fields, bounds and enums.
- The output shape, error behavior and side effects.
- The authorization scope required to call it.

Keep tools narrow. Prefer separate read and write tools; require explicit confirmation for destructive or externally visible actions.

## 3. Implement the MCP server

Use a supported MCP transport and implement protocol initialization, capability negotiation and tool discovery. At minimum, verify:

1. The server starts and exposes its health endpoint.
2. `initialize` returns the expected protocol version and capabilities.
3. `tools/list` returns stable names and valid input schemas.
4. `tools/call` validates input, enforces authorization and returns structured results.
5. Errors are safe and actionable; secrets and internal stack traces are never returned.

Keep the server stateless where practical. Add request timeouts, bounded payloads, rate limits and structured audit events.

## 4. Authentication and data protection

- Use OAuth 2.1 or the host-supported authorization flow when user identity is required.
- Validate issuer, audience, signature, expiry and scopes on the server.
- Store credentials only in server-side secret storage; never embed them in browser code, Skills, logs or repository files.
- Apply least privilege and authorize each operation against the current user.
- Validate all tool arguments and treat remote content as untrusted data.
- Protect outbound requests against SSRF; allowlist destinations where appropriate.
- Avoid collecting or retaining data that is not needed for the requested operation.

## 5. Add a Skill

A Skill should explain when it applies, the steps to follow, required permissions, failure handling and when to ask the user for confirmation. Keep secrets and user-specific credentials out of the Skill. Link to the relevant tool contract and tests rather than duplicating implementation details.

## 6. Build an optional UI

Add UI only when it improves the workflow—for example, to show structured results, collect multiple related inputs or preview a change. The UI must not bypass server-side authorization. Clearly distinguish preview from committed actions and provide accessible labels, keyboard support and useful error states.

## 7. Test and release

Before release:

- Unit-test tool input validation, authorization and error paths.
- Test MCP `initialize`, `tools/list` and representative `tools/call` requests.
- Test unauthorized, expired-token, malformed-input and timeout cases.
- Run the repository CI and dependency/security scans.
- Validate the Skill instructions against the actual tool schema.
- Verify the Preview deployment before requesting a Production release.

Keep Production deployment behind an explicit release approval. Never use a successful build as proof that external credentials or integrations are configured.

## Official references

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [OpenAI API: remote MCP tools](https://developers.openai.com/api/docs/guides/tools-remote-mcp)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification)
