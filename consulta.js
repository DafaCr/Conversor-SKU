// ============================================================
// CONSULTA.JS — Lógica de la página de consulta DNI/RUC
// ------------------------------------------------------------
// Llama directo a la API de Factiliza desde el navegador usando
// TOKEN_FACTILIZA (definido en config.js).
// ============================================================

(function () {
  "use strict";

  const input = document.getElementById("input-documento");
  const resultado = document.getElementById("resultado-doc");
  const filasDoc = document.getElementById("filas-doc");
  const mensajeError = document.getElementById("mensaje-error-doc");

  // Controla el comportamiento de "doble Enter": el primer Enter
  // busca: el segundo Enter (sin cambiar el texto) copia el número.
  let resultadoListo = false;
  let numeroActual = null;
  let botonNumeroActual = null;

  window.addEventListener("load", function () {
    input.focus();
  });

  // Escape vuelve al conversor principal, sin importar dónde
  // esté el foco en ese momento.
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      window.location.href = "/";
    }
  });

  document.addEventListener("click", function (evento) {
    const tocaBotonCopiar = evento.target.closest && evento.target.closest(".sku-copiar");
    if (!tocaBotonCopiar) {
      input.focus();
    }
  });

  input.addEventListener("input", function () {
    const limpio = input.value.replace(/\D/g, "");
    if (limpio !== input.value) {
      input.value = limpio;
    }
    // Si el usuario escribe algo distinto, ya no estamos en modo
    // "resultado listo": el próximo Enter debe buscar de nuevo.
    resultadoListo = false;
  });

  input.addEventListener("keydown", function (evento) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();

    if (resultadoListo && numeroActual) {
      copiarAlPortapapeles(numeroActual, botonNumeroActual);
      return;
    }

    consultarDocumento();
  });

  function consultarDocumento() {
    const consulta = input.value.trim();
    if (!consulta) return;

    mostrarCargando();

    const soloDigitos = consulta.replace(/\D/g, "");

    if (!soloDigitos) {
      mostrarError("Número inválido.");
      return;
    }

    const esRuc = soloDigitos.length === 11;
    const url = esRuc
      ? "https://api.factiliza.com/v1/ruc/info/" + soloDigitos
      : "https://api.factiliza.com/v1/dni/info/" + soloDigitos;

    fetch(url, {
      headers: { Authorization: "Bearer " + TOKEN_FACTILIZA }
    })
      .then(function (respuesta) { return respuesta.json(); })
      .then(function (datos) {
        if (!datos || !datos.success) {
          mostrarError((datos && datos.message) || "No se encontró información para ese documento.");
          return;
        }

        const nombre = esRuc ? datos.data.nombre_o_razon_social : datos.data.nombre_completo;
        const numero = datos.data.numero;

        mostrarResultado({
          tipo: esRuc ? "ruc" : "dni",
          nombre: nombre,
          numero: numero
        });
      })
      .catch(function () {
        mostrarError("No se pudo conectar con Factiliza. Revisa tu internet.");
      });
  }

  function mostrarCargando() {
    resultado.classList.remove("resultado--ok", "resultado--error");
    resultado.classList.add("resultado--vacio");
    mensajeError.hidden = true;
    resultadoListo = false;

    filasDoc.innerHTML = "";
    const fila = document.createElement("div");
    fila.className = "sku-fila sku-fila--vacia";
    const texto = document.createElement("span");
    texto.className = "sku-valor";
    texto.textContent = "Buscando…";
    fila.appendChild(texto);
    filasDoc.appendChild(fila);
  }

  function mostrarResultado(datos) {
    resultado.classList.remove("resultado--vacio", "resultado--error");
    resultado.classList.add("resultado--ok");
    mensajeError.hidden = true;
    filasDoc.innerHTML = "";

    const filaNombre = crearFila("Nombre completo", datos.nombre);
    filasDoc.appendChild(filaNombre.fila);

    const etiquetaNumero = datos.tipo === "ruc" ? "Número de RUC" : "Número de DNI";
    const filaNumero = crearFila(etiquetaNumero, datos.numero);
    filasDoc.appendChild(filaNumero.fila);

    numeroActual = datos.numero;
    botonNumeroActual = filaNumero.boton;
    resultadoListo = true;

    // Se copia automático el nombre completo en cuanto aparece,
    // igual que el primer SKU en un combo del conversor principal.
    copiarAlPortapapeles(datos.nombre, filaNombre.boton);

    input.select();
  }

  function mostrarError(texto) {
    resultado.classList.remove("resultado--vacio", "resultado--ok");
    resultadoListo = false;
    filasDoc.innerHTML = "";
    mensajeError.textContent = texto;
    mensajeError.hidden = false;

    resultado.classList.remove("resultado--error");
    void resultado.offsetWidth; // fuerza un reflow, reinicia la animación
    resultado.classList.add("resultado--error");
  }

  function crearFila(etiquetaTexto, valorTexto) {
    const fila = document.createElement("div");
    fila.className = "sku-fila";

    const etiqueta = document.createElement("span");
    etiqueta.className = "sku-etiqueta";
    etiqueta.textContent = etiquetaTexto;

    const valor = document.createElement("span");
    valor.className = "sku-valor";
    valor.textContent = valorTexto;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sku-copiar";
    boton.textContent = "Copiar";
    boton.addEventListener("click", function () {
      copiarAlPortapapeles(valorTexto, boton);
    });

    fila.appendChild(etiqueta);
    fila.appendChild(valor);
    fila.appendChild(boton);

    return { fila: fila, boton: boton };
  }

  function copiarAlPortapapeles(valor, boton) {
    if (!boton || !navigator.clipboard) return;

    navigator.clipboard.writeText(valor).then(function () {
      const original = "Copiar";
      boton.textContent = "¡Copiado!";
      boton.classList.add("copiado");
      setTimeout(function () {
        boton.textContent = original;
        boton.classList.remove("copiado");
      }, 1200);
    }).catch(function () {
      // El botón "Copiar" sigue funcionando manualmente.
    });
  }
})();