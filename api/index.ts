import server from "../dist/server/server.js";

type VercelRequest = {
  method?: string;
  url?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: Buffer) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = `${protocol}://${host}${req.url ?? "/"}`;
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
  }

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : req.body;
  const request = new Request(url, {
    method: req.method,
    headers,
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
  const response = await server.fetch(request, {}, {});

  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
