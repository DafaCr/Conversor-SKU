import { json } from "../server/respuestas.mjs";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json({ message: "Método no permitido." }, 405, { Allow: "POST" });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return json({ message: "Envía los datos en formato JSON." }, 415);
    }

    const datos = await request.json().catch(() => null);
    const numero = datos?.numero;
    if (typeof numero !== "string" || !/^(?:\d{8}|\d{11})$/.test(numero)) {
      return json({ message: "Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos." }, 400);
    }
    const token = process.env.TOKEN_FACTILIZA;
    if (!token) return json({ message: "Falta configurar la consulta de documentos." }, 503);

    const tipo = numero.length === 11 ? "ruc" : "dni";
    try {
      const respuesta = await fetch("https://api.factiliza.com/v1/" + tipo + "/info/" + numero, {
        headers: { Authorization: "Bearer " + token },
        signal: AbortSignal.timeout(10000),
        redirect: "error"
      });
      if (respuesta.status === 404) {
        return json({ message: "No se encontró información para ese documento." }, 404);
      }
      if (!respuesta.ok) throw new Error("Falló la consulta.");
      const resultado = await respuesta.json();
      if (!resultado.success || !resultado.data) {
        return json({ message: "No se encontró información para ese documento." }, 404);
      }

      const { nombre_o_razon_social, nombre_completo, numero: numeroEncontrado, direccion_completa, direccion } = resultado.data;
      return json({
        success: true,
        data: { nombre_o_razon_social, nombre_completo, numero: numeroEncontrado, direccion_completa, direccion }
      });
    } catch {
      return json({ message: "El servicio de consulta de documentos no está disponible." }, 502);
    }
  }
};
