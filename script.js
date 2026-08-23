// ============================================================
// SCRIPT.JS — Lógica del conversor
// No es necesario tocar este archivo para actualizar códigos.
// La lista de productos puede venir de dos lugares:
//   1. Google Sheets (si configuraste URL_APPS_SCRIPT abajo)
//   2. codigos.js, como respaldo si Sheets no responde
// ============================================================

(function () {
  "use strict";

  // URL_APPS_SCRIPT y CLAVE_SECRETA vienen de config.js, cargado
  // antes que este archivo en index.html.

  const input = document.getElementById("input-codigo");
  const resultado = document.getElementById("resultado");
  const resultadoNombre = document.getElementById("resultado-nombre");
  const skusLista = document.getElementById("skus-lista");
  const mensajeError = document.getElementById("mensaje-error");
  const contador = document.getElementById("contador");
  const listaResultados = document.getElementById("lista-resultados");
  const listaItems = document.getElementById("lista-items");
  const resultadoAcciones = document.getElementById("resultado-acciones");
  const btnEditar = document.getElementById("btn-editar");
  const btnEliminar = document.getElementById("btn-eliminar");

  const btnAgregar = document.getElementById("btn-agregar");
  const modalFondo = document.getElementById("modal-fondo");
  const modalTitulo = document.getElementById("modal-titulo");
  const formAgregar = document.getElementById("form-agregar");
  const campoNombre = document.getElementById("campo-nombre");
  const campoSku = document.getElementById("campo-sku");
  const campoCodigo = document.getElementById("campo-codigo");
  const modalMensaje = document.getElementById("modal-mensaje");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnGuardar = document.getElementById("btn-guardar");

  let codigosActivos = typeof codigos === "object" ? codigos : {};
  actualizarContador("local");

  let indiceSeleccionado = -1;
  let claveProductoActual = null; // código del producto mostrado en pantalla (para Editar/Eliminar)

  // Estado del modal: si estamos editando un producto existente, y
  // cuál era su código original (por si lo cambian durante la edición).
  let modoEdicion = false;
  let codigoOriginalEdicion = null;
  let confirmacionPendientePara = null; // evita re-mostrar la advertencia si no cambiaron los datos

  mostrarResultadoVacio();
  cargarProductosRemotos();

  document.addEventListener("click", function (evento) {
    const tocaBotonCopiar = evento.target.closest && evento.target.closest(".sku-copiar");
    const tocaItemDeLista = evento.target.closest && evento.target.closest(".lista-item");
    const tocaBotonAgregar = evento.target.closest && evento.target.closest(".btn-flotante");
    const tocaModal = evento.target.closest && evento.target.closest(".modal-fondo");
    const tocaAcciones = evento.target.closest && evento.target.closest(".resultado-acciones");
    if (!tocaBotonCopiar && !tocaItemDeLista && !tocaBotonAgregar && !tocaModal && !tocaAcciones) {
      input.focus();
    }
  });

  window.addEventListener("load", function () {
    input.focus();
  });

  input.addEventListener("keydown", function (evento) {
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

    fetch(URL_APPS_SCRIPT + "?clave=" + encodeURIComponent(CLAVE_SECRETA))
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
        // Sin internet, Google caído, o URL/clave mal configurada:
        // seguimos usando codigos.js normalmente.
      });
  }

  // Devuelve la CLAVE real (tal como está guardada) que coincide con
  // la consulta, sin distinguir mayúsculas/minúsculas. Null si no hay.
  function buscarClaveExacta(consulta) {
    if (codigosActivos[consulta]) return consulta;

    const consultaMinuscula = consulta.toLowerCase();
    const claves = Object.keys(codigosActivos);
    for (let i = 0; i < claves.length; i++) {
      if (claves[i].toLowerCase() === consultaMinuscula) {
        return claves[i];
      }
    }
    return null;
  }

  // Busca si un SKU ya pertenece a OTRO producto (para avisar antes
  // de guardar). codigoExcluir permite ignorar el producto que se
  // está editando actualmente (no debe "chocar" contra sí mismo).
  function buscarProductoPorSku(sku, codigoExcluir) {
    const skuMinuscula = sku.toLowerCase();
    const entradas = Object.entries(codigosActivos);

    for (let i = 0; i < entradas.length; i++) {
      const clave = entradas[i][0];
      const producto = entradas[i][1];

      if (codigoExcluir && clave.toLowerCase() === codigoExcluir.toLowerCase()) {
        continue;
      }

      const tieneSku = producto.skus.some(function (s) {
        return s.toLowerCase() === skuMinuscula;
      });

      if (tieneSku) {
        return { clave: clave, producto: producto };
      }
    }

    return null;
  }

  function buscarCodigo() {
    const consulta = input.value.trim();

    if (consulta === "") {
      return;
    }

    const claveExacta = buscarClaveExacta(consulta);

    if (claveExacta) {
      const producto = codigosActivos[claveExacta];
      ocultarListaResultados();
      mostrarResultadoOk(claveExacta, producto.skus, producto.nombre);
    } else {
      const consultaMinuscula = consulta.toLowerCase();
      const coincidencias = Object.entries(codigosActivos).filter(function (entrada) {
        return entrada[1].nombre.toLowerCase().indexOf(consultaMinuscula) !== -1;
      });

      if (coincidencias.length === 1) {
        ocultarListaResultados();
        mostrarResultadoOk(coincidencias[0][0], coincidencias[0][1].skus, coincidencias[0][1].nombre);
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

  function mostrarResultadoOk(clave, skus, nombre) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");

    mensajeError.hidden = true;
    resultadoNombre.textContent = nombre || "";

    claveProductoActual = clave;
    resultadoAcciones.hidden = false;

    renderizarSkus(skus);

    const primerBoton = skusLista.querySelector(".sku-copiar");
    copiarAlPortapapeles(skus[0], primerBoton);
  }

  function mostrarResultadoError(consulta) {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultadoNombre.textContent = "";
    skusLista.innerHTML = "";
    mensajeError.hidden = false;
    resultadoAcciones.hidden = true;
    claveProductoActual = null;

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
    resultadoAcciones.hidden = true;
    claveProductoActual = null;

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

    coincidencias.forEach(function (entrada) {
      const clave = entrada[0];
      const producto = entrada[1];

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
        mostrarResultadoOk(clave, producto.skus, producto.nombre);
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
    if (!navigator.clipboard) return;

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
      body: JSON.stringify({ tipo: "registro", codigo: consulta, clave: CLAVE_SECRETA })
    }).catch(function () {});
  }

  // ------------------------------------------------------------
  // BOTÓN "+" — Agregar producto nuevo
  // ------------------------------------------------------------

  btnAgregar.addEventListener("click", function () {
    abrirModalAgregar();
  });

  btnCancelar.addEventListener("click", function () {
    cerrarModal();
  });

  modalFondo.addEventListener("click", function (evento) {
    if (evento.target === modalFondo) {
      cerrarModal();
    }
  });

  formAgregar.addEventListener("submit", function (evento) {
    evento.preventDefault();
    guardarProducto();
  });

  [campoNombre, campoSku, campoCodigo].forEach(function (campo) {
    campo.addEventListener("input", function () {
      if (confirmacionPendientePara !== null) {
        confirmacionPendientePara = null;
        modalMensaje.hidden = true;
        btnGuardar.textContent = modoEdicion ? "Guardar cambios" : "Guardar";
      }
    });
  });

  function abrirModalAgregar() {
    modoEdicion = false;
    codigoOriginalEdicion = null;
    modalTitulo.textContent = "Agregar producto";
    btnGuardar.textContent = "Guardar";
    campoCodigo.disabled = false;

    modalFondo.hidden = false;
    formAgregar.reset();
    modalMensaje.hidden = true;
    modalMensaje.classList.remove("exito");
    confirmacionPendientePara = null;
    campoNombre.focus();
  }

  function abrirModalEditar() {
    if (!claveProductoActual) return;
    const producto = codigosActivos[claveProductoActual];

    modoEdicion = true;
    codigoOriginalEdicion = claveProductoActual;
    modalTitulo.textContent = "Editar producto";
    btnGuardar.textContent = "Guardar cambios";

    modalFondo.hidden = false;
    modalMensaje.hidden = true;
    modalMensaje.classList.remove("exito");
    confirmacionPendientePara = null;

    campoNombre.value = producto.nombre;
    campoSku.value = producto.skus.join(",");
    campoCodigo.value = claveProductoActual;
    campoNombre.focus();
  }

  function cerrarModal() {
    modalFondo.hidden = true;
    input.focus();
  }

  function guardarProducto() {
    const nombre = campoNombre.value.trim();
    const skusTexto = campoSku.value.trim();
    const codigo = campoCodigo.value.trim();

    if (!nombre || !skusTexto || !codigo) {
      mostrarMensajeModal("Completa los 3 campos.", false);
      return;
    }

    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      mostrarMensajeModal("Falta configurar Google Sheets (URL_APPS_SCRIPT) para poder guardar productos.", false);
      return;
    }

    const codigoAExcluir = modoEdicion ? codigoOriginalEdicion : null;
    const skusArray = skusTexto.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });

    // --- Verificar duplicados (código y cada SKU) ---
    const advertencias = [];

    const claveExistente = buscarClaveExacta(codigo);
    const esMismoCodigoOriginal = modoEdicion && claveExistente && claveExistente.toLowerCase() === codigoOriginalEdicion.toLowerCase();
    if (claveExistente && !esMismoCodigoOriginal) {
      const productoExistente = codigosActivos[claveExistente];
      advertencias.push('el código ya pertenece a "' + productoExistente.nombre + '"');
    }

    skusArray.forEach(function (sku) {
      const coincidenciaSku = buscarProductoPorSku(sku, codigoAExcluir);
      if (coincidenciaSku) {
        advertencias.push('el SKU ' + sku + ' ya pertenece a "' + coincidenciaSku.producto.nombre + '"');
      }
    });

    const claveConfirmacion = codigo.toLowerCase() + "|" + skusTexto.toLowerCase();

    if (advertencias.length > 0 && confirmacionPendientePara !== claveConfirmacion) {
      confirmacionPendientePara = claveConfirmacion;
      mostrarMensajeModal("Atención: " + advertencias.join("; ") + ". Presiona de nuevo para guardar igualmente.", false);
      btnGuardar.textContent = "Confirmar de todas formas";
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando…";

    const payload = modoEdicion
      ? { tipo: "editar_producto", codigoOriginal: codigoOriginalEdicion, codigo: codigo, skus: skusTexto, nombre: nombre, clave: CLAVE_SECRETA }
      : { tipo: "nuevo_producto", codigo: codigo, skus: skusTexto, nombre: nombre, clave: CLAVE_SECRETA };

    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      if (modoEdicion && codigoOriginalEdicion.toLowerCase() !== codigo.toLowerCase()) {
        delete codigosActivos[codigoOriginalEdicion];
      }
      codigosActivos[codigo] = { skus: skusArray, nombre: nombre };
      actualizarContador(URL_APPS_SCRIPT.indexOf("PEGA_AQUI") === -1 ? "sheets" : "local");

      mostrarMensajeModal(modoEdicion ? "Cambios guardados." : "Producto guardado.", true);

      if (modoEdicion && claveProductoActual && claveProductoActual.toLowerCase() === codigoOriginalEdicion.toLowerCase()) {
        mostrarResultadoOk(codigo, skusArray, nombre);
      }

      setTimeout(function () {
        cerrarModal();
      }, 1200);
    }).catch(function () {
      mostrarMensajeModal("No se pudo guardar (revisa tu conexión a internet).", false);
    }).finally(function () {
      btnGuardar.disabled = false;
      btnGuardar.textContent = modoEdicion ? "Guardar cambios" : "Guardar";
    });
  }

  function mostrarMensajeModal(texto, esExito) {
    modalMensaje.textContent = texto;
    modalMensaje.hidden = false;
    modalMensaje.classList.toggle("exito", !!esExito);
  }

  // ------------------------------------------------------------
  // EDITAR / ELIMINAR desde el resultado
  // ------------------------------------------------------------

  btnEditar.addEventListener("click", function () {
    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      alert("Falta configurar Google Sheets (URL_APPS_SCRIPT) para poder editar productos.");
      return;
    }
    abrirModalEditar();
  });

  btnEliminar.addEventListener("click", function () {
    if (!claveProductoActual) return;

    if (!URL_APPS_SCRIPT || URL_APPS_SCRIPT.indexOf("PEGA_AQUI") !== -1) {
      alert("Falta configurar Google Sheets (URL_APPS_SCRIPT) para poder eliminar productos.");
      return;
    }

    const producto = codigosActivos[claveProductoActual];
    const confirmado = confirm('¿Eliminar "' + producto.nombre + '"? Esta acción no se puede deshacer.');
    if (!confirmado) return;

    const codigoAEliminar = claveProductoActual;

    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tipo: "eliminar_producto", codigo: codigoAEliminar, clave: CLAVE_SECRETA })
    }).then(function () {
      delete codigosActivos[codigoAEliminar];
      actualizarContador(URL_APPS_SCRIPT.indexOf("PEGA_AQUI") === -1 ? "sheets" : "local");
      mostrarResultadoVacio();
      input.value = "";
      input.focus();
    }).catch(function () {
      alert("No se pudo eliminar (revisa tu conexión a internet).");
    });
  });
})();