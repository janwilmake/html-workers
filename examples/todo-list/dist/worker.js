export default {
            async fetch(request, env, ctx) {
                const url = new URL(request.url);

                // Initialize todos in KV storage if not exists
                const TODOS_KEY = 'todos';

                // Handle API endpoints
                if (url.pathname === '/api/todos') {
                    if (request.method === 'GET') {
                        try {
                            const todosJson = await env.TODOS?.get(TODOS_KEY);
                            const todos = todosJson ? JSON.parse(todosJson) : [];
                            return new Response(JSON.stringify(todos), {
                                headers: { 'content-type': 'application/json' }
                            });
                        } catch (error) {
                            return new Response(JSON.stringify([]), {
                                headers: { 'content-type': 'application/json' }
                            });
                        }
                    }

                    if (request.method === 'POST') {
                        try {
                            const { text } = await request.json();
                            if (!text?.trim()) {
                                return new Response('Invalid todo text', { status: 400 });
                            }

                            const todosJson = await env.TODOS?.get(TODOS_KEY);
                            const todos = todosJson ? JSON.parse(todosJson) : [];

                            const newTodo = {
                                id: Date.now().toString(),
                                text: text.trim(),
                                completed: false,
                                createdAt: new Date().toISOString()
                            };

                            todos.unshift(newTodo);
                            await env.TODOS?.put(TODOS_KEY, JSON.stringify(todos));

                            return new Response(JSON.stringify(newTodo), {
                                headers: { 'content-type': 'application/json' }
                            });
                        } catch (error) {
                            return new Response('Failed to create todo', { status: 500 });
                        }
                    }
                }

                if (url.pathname.startsWith('/api/todos/')) {
                    const todoId = url.pathname.split('/').pop();

                    if (request.method === 'PATCH') {
                        try {
                            const { completed } = await request.json();
                            const todosJson = await env.TODOS?.get(TODOS_KEY);
                            const todos = todosJson ? JSON.parse(todosJson) : [];

                            const todoIndex = todos.findIndex(t => t.id === todoId);
                            if (todoIndex === -1) {
                                return new Response('Todo not found', { status: 404 });
                            }

                            todos[todoIndex].completed = completed;
                            await env.TODOS?.put(TODOS_KEY, JSON.stringify(todos));

                            return new Response(JSON.stringify(todos[todoIndex]), {
                                headers: { 'content-type': 'application/json' }
                            });
                        } catch (error) {
                            return new Response('Failed to update todo', { status: 500 });
                        }
                    }

                    if (request.method === 'DELETE') {
                        try {
                            const todosJson = await env.TODOS?.get(TODOS_KEY);
                            const todos = todosJson ? JSON.parse(todosJson) : [];

                            const filteredTodos = todos.filter(t => t.id !== todoId);
                            await env.TODOS?.put(TODOS_KEY, JSON.stringify(filteredTodos));

                            return new Response('', { status: 204 });
                        } catch (error) {
                            return new Response('Failed to delete todo', { status: 500 });
                        }
                    }
                }

                // For root path, return todos data for injection
                if (url.pathname === '/') {
                    try {
                        const todosJson = await env.TODOS?.get(TODOS_KEY);
                        const todos = todosJson ? JSON.parse(todosJson) : [];

                        const completedCount = todos.filter(t => t.completed).length;
                        const totalCount = todos.length;

                        return new Response(JSON.stringify({
                            todos,
                            stats: {
                                total: totalCount,
                                completed: completedCount,
                                remaining: totalCount - completedCount
                            }
                        }), {
                            headers: { 'content-type': 'application/json' }
                        });
                    } catch (error) {
                        return new Response(JSON.stringify({
                            todos: [],
                            stats: { total: 0, completed: 0, remaining: 0 }
                        }), {
                            headers: { 'content-type': 'application/json' }
                        });
                    }
                }

                return new Response('Not found', { status: 404 });
            }
        };