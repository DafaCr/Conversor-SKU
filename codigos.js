// ============================================================
// CODIGOS.JS
// ------------------------------------------------------------
// Este es el ÚNICO archivo que debes modificar para actualizar
// la lista de códigos de barra, sus SKU y el nombre del producto.
//
// FORMATO:
//   "codigo_de_barras": { skus: ["SKU"], nombre: "Nombre del producto" },
//
// PARA UN PRODUCTO NORMAL (1 solo SKU):
//   "7758451236": { skus: ["0047"], nombre: "Prueba 2" },
//
// PARA UN COMBO (2 o más SKU en un mismo código de barras):
//   "9999999999": { skus: ["0047", "0048"], nombre: "Combo Prueba 2 + 3" },
//
// REGLAS IMPORTANTES:
// 1. El código de barras y cada SKU deben ir SIEMPRE entre
//    comillas dobles ("..."), aunque sean solo números.
//    Esto evita que se pierdan los ceros a la izquierda
//    (por ejemplo "0025" en vez de 25).
// 2. skus siempre va entre corchetes [ ], aunque sea un solo SKU.
// 3. El nombre del producto también va entre comillas dobles.
//    Este nombre es lo que se busca cuando alguien escribe
//    palabras en vez de un código de barras, así que ponlo
//    completo y fácil de reconocer.
// 4. Cada línea debe terminar con una coma ","  excepto
//    (opcionalmente) la última línea.
// 5. No borres la primera línea (const codigos = {) ni la
//    línea final (};). Solo agrega o edita las líneas de en medio.
// 6. Después de cambiar este archivo, recuerda hacer commit,
//    push, y subir el número de versión en index.html.
// ============================================================

const codigos = {
  "1234": { skus: ["4321"], nombre: "Prueba 1" },
  "7758451236": { skus: ["0047"], nombre: "Prueba 2" },
  "8854219632": { skus: ["0048"], nombre: "Prueba 3" },
  "9876543210": { skus: ["0049"], nombre: "Prueba 4" },
  "1234567890": { skus: ["0050"], nombre: "Prueba 5" },
  "7501234567890": { skus: ["0001"], nombre: "Prueba 6" },
  "7501234500019": { skus: ["0002"], nombre: "Prueba 7" },
  "7501234500026": { skus: ["0025"], nombre: "Prueba 8" },
  "7501234500033": { skus: ["0100"], nombre: "Prueba 9" },
  "7501234500040": { skus: ["0051"], nombre: "Prueba 10" },
  "7501234500057": { skus: ["0052"], nombre: "Prueba 11" },
  "5555": { skus: ["0047", "0048"], nombre: "Combo Prueba 2 + Prueba 3" }
};