🧵 HTML-First Full-Stack Serverless Thread

**1/6** 🤔 Hot take: React is overkill for 90% of full-stack serverless apps.

Most of my Cloudflare Workers just need to:

- Serve some HTML with dynamic data
- Handle a few API endpoints
- Maybe store stuff in KV/D1

But putting HTML in JavaScript template literals? Ugly as hell.

**2/6** The current options all suck:

- React/Next.js: Too heavy, too complex for simple apps
- Template engines: Another dependency, another build step
- HTML in JS strings: Makes me want to cry
- Separate HTML files: Deployment becomes annoying

There's gotta be a better way...

**3/6** What if we could write full-stack apps like this? 👇

```html
<html>
  <head>
    <script id="server">
      export default {
        async fetch(request, env, ctx) {
          return new Response(
            JSON.stringify({
              title: "Dynamic Title",
              items: ["Item 1", "Item 2"],
            }),
            {
              headers: { "content-type": "application/json" },
            }
          );
        },
      };
    </script>
  </head>
  <body>
    <h1 id="title">Loading...</h1>
    <script>
      const data = window.serverData || fallbackData;
      document.getElementById("title").textContent = data.title;
    </script>
  </body>
</html>
```

**4/6** The magic:

- Server script gets extracted and becomes your worker
- HTML gets served with server data auto-injected as `window.serverData`
- Full TypeScript support with Cloudflare Workers types
- Works offline for development (just open the HTML file!)
- Single file → full-stack app

**5/6** Perfect for:

- Personal tools and dashboards
- Simple SaaS apps
- Rapid prototyping
- Demos and experiments
- When you want to ship fast without framework overhead

Built a working todo app in 600 lines of a single HTML file. Server + client + styles + logic.

**6/6** I'm calling it "HTML Workers" - like PHP but for the modern serverless era.

Built a prototype and would love feedback: https://github.com/janwilmake/html-workers

Would you use an HTML-first framework for full-stack serverless? Or am I crazy? 🤪

#CloudflareWorkers #WebDev #Serverless #HTML
