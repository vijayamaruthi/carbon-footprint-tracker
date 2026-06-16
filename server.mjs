import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const root = new URL("./", import.meta.url).pathname;
const publicRoot = resolve(root, "public");
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript"
};

function getStaticFilePath(url = "/") {
  const { pathname } = new URL(url, "http://127.0.0.1");
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const filePath = resolve(publicRoot, `.${decodedPath}`);
  const relativePath = relative(publicRoot, filePath);

  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`) || resolve(filePath) === publicRoot) {
    throw new Error("Blocked unsafe path");
  }

  return filePath;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Method not allowed");
      return;
    }

    const filePath = getStaticFilePath(request.url);
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": `${mimeTypes[extname(filePath)] ?? "application/octet-stream"}; charset=utf-8`,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end("Not found");
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Carbon platform demo running at http://127.0.0.1:4173");
});
