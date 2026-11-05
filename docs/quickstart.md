# OCode.js Quick Start

OCode.js (ocode-js) is a small, dependency-free JavaScript and TypeScript utility library. It is distributed as ECMAScript modules (ESM) and includes TypeScript declarations.

> **Release status:** Version 0.1.0 is prepared in this repository but is not yet available from the public npm registry. Do not expect npm install ocode-js to work until the release workflow has published it.

## Requirements

- Node.js 18 or newer
- npm

## Install after the npm release

Once ocode-js@0.1.0 is visible in the npm registry:

~~~sh
npm install ocode-js
~~~

## Use the library

~~~ts
import { slugify, retry, withQuery } from "ocode-js";
import { deepMerge } from "ocode-js/object";
import { fetchJson } from "ocode-js/http";

const slug = slugify("Hello OCode.js");

const url = withQuery("https://example.com/search", {
  q: "OCode.js",
  page: 1
});

const config = deepMerge(
  { server: { port: 3000 }, features: { cache: true } },
  { server: { host: "127.0.0.1" } }
);

const data = await fetchJson("https://example.com/api/status");
~~~

## Available import paths

| Import | Module |
| --- | --- |
| ocode-js | Core exports from all modules |
| ocode-js/string | String helpers |
| ocode-js/object | Object helpers |
| ocode-js/async | Async helpers |
| ocode-js/url | URL and query-string helpers |
| ocode-js/validation | Validation helpers |
| ocode-js/http | Fetch and JSON request helpers |
| ocode-js/browser | Browser storage helpers |
| ocode-js/env | Environment variable readers |
| ocode-js/logger | Configurable logger |

See the [API reference](API.md) for function behavior and examples.

## Work from a source checkout

Until the npm package is published, contributors can build and test the repository directly:

~~~sh
git clone https://github.com/OCodejs/OCodejs.git
cd OCodejs
npm ci
npm test
~~~

Build output and TypeScript declaration files are generated in dist/.

## Runtime notes

- OCode.js has no runtime dependencies; TypeScript is a development dependency used to compile the source.
- The package is ESM. Use import in Node.js and compatible bundlers.
- Browser helpers guard access to localStorage and can safely be imported during server-side rendering.
- escapeHtml escapes common HTML characters; it is not a general-purpose HTML sanitizer.
- Environment helpers read process.env when available, but accept an explicit source object for tests and non-Node runtimes.

## Next steps

- [API reference](API.md)
- [Terminal and contributor workflow](TERMINAL.md)
- [Release checklist](RELEASE-CHECKLIST-v0.1.0.md)
- [Contributing guide](../CONTRIBUTING.md)
