# HTML Worker Builder

A build CLI that converts a single HTML file with embedded server script into a valid Cloudflare Worker structure.

## Features

- 🚀 Convert HTML with `<script id="server">` to Cloudflare Worker
- 📦 Generates complete Worker structure (worker.js, entry.js, wrangler.jsonc)
- 🔄 Automatic server data injection into HTML via `window.serverData`
- 📁 Static file serving for HTML without server script
- 🎯 Zero dependencies, simple CLI

## Usage

### Install

```bash
npm install
# or make executable
chmod +x build.js
```

### Build

```bash
node build.js input.html [output-dir]
```

### Example

```bash
node build.js example.html ./dist
cd dist
npx wrangler dev
```

## HTML Structure

Your HTML file can include a server script:

```html
<html>
  <head>
    <script id="server">
      export default {
        async fetch(request, env, ctx) {
          // Server logic here
          return new Response(JSON.stringify({ data: "hello" }), {
            headers: { "content-type": "application/json" },
          });
        },
      };
    </script>
  </head>
  <body>
    <div id="app">Loading...</div>
    <script>
      // Access server data via window.serverData
      console.log(window.serverData);
    </script>
  </body>
</html>
```

## Generated Structure

### With Server Script

```
dist/
├── entry.js          # Main worker entry point
├── worker.js          # Extracted server code
├── index.html         # Clean HTML template
└── wrangler.jsonc     # Worker configuration
```

### Static Only

```
dist/
├── entry.js          # Basic static handler
├── public/
│   └── index.html    # Static HTML file
└── wrangler.jsonc    # Worker configuration
```

## How It Works

1. **Parse**: Extracts `<script id="server">` from HTML
2. **Generate**: Creates worker.js with server code
3. **Wrap**: entry.js handles HTML serving and data injection
4. **Inject**: Server JSON data becomes `window.serverData` in HTML
5. **Deploy**: Use `wrangler deploy` to publish

## Server Data Injection

When your server script returns JSON for HTML requests, it gets injected into the HTML as `window.serverData`, allowing for server-side rendering-like behavior with client-side hydration.
