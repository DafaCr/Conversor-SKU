export function json(datos, status = 200, headers = {}) {
  return Response.json(datos, {
    status,
    headers: { "Cache-Control": "private, no-store", ...headers }
  });
}
