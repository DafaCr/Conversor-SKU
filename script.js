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
  // leer productos, avisar de códigos no encontrados, y guardar
  // productos nuevos desde el botón "+").
  // Mientras no la reemplaces, la página usa solo codigos.js y
  // el botón "+" avisa que hace falta configurar Sheets primero.
  // Ejemplo: "https://script.google.com/macros/s/AKfyc.../exec"
  // ------------------------------------------------------------
  const URL_APPS_SCRIPT = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT";

  const input = document.getElementById("input-codigo");
  const resultado = document.getElementById("resultado");
  const resultadoNombre = document.getElementById("resultado-nombre");
  const skusLista = document.getElementById("skus-lista");
  const mensajeError = document.getElementById("mensaje-error");
  const contador = document.getElementById("contador");
  const listaResultados = document.getElementById("lista-resultados");
  const listaItems = document.getElementById("lista-items");

  const btnAgregar = document.getElementById("btn-agregar");
  const modalFondo = document.getElementById("modal-fondo");
  const formAgregar = document.getElementById("form-agregar");
  const campoNombre = document.getElementById("campo-nombre");
  const campoSku = document.getElementById("campo-sku");
  const campoCodigo = document.getElementById("campo-codigo");
  const modalMensaje = document.getElementById("modal-mensaje");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnGuardar = document.getElementById("btn-guardar");

  // "codigos" viene definido en codigos.js, cargado antes que este archivo.
  // Empezamos usando esa lista local; si Google Sheets responde bien,
  // la reemplazamos por la lista remota (ver cargarProductosRemotos).
  let codigosActivos = typeof codigos === "object" ? codigos : {};
  actualizarContador("local");

  // Para la navegación con flechas ↑↓ en la lista de resultados múltiples.
  let indiceSeleccionado = -1;

  mostrarResultadoVacio();
  cargarProductosRemotos();

  // Mantener el foco siempre en el input, salvo que el usuario esté
  // interactuando con un botón de copiar, un ítem de la lista, el
  // botón "+", o algo dentro del modal de agregar producto.
  document.addEventListener("click", function (evento) {
    const tocaBotonCopiar = evento.target.closest && evento.target.closest(".sku-copiar");
    const tocaItemDeLista = evento.target.closest && evento.target.closest(".lista-item");
    const tocaBotonAgregar = evento.target.closest && evento.target.closest(".btn-flotante");
    const tocaModal = evento.target.closest && evento.target.closest(".modal-fondo");
    if (!tocaBotonCopiar && !tocaItemDeLista && !tocaBotonAgregar && !tocaModal) {
      input.focus();
    }
  });

  window.addEventListener("load", function () {
    input.focus();
  });

  input.addEventListener("keydown", function (evento) {
    // Si hay una lista de varios resultados visible, las flechas
    // ↑↓ navegan entre ellos y Enter selecciona el resaltado.
    if (!listaResultados.hidden) {
      if (evento.key === "ArrowDown") {
        evento.preventDefault();
        moverSeleccion(1);
        return;
      }
      if (evento.key === "ArrowUp") {
        evento.preventDefault();
        moverSeleccion(-1);
        return;
      }
      if (evento.key === "Enter" && indiceSeleccionado >= 0) {
        evento.preventDefault();
        const items = listaItems.querySelectorAll(".lista-item");
        if (items[indiceSeleccionado]) {
          items[indiceSeleccionado].click();
        }
        return;
      }
    }

    if (evento.key === "Enter") {
      evento.preventDefault();
      buscarCodigo();
    }
  });

  function moverSeleccion(direccion) {
    const items = listaItems.querySelectorAll(".lista-item");
    if (items.length === 0) return;

    indiceSeleccionado = (indiceSeleccionado + direccion + items.length) % items.length;

    items.forEach(function (item, indice) {
      item.classList.toggle("lista-item--activa", indice === indiceSeleccionado);
    });

    items[indiceSeleccionado].scrollIntoView({ block: "nearest" });
  }

  function actualizarContador(origen) {
    const total = Object.keys(codigosActivos).length;
    const textoOrigen = origen === "sheets" ? "desde Google Sheets" : "locales";
    contador.textContent = total + " producto(s) cargados (" + textoOrigen + ")";
  }

  function cargarProductosRemotos() {
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
      })
      .catch(function () {
        // Sin internet, Google caído, o URL mal configurada:
        // seguimos usando codigos.js normalmente.
      });
  }

  function buscarProductoExacto(consulta) {
    // Primero probamos coincidencia exacta tal cual (rápido y cubre
    // el caso más común: escaneo de código de barras numérico).
    if (codigosActivos[consulta]) {
      return codigosActivos[consulta];
    }

    // Si no hubo coincidencia exacta, buscamos ignorando
    // mayúsculas/minúsculas (útil para claves con letras, como
    // "cafe", "CROA", "Mixt", etc.)
    const consultaMinuscula = consulta.toLowerCase();
    const claves = Object.keys(codigosActivos);
    for (let i = 0; i < claves.length; i++) {
      if (claves[i].toLowerCase() === consultaMinuscula) {
        return codigosActivos[claves[i]];
      }
    }

    return undefined;
  }

  function buscarCodigo() {
    const consulta = input.value.trim();

    if (consulta === "") {
      return;
    }

    const productoExacto = buscarProductoExacto(consulta);

    if (productoExacto) {
      ocultarListaResultados();
      mostrarResultadoOk(productoExacto.skus, productoExacto.nombre);
    } else {
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

    input.select();
  }

  function mostrarResultadoOk(skus, nombre) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");

    mensajeError.hidden = true;
    resultadoNombre.textContent = nombre || "";

    renderizarSkus(skus);

    const primerBoton = skusLista.querySelector(".sku-copiar");
    copiarAlPortapapeles(skus[0], primerBoton);
  }

  function mostrarResultadoError(consulta) {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultadoNombre.textContent = "";
    skusLista.innerHTML = "";
    mensajeError.hidden = false;

    resultado.classList.remove("resultado--error");
    void resultado.offsetWidth;
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
    indiceSeleccionado = -1;

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
    indiceSeleccionado = -1;
  }

  function copiarAlPortapapeles(valor, boton) {
    if (!boton) return;

    if (!navigator.clipboard) {
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
      // El botón "Copiar" sigue funcionando manualmente.
    });
  }

  function registrarCodigoNoEncontrado(consulta) {
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      return;
    }

    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tipo: "registro", codigo: consulta })
    }).catch(function () {
      // Sin interrumpir al usuario si falla el envío.
    });
  }

  // ------------------------------------------------------------
  // BOTÓN "+" — Agregar producto nuevo
  // ------------------------------------------------------------

  btnAgregar.addEventListener("click", function () {
    abrirModal();
  });

  btnCancelar.addEventListener("click", function () {
    cerrarModal();
  });

  modalFondo.addEventListener("click", function (evento) {
    // Cerrar si se hace clic en el fondo oscuro, no en la tarjeta.
    if (evento.target === modalFondo) {
      cerrarModal();
    }
  });

  formAgregar.addEventListener("submit", function (evento) {
    evento.preventDefault();
    guardarProductoNuevo();
  });

  function abrirModal() {
    modalFondo.hidden = false;
    formAgregar.reset();
    modalMensaje.hidden = true;
    modalMensaje.classList.remove("exito");
    campoNombre.focus();
  }

  function cerrarModal() {
    modalFondo.hidden = true;
    input.focus();
  }

  function guardarProductoNuevo() {
    const nombre = campoNombre.value.trim();
    const skusTexto = campoSku.value.trim();
    const codigo = campoCodigo.value.trim();

    if (!nombre || !skusTexto || !codigo) {
      mostrarMensajeModal("Completa los 3 campos.", false);
      return;
    }

    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      mostrarMensajeModal("Falta configurar Google Sheets (URL_APPS_SCRIPT) para poder guardar productos nuevos.", false);
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando…";

    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        tipo: "nuevo_producto",
        codigo: codigo,
        skus: skusTexto,
        nombre: nombre
      })
    }).then(function () {
      // Con mode "no-cors" no podemos leer si realmente se guardó,
      // pero como asumimos éxito, lo agregamos también a la lista
      // activa de esta PC para poder usarlo de inmediato.
      const skusArray = skusTexto.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });
      codigosActivos[codigo] = { skus: skusArray, nombre: nombre };
      actualizarContador(URL_APPS_SCRIPT.indexOf("PEGA_AQUI") === -1 ? "sheets" : "local");

      mostrarMensajeModal("Producto guardado. Ya puedes buscarlo.", true);
      setTimeout(function () {
        cerrarModal();
      }, 1200);
    }).catch(function () {
      mostrarMensajeModal("No se pudo guardar (revisa tu conexión a internet).", false);
    }).finally(function () {
      btnGuardar.disabled = false;
      btnGuardar.textContent = "Guardar";
    });
  }

  function mostrarMensajeModal(texto, esExito) {
    modalMensaje.textContent = texto;
    modalMensaje.hidden = false;
    modalMensaje.classList.toggle("exito", !!esExito);
  }
})();