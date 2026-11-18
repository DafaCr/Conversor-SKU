import { json } from "../server/respuestas.mjs";

const camposPorOperacion = new Map([
  ["registro", ["codigo"]],
  ["nuevo_producto", ["codigo", "skus", "nombre"]],
  ["editar_producto", ["codigoOriginal", "codigo", "skus", "nombre"]],
  ["eliminar_producto", ["codigo"]],
  ["nuevo_acceso", ["nombre", "skus"]],
  ["eliminar_acceso", ["nombre"]]
]);

function urlDeAppsScript() {
  try {
    const url = new URL(process.env.URL_APPS_SCRIPT);
    if (url.origin === "https://script.google.com" &&
        /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname) &&
        !url.username && !url.password) {
      return new URL(url.pathname, url.origin);
    }
  } catch {
    // La instalación puede estar pendiente de configuración.
  }
}

function datosDeCatalogo(datos, accesos) {
  const entradaValida = (item) => item && typeof item.nombre === "string" &&
    Array.isArray(item.skus);
  const entradaPublica = ({ nombre, skus }) => ({
    nombre,
    skus: skus.filter((sku) => typeof sku === "string" || typeof sku === "number")
  });

  if (accesos && Array.isArray(datos)) {
    return datos.filter(entradaValida).map(entradaPublica);
  }
  if (!accesos && datos && typeof datos === "object" && !Array.isArray(datos)) {
    return Object.fromEntries(Object.entries(datos)
      .filter(([, item]) => entradaValida(item))
      .map(([codigo, item]) => [codigo, entradaPublica(item)]));
  }
  throw new Error("Respuesta inesperada de Google Sheets.");
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "POST") {
      return json({ message: "Método no permitido." }, 405, { Allow: "GET, POST" });
    }

    const url = urlDeAppsScript();
    const clave = process.env.CLAVE_SECRETA;
    if (!url || !clave) return json({ message: "Falta configurar Google Sheets." }, 503);

    const opciones = { signal: AbortSignal.timeout(15000) };
    const accesos = new URL(request.url).searchParams.get("accion") === "accesos";
    if (request.method === "GET") {
      url.searchParams.set("clave", clave);
      if (accesos) url.searchParams.set("accion", "accesos");
    } else {
      if (!request.headers.get("content-type")?.startsWith("application/json")) {
        return json({ message: "Envía los datos en formato JSON." }, 415);
      }
      const datos = await request.json().catch(() => null);
      const campos = camposPorOperacion.get(datos?.tipo);
      if (!campos || !campos.every((campo) => typeof datos[campo] === "string" && datos[campo].trim())) {
        return json({ message: "Operación o datos inválidos." }, 400);
      }

      const payload = Object.fromEntries(campos.map((campo) => [campo, datos[campo]]));
      opciones.method = "POST";
      opciones.headers = { "Content-Type": "text/plain;charset=utf-8" };
      opciones.body = JSON.stringify({ ...payload, tipo: datos.tipo, clave });
    }

    try {
      const respuesta = await fetch(url, opciones);
      if (!respuesta.ok) throw new Error("Falló Google Sheets.");
      const datos = await respuesta.json();
      if (!datos || datos.ok === false || datos.success === false || datos.error || datos.status === "error") {
        throw new Error("Google Sheets rechazó la operación.");
      }

      return json(request.method === "GET" ? datosDeCatalogo(datos, accesos) : { ok: true });
    } catch {
      return json({ message: "Google Sheets no pudo completar la operación." }, 502);
    }
  }
};
