# HTML Workers

[![](https://b.lmpify.com/Quickstart)](https://letmeprompt.com/?q=https://uithub.com/janwilmake/html-workers)

A build CLI that converts a single HTML file with embedded server script into a valid Cloudflare Worker structure.

## Features

- 🚀 Convert HTML with `<script id="server">` to Cloudflare Worker
- 📦 Generates complete Worker structure (worker.js, entry.js, wrangler.jsonc)
- 🔄 Automatic server data injection into HTML via `window.serverData`
- 📁 Static file serving for HTML without server script
- 🎯 Zero dependencies, simple CLI

[Discuss](https://x.com/janwilmake/status/1952400034391007432)

## Usage

### Install

```bash
npm install html-worker
# or run directly
npx html-worker
```

### Build

```bash
npx html-worker input.html [output-dir]
# or if installed locally
node build.js input.html [output-dir]
```

### Example

```bash
npx html-worker example.html ./dist
cd dist
npx wrangler dev
```

**Note:** You'll need a `wrangler.jsonc` configuration file in addition to your HTML file. The build process generates the worker files, but Wrangler needs its configuration to deploy and run the worker.

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

## Best Practices

### Local Development with file://

To enable development by opening HTML files directly in the browser (file:// protocol), always provide fallback dummy data:

```html
<script>
  // Dummy data for file:// development
  const dummyData = {
    title: "Local Development Mode",
    items: ["Item 1", "Item 2", "Item 3"],
    timestamp: new Date().toISOString(),
  };

  // Use server data when available, fallback to dummy data
  const data = window.serverData || dummyData;

  // Your app logic using 'data'
  console.log("Using data:", data);
</script>
```

This allows you to:

- Open the HTML file directly in a browser during development
- Test your frontend logic without running the worker
- Maintain a consistent data structure between development and production

### Server Response Patterns

**Preferred: Return JSON at root '/'**

For most use cases, return JSON data that gets automatically injected as `window.serverData`:

```html
<script id="server">
  export default {
    async fetch(request, env, ctx) {
      // Return JSON - gets injected into HTML automatically
      return new Response(
        JSON.stringify({
          title: "Dynamic Title",
          data: await fetchSomeData(),
        }),
        {
          headers: { "content-type": "application/json" },
        }
      );
    },
  };
</script>
```

**Advanced: Custom HTML Templating**

If you need server-side templating, you can modify and return `ctx.html` directly:

```html
<script id="server">
  export default {
    async fetch(request, env, ctx) {
      const data = await fetchSomeData();

      // Modify the HTML directly for templating
      let html = ctx.html.replace("{{TITLE}}", data.title);
      html = html.replace("{{CONTENT}}", data.content);

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  };
</script>
```

**Recommendation:** Use JSON injection for most cases as it provides better separation between server logic and client-side hydration. Only use HTML templating when you need SEO-critical content or complex server-side rendering.

## Generated Structure

### With Server Script

```
dist/
├── entry.js          # Main worker entry point
├── worker.js          # Extracted server code
└── wrangler.jsonc     # Worker configuration (required)
```

### Static Only

```
dist/
├── entry.js          # Basic static handler
├── public/
│   └── index.html    # Static HTML file
└── wrangler.jsonc    # Worker configuration (required)
```

## How It Works

1. **Parse**: Extracts `<script id="server">` from HTML
2. **Generate**: Creates worker.js with server code
3. **Wrap**: entry.js handles HTML serving and data injection
4. **Inject**: Server JSON data becomes `window.serverData` in HTML
5. **Deploy**: Use `wrangler deploy` to publish

## Server Data Injection

When your server script returns JSON for HTML requests, it gets injected into the HTML as `window.serverData`, allowing for server-side rendering-like behavior with client-side hydration.

## Requirements

- Node.js (for building)
- `wrangler.jsonc` configuration file (for deployment)
- Cloudflare account (for deployment)
