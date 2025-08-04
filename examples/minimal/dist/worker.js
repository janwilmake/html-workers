// Server code with access to 'ctx.html' variable
        export default {
            async fetch(request, env, ctx) {
                const url = new URL(request.url);

                if (url.pathname === '/api/data') {
                    return new Response(JSON.stringify({
                        message: "Hello from server!",
                        timestamp: new Date().toISOString()
                    }), {
                        headers: { 'content-type': 'application/json' }
                    });
                }



                return new Response(JSON.stringify({
                    title: "Dynamic Title from Server :)",
                    items: ["Server Item 1", "Server Item 2", "Server Item 3..."],
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'content-type': 'application/json' }
                });

            }
        };