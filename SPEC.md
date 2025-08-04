RULES:
https://uithub.com/janwilmake/gists/tree/main/named-codeblocks.md
https://flaredream.com/system.md

PROMPT:

```html
<html>
  <head>
    <script id="server">
      // NICE way of doing php-like full-stack HTML+JS on cloudflare workers
      //
      // this script would be removed from the final html and would contain the backend worker code.
      // it should have access to the HTML at variable `html`
      // if you don't provide this script, the html would be served as static file at expected path
      // if you DO, it should not be served as static file, it should only run the server. for the root path accept text/html it should add JSON server-data to this html and return that.
      // the server script should have export default {  fetch } syntax.
    </script>
  </head>

  <body>
    <div>yo</div>
  </body>
</html>
```

can you create a build cli that can convert a single html file into valid worker code with worker.js, entry.js, wrangler.json, and index.html? the entry imports worker.js from the html
