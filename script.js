// ============================================================
// SCRIPT.JS — Lógica del conversor
// No es necesario tocar este archivo para actualizar códigos.
// La lista de productos puede venir de dos lugares:
//   1. Google Sheets (si configuraste URL_APPS_SCRIPT abajo)
//   2. codigos.js, como respaldo si Sheets no responde
// ============================================================

(function () {
  "use strict";

  // ------------------------------------------------------------
  // Pega aquí la URL de tu Google Apps Script (misma URL para
  // leer productos y para avisar de códigos no encontrados).
  // Mientras no la reemplaces, la página usa solo codigos.js.
  // Ejemplo: "https://script.google.com/macros/s/AKfyc.../exec"
  // ------------------------------------------------------------
  const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzxmWSWAkfJzRSecfXdlUvWh6jfVgBe1nYOIS-O23cyDck-QPJLKf3bukjhu0ydUIg/exec";

  const input = document.getElementById("input-codigo");
  const resultado = document.getElementById("resultado");
  const resultadoNombre = document.getElementById("resultado-nombre");
  const skusLista = document.getElementById("skus-lista");
  const mensajeError = document.getElementById("mensaje-error");
  const contador = document.getElementById("contador");
  const listaResultados = document.getElementById("lista-resultados");
  const listaItems = document.getElementById("lista-items");

  // "codigos" viene definido en codigos.js, cargado antes que este archivo.
  // Empezamos usando esa lista local; si Google Sheets responde bien,
  // la reemplazamos por la lista remota (ver cargarProductosRemotos).
  let codigosActivos = typeof codigos === "object" ? codigos : {};
  actualizarContador("local");

  mostrarResultadoVacio();
  cargarProductosRemotos();

  // Mantener el foco siempre en el input, salvo que el usuario
  // esté interactuando con un botón de copiar o un ítem de la lista.
  document.addEventListener("click", function (evento) {
    const tocaBotonCopiar = evento.target.closest && evento.target.closest(".sku-copiar");
    const tocaItemDeLista = evento.target.closest && evento.target.closest(".lista-item");
    if (!tocaBotonCopiar && !tocaItemDeLista) {
      input.focus();
    }
  });

  window.addEventListener("load", function () {
    input.focus();
  });

  input.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      buscarCodigo();
    }
  });

  function actualizarContador(origen) {
    const total = Object.keys(codigosActivos).length;
    const textoOrigen = origen === "sheets" ? "desde Google Sheets" : "locales";
    contador.textContent = total + " producto(s) cargados (" + textoOrigen + ")";
  }

  function cargarProductosRemotos() {
    // Si no configuraste tu URL de Apps Script todavía, seguimos
    // usando codigos.js sin intentar nada más.
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      return;
    }

    fetch(URL_APPS_SCRIPT)
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error("Respuesta no válida");
        return respuesta.json();
      })
      .then(function (productosRemotos) {
        if (productosRemotos && Object.keys(productosRemotos).length > 0) {
          codigosActivos = productosRemotos;
          actualizarContador("sheets");
        }
        // Si vino vacío, nos quedamos con los locales sin avisar nada.
      })
      .catch(function () {
        // Sin internet, Google caído, o URL mal configurada:
        // seguimos usando codigos.js normalmente, sin interrumpir
        // al usuario ni mostrar ningún error en pantalla.
      });
  }

  function buscarCodigo() {
    const consulta = input.value.trim();

    if (consulta === "") {
      return;
    }

    // 1. Coincidencia exacta por código de barras (lo más común: escaneo)
    const productoExacto = codigosActivos[consulta];

    if (productoExacto) {
      ocultarListaResultados();
      mostrarResultadoOk(productoExacto.skus, productoExacto.nombre);
    } else {
      // 2. No coincide como código exacto: buscamos por nombre,
      //    sin distinguir mayúsculas/minúsculas, coincidencia parcial.
      const consultaMinuscula = consulta.toLowerCase();
      const coincidencias = Object.values(codigosActivos).filter(function (producto) {
        return producto.nombre.toLowerCase().indexOf(consultaMinuscula) !== -1;
      });

      if (coincidencias.length === 1) {
        ocultarListaResultados();
        mostrarResultadoOk(coincidencias[0].skus, coincidencias[0].nombre);
      } else if (coincidencias.length > 1) {
        mostrarResultadoVacio();
        mostrarListaResultados(coincidencias);
      } else {
        ocultarListaResultados();
        mostrarResultadoError(consulta);
      }
    }

    // Dejar el texto anterior seleccionado para que, al escribir
    // el siguiente, se reemplace automáticamente sin borrar a mano.
    input.select();
  }

  function mostrarResultadoOk(skus, nombre) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");

    mensajeError.hidden = true;
    resultadoNombre.textContent = nombre || "";

    renderizarSkus(skus);

    // Siempre se copia automáticamente el primer SKU en cuanto aparece
    // el resultado (también en combos: se copia el primero de la lista).
    const primerBoton = skusLista.querySelector(".sku-copiar");
    copiarAlPortapapeles(skus[0], primerBoton);
  }

  function mostrarResultadoError(consulta) {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultadoNombre.textContent = "";
    skusLista.innerHTML = "";
    mensajeError.hidden = false;

    // Reiniciar la animación de sacudida aunque sea un error
    // justo después de otro error (para que se repita cada vez).
    resultado.classList.remove("resultado--error");
    void resultado.offsetWidth; // fuerza un reflow
    resultado.classList.add("resultado--error");

    registrarCodigoNoEncontrado(consulta);
  }

  function mostrarResultadoVacio() {
    resultado.classList.remove("resultado--ok", "resultado--error");
    resultado.classList.add("resultado--vacio");
    resultadoNombre.textContent = "";
    mensajeError.hidden = true;

    skusLista.innerHTML = "";
    const filaVacia = document.createElement("div");
    filaVacia.className = "sku-fila sku-fila--vacia";

    const etiqueta = document.createElement("span");
    etiqueta.className = "sku-etiqueta";
    etiqueta.textContent = "Código SKU";

    const valor = document.createElement("span");
    valor.className = "sku-valor";
    valor.textContent = "—";

    filaVacia.appendChild(etiqueta);
    filaVacia.appendChild(valor);
    skusLista.appendChild(filaVacia);
  }

  function renderizarSkus(skus) {
    skusLista.innerHTML = "";
    const esCombo = skus.length > 1;

    skus.forEach(function (sku, indice) {
      const fila = document.createElement("div");
      fila.className = "sku-fila";

      const etiqueta = document.createElement("span");
      etiqueta.className = "sku-etiqueta";
      etiqueta.textContent = esCombo ? "SKU " + (indice + 1) : "Código SKU";

      const valor = document.createElement("span");
      valor.className = "sku-valor";
      valor.textContent = sku;

      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "sku-copiar";
      boton.textContent = "Copiar";
      boton.addEventListener("click", function () {
        copiarAlPortapapeles(sku, boton);
      });

      fila.appendChild(etiqueta);
      fila.appendChild(valor);
      fila.appendChild(boton);
      skusLista.appendChild(fila);
    });
  }

  function mostrarListaResultados(coincidencias) {
    listaItems.innerHTML = "";

    coincidencias.forEach(function (producto) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "lista-item";

      const nombreSpan = document.createElement("span");
      nombreSpan.className = "lista-item-nombre";
      nombreSpan.textContent = producto.nombre;

      const skuSpan = document.createElement("span");
      skuSpan.className = "lista-item-sku";
      skuSpan.textContent = producto.skus.join(" + ");

      boton.appendChild(nombreSpan);
      boton.appendChild(skuSpan);

      boton.addEventListener("click", function () {
        ocultarListaResultados();
        mostrarResultadoOk(producto.skus, producto.nombre);
        input.value = "";
        input.focus();
      });

      listaItems.appendChild(boton);
    });

    listaResultados.hidden = false;
  }

  function ocultarListaResultados() {
    listaResultados.hidden = true;
    listaItems.innerHTML = "";
  }

  function copiarAlPortapapeles(valor, boton) {
    if (!boton) return;

    if (!navigator.clipboard) {
      // El navegador no soporta la API de portapapeles (por ejemplo,
      // si la página se abre como archivo local en vez de por HTTPS).
      return;
    }

    navigator.clipboard.writeText(valor).then(function () {
      const textoOriginal = "Copiar";
      boton.textContent = "¡Copiado!";
      boton.classList.add("copiado");
      setTimeout(function () {
        boton.textContent = textoOriginal;
        boton.classList.remove("copiado");
      }, 1200);
    }).catch(function () {
      // Si el navegador bloquea el copiado automático (algunos exigen
      // que el copiado ocurra tras un clic directo del usuario), no
      // rompemos nada: el botón "Copiar" sigue funcionando manualmente.
    });
  }

  function registrarCodigoNoEncontrado(consulta) {
    // Si no configuraste tu URL de Apps Script todavía, no hacemos nada.
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      return;
    }

    // Usamos mode "no-cors" porque Apps Script no siempre responde con
    // encabezados CORS en peticiones POST. No necesitamos leer la
    // respuesta, solo que el dato llegue y se guarde en la hoja.
    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ codigo: consulta })
    }).catch(function () {
      // Si no hay internet o falla el envío, no interrumpimos al
      // usuario: el resultado de "no registrado" ya se mostró igual.
    });
  }
})();