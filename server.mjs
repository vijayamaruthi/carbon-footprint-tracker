import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("./", import.meta.url).pathname;
const publicRoot = join(root, "public");
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript"
};

const server = createServer(async (request, response) => {
  try {
    const rawPath = request.url === "/" ? "/index.html" : request.url ?? "/index.html";
    const safePath = normalize(rawPath.split("?")[0]).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(publicRoot, safePath);
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Carbon platform demo running at http://127.0.0.1:4173");
});
