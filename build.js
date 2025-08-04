#!/usr/bin/env node
//@ts-check

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

/**
 * Build CLI for converting HTML with embedded server script to Cloudflare Worker
 */
class HTMLWorkerBuilder {
  /**
   * @param {string} inputFile - Path to input HTML file
   * @param {string} outputDir - Output directory for generated files
   */
  constructor(inputFile, outputDir = "./dist") {
    this.inputFile = inputFile;
    this.outputDir = outputDir;
  }

  /**
   * Parse HTML and extract server script
   * @param {string} htmlContent - HTML content
   * @returns {{serverCode: string | null, cleanHtml: string}}
   */
  parseHTML(htmlContent) {
    const serverScriptRegex =
      /<script\s+id=["']server["'][^>]*>([\s\S]*?)<\/script>/i;
    const match = htmlContent.match(serverScriptRegex);

    const serverCode = match ? match[1].trim() : null;
    const cleanHtml = htmlContent.replace(serverScriptRegex, "").trim();

    return { serverCode, cleanHtml };
  }

  /**
   * Generate entry.js file
   * @param {string} cleanHtml
   * @returns {string}
   */
  generateEntryJS(cleanHtml) {
    return `//@ts-check
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
        ctx.html = ${JSON.stringify(cleanHtml)};

        const serverResponse = await worker.fetch(request, env, ctx);
        
        if (serverResponse.headers.get('content-type')?.includes('application/json')) {
          const serverData = await serverResponse.json();          
          // Inject server data in head
          let htmlContent = ctx.html.replace(
            '</head>',
            \`  <script>window.serverData = \${JSON.stringify(serverData)};</script>
</head>\`
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
`;
  }

  /**
   * Generate wrangler.jsonc file
   * @param {string} projectName - Project name
   * @param {boolean} hasServerCode - Whether server code exists
   * @returns {string}
   */
  generateWranglerConfig(projectName, hasServerCode) {
    return `{
  "$schema": "https://unpkg.com/wrangler@latest/config-schema.json",
  "name": "${projectName}",
  ${hasServerCode ? `"main": "entry.js",` : ""}
  "compatibility_date": "2025-01-14",${
    hasServerCode ? "" : '\n  "assets": { "directory": "./public" },'
  }
  "observability": { "logs": { "enabled": true } }
}
`;
  }

  /**
   * Build the project
   */
  build() {
    try {
      // Read input HTML
      const htmlContent = readFileSync(this.inputFile, "utf-8");
      const { serverCode, cleanHtml } = this.parseHTML(htmlContent);

      // Create output directory
      if (!existsSync(this.outputDir)) {
        mkdirSync(this.outputDir, { recursive: true });
      }

      const projectName = this.inputFile
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-]/g, "-");
      const hasServerCode = !!serverCode;

      // Generate files
      if (hasServerCode) {
        // Generate worker.js with html variable
        writeFileSync(join(this.outputDir, "worker.js"), serverCode);
      } else {
        // Create public directory for static assets
        const publicDir = join(this.outputDir, "public");
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true });
        }
        writeFileSync(join(publicDir, "index.html"), cleanHtml);
      }

      if (hasServerCode) {
        // Generate entry.js
        const entryJS = this.generateEntryJS(cleanHtml);
        writeFileSync(join(this.outputDir, "entry.js"), entryJS);
      }

      // Generate wrangler.jsonc
      const wranglerConfig = this.generateWranglerConfig(
        projectName,
        hasServerCode
      );
      writeFileSync(join(this.outputDir, "wrangler.jsonc"), wranglerConfig);

      console.log(`✅ Build complete! Files generated in ${this.outputDir}/`);
      console.log(`📁 Generated files:`);
      console.log(`   - entry.js (main worker entry point)`);
      if (hasServerCode) {
        console.log(
          `   - worker.js (extracted server code with html variable)`
        );
      } else {
        console.log(`   - public/index.html (static HTML)`);
      }
      console.log(`   - wrangler.jsonc (Cloudflare Worker config)`);

      if (hasServerCode) {
        console.log(
          `\n💡 Note: Server data available as window.serverData in HTML head`
        );
        console.log(
          `💡 Server code has access to 'html' variable with your template`
        );
      }
    } catch (error) {
      console.error("❌ Build failed:", error.message);
      process.exit(1);
    }
  }
}

// CLI Logic
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
HTML Worker Builder - Convert HTML with embedded server script to Cloudflare Worker

Usage:
  node build.js <input.html> [output-dir]

Arguments:
  input.html    Path to HTML file with optional <script id="server"> tag
  output-dir    Output directory (default: ./dist)

Examples:
  node build.js app.html
  node build.js src/page.html ./build

The server script should export default { fetch } and will have access to 'html' variable.
`);
  process.exit(0);
}

const inputFile = args[0];
const outputDir = args[1] || "./dist";

if (!existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

const builder = new HTMLWorkerBuilder(inputFile, outputDir);
builder.build();
