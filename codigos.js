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
//   (el primer SKU de la lista es el que se copia automático)
//
// TAMBIÉN PUEDES USAR PALABRAS EN VEZ DE CÓDIGOS DE BARRAS,
// como claves cortas para buscar por nombre o primeras letras:
//   "cafe": { skus: ["1008142"], nombre: "Cafe" },
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
  "5555": { skus: ["0047", "0048"], nombre: "Combo Prueba 2 + Prueba 3" },
  // PRODUCTOS POR NOMBRE / PRIMERAS LETRAS
  "cafe": { skus: ["1008142"], nombre: "Cafe" },
  "bols": { skus: ["1014459"], nombre: "Bolsa" },
  "croa": { skus: ["1016732", "1008142"], nombre: "Croissant + Cafe" },
  "mixt": { skus: ["1013621", "1008142"], nombre: "Mixto Completo + Cafe" },
  "moka": { skus: ["1004288"], nombre: "Moka" },
  "capu": { skus: ["1004286"], nombre: "Capuccino" },
  "pie": { skus: ["151120212"], nombre: "Pie de Limón" },
  "hela": { skus: ["0000010019351"], nombre: "Torta Helada" },
  "red": { skus: ["202504222"], nombre: "Red Velvet" },
  "golde": { skus: ["1011066"], nombre: "Bebida de Maíz Golden Lata x 473 ml" },
  "selv": { skus: ["250820212"], nombre: "Torta Selva Negra" },
  "choc": { skus: ["0000010019160"], nombre: "Torta de Chocolate" },
  "pudi": { skus: ["20920241"], nombre: "Cuchareable de Pudín de Chocolate" },
  "pistacho": { skus: ["2025102202"], nombre: "Cuchareable con Crema de Pistacho" },
  "7750670021661": { skus: ["1001360"], nombre: "Energizante Volt x 500 ml" },
  "7750670021692": { skus: ["1004258"], nombre: "Energizante Volt Maca x 500 ml" },
  "7754143002362": { skus: ["1011899"], nombre: "Turroncito de Doña Pepa La Vita Panettiere x 35 gr" },
  "0781159046179": { skus: ["1016706"], nombre: "Brownie Trufado La Chepo x 110 gr" },
  "0799192537189": { skus: ["1016705"], nombre: "Brownie Bar Light La Chepo x 50 gr" },
  "0799192623158": { skus: ["1016704"], nombre: "Brownie Bar Cookies and Cream La Chepo x 56 gr" },
  "0799192537172": { skus: ["1016703"], nombre: "Brownie Bar Trufado La Chepo x 56 gr" },
  "7750670022101": { skus: ["400410001"], nombre: "Hey Fit Black Fizz Pet x 600 ml" }
};