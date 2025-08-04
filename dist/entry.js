//@ts-check
/// <reference lib="esnext" />
/// <reference types="@cloudflare/workers-types" />

import worker from './worker.js';

export default {
  /** @param {Request} request @param {any} env @param {ExecutionContext} ctx @returns {Promise<Response>} */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // For HTML requests (root path), inject server data
    if (url.pathname === '/' && request.headers.get('accept')?.includes('text/html')) {
      try {
        // Get server data by calling worker
        ctx.html = "<!DOCTYPE html>\n<html>\n\n<head>\n    <title>Example App</title>\n    \n</head>\n\n<body>\n    <div id=\"app\">\n        <h1 id=\"title\">Loading...</h1>\n        <ul id=\"items\"></ul>\n        <p id=\"timestamp\"></p>\n    </div>\n\n    <script>\n        // Server data is immediately available in head - no DOMContentLoaded needed!\n        const dummyData = {\n            title: \"Dummy Data in Frontend\",\n            items: [\"Server Item 1\", \"Server Item 2\", \"Server Item 3\"],\n            timestamp: new Date().toISOString()\n        }\n        const data = window.serverData || dummyData;\n\n        if (data) {\n            // But we still need to wait for DOM to be ready to manipulate elements\n            if (document.readyState === 'loading') {\n                document.addEventListener('DOMContentLoaded', updateContent);\n            } else {\n                updateContent();\n            }\n        }\n\n        function updateContent() {\n            document.getElementById('title').textContent = data.title;\n            document.getElementById('timestamp').textContent = `Generated: ${data.timestamp}`;\n\n            const itemsList = document.getElementById('items');\n            itemsList.innerHTML = data.items.map(item => `<li>${item}</li>`).join('');\n        }\n\n        // Data is available immediately for other uses\n        if (data) {\n            console.log('Server data loaded:', data);\n            document.title = data.title; // Can set title immediately\n        }\n    </script>\n</body>\n\n</html>";

        const serverResponse = await worker.fetch(request, env, ctx);
        
        if (serverResponse.headers.get('content-type')?.includes('application/json')) {
          const serverData = await serverResponse.json();          
          // Inject server data in head
          let htmlContent = ctx.html.replace(
            '</head>',
            `  <script>window.serverData = ${JSON.stringify(serverData)};</script>
</head>`
          );
          
          return new Response(htmlContent, {
            headers: { 'content-type': 'text/html; charset=utf-8' }
          });
        }
        
        // If server doesn't return JSON, return server response as-is
        return serverResponse;
      } catch (error) {
        console.error('Server error:', error);
        return new Response('Server Error', { status: 500 });
      }
    }
    
    // For other requests, pass to worker
    return worker.fetch(request, env, ctx);
  },
};
