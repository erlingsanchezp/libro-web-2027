/* Plataforma de estudio — lógica de navegación y progreso.
   Producción: UnoEsMarketing · Desarrollo: Erling Sánchez */
(function () {
  "use strict";
  var D = window.PLATFORM_DATA;
  if (!D) { document.body.innerHTML = "<p style='padding:40px'>No se encontraron los datos de la plataforma.</p>"; return; }

  var claveProgreso = "uem-progreso-" + D.slug;

  function leerProgreso() {
    try {
      var raw = localStorage.getItem(claveProgreso);
      return raw ? JSON.parse(raw) : { leidos: [], ultimo: null };
    } catch (e) { return { leidos: [], ultimo: null }; }
  }
  function guardarProgreso(p) {
    try { localStorage.setItem(claveProgreso, JSON.stringify(p)); } catch (e) { /* sin almacenamiento */ }
  }

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  /* ---------- Sidebar ---------- */

  function renderIndice() {
    var html = "";
    var parteActual = null;
    D.capitulos.forEach(function (c, i) {
      if (c.parte && c.parte !== parteActual) {
        parteActual = c.parte;
        html += '<div class="parte">' + esc(c.parte) + "</div>";
      }
      html +=
        '<a class="cap" data-i="' + i + '" href="#/libro/' + i + '">' +
        '<span class="num">' + (c.num || "·") + "</span>" +
        '<span class="titulo">' + esc(c.titulo) + "</span></a>";
    });
    $("#indice").innerHTML = html;
  }

  function pintarEstadoIndice(actual) {
    var p = leerProgreso();
    document.querySelectorAll("#indice a.cap").forEach(function (a) {
      var i = Number(a.getAttribute("data-i"));
      a.classList.toggle("activa", i === actual);
      a.classList.toggle("leido", p.leidos.indexOf(i) >= 0);
    });
    var pct = Math.round((p.leidos.length / D.capitulos.length) * 100);
    $("#pct").textContent = pct + "%";
    $("#barra-i").style.width = pct + "%";
  }

  /* ---------- Vistas ---------- */

  function vistaPortada() {
    var p = leerProgreso();
    var continuar = p.ultimo != null && p.ultimo < D.capitulos.length ? p.ultimo : 0;
    var datos = D.datos.map(function (d) {
      return "<div><b>" + esc(d.valor) + "</b>" + esc(d.etiqueta) + "</div>";
    }).join("");
    var accionExtra = D.cta
      ? '<a class="btn secundario" href="' + D.cta.href + '">' + esc(D.cta.texto) + "</a>"
      : '<a class="btn secundario" href="#/practicas">' + esc(D.nombrePracticas) + "</a>";
    return (
      '<div class="portada">' +
      '<p class="sello">Plataforma digital de enseñanza de <b>UnoEsMarketing</b></p>' +
      "<h2>" + esc(D.titulo) + "</h2>" +
      '<p class="bajada">' + esc(D.bajada) + "</p>" +
      '<div class="datos">' + datos + "</div>" +
      '<div class="acciones">' +
      '<a class="btn primario" href="#/libro/' + continuar + '">' +
      (p.leidos.length ? "Continuar la lectura" : "Empezar a leer") + "</a>" +
      accionExtra +
      "</div>" +
      '<p class="creditos-linea">Agencia Productora: UnoEsMarketing &nbsp;·&nbsp; Desarrollador: Erling Sánchez</p>' +
      "</div>"
    );
  }

  function vistaCapitulo(i) {
    var c = D.capitulos[i];
    if (!c) return vistaPortada();
    var p = leerProgreso();
    var hecho = p.leidos.indexOf(i) >= 0;
    var nav = "";
    if (i > 0) nav += '<a class="btn secundario" href="#/libro/' + (i - 1) + '">Capítulo anterior</a>';
    nav += '<span class="espacio"></span>';
    nav += '<button class="btn marcar' + (hecho ? " hecho" : "") + '" id="btn-marcar">' +
      (hecho ? "Capítulo completado" : "Marcar como completado") + "</button>";
    if (i < D.capitulos.length - 1) nav += '<a class="btn primario" href="#/libro/' + (i + 1) + '">Siguiente capítulo</a>';
    return (
      '<div class="lector">' +
      '<p class="cap-etiqueta">' + esc(c.etiqueta) + "</p>" +
      '<h2 class="cap-titulo">' + esc(c.titulo) + "</h2>" +
      '<div class="prosa">' + c.html + "</div>" +
      "</div>" +
      '<div class="pie-capitulo">' + nav + "</div>"
    );
  }

  function itemRecurso(grupoIdx, itemIdx, it) {
    return (
      '<button class="item-rec" data-g="' + grupoIdx + '" data-r="' + itemIdx + '">' +
      '<span class="nombre">' + esc(it.nombre) + "</span>" +
      '<span class="tipo">' + esc(it.tipo) + "</span></button>"
    );
  }

  function vistaPracticas() {
    var html = '<div class="recursos"><h2>' + esc(D.nombrePracticas) + "</h2>" +
      '<p class="intro">' + esc(D.introPracticas) + "</p>";
    D.recursos.forEach(function (g, gi) {
      html += '<div class="grupo-rec"><h3>' + esc(g.grupo) + "</h3>";
      if (g.desc) html += '<p class="desc">' + esc(g.desc) + "</p>";
      if (g.prompts) {
        g.prompts.forEach(function (pr, pi) {
          html +=
            '<div class="prompt-card"><h4>' + esc(pr.nombre) + "</h4>" +
            "<pre>" + esc(pr.texto) + "</pre>" +
            '<button data-copiar="' + gi + "-" + pi + '">Copiar prompt</button></div>';
        });
      } else {
        html += '<div class="lista-rec">' +
          g.items.map(function (it, ri) { return itemRecurso(gi, ri, it); }).join("") +
          "</div>";
      }
      html += "</div>";
    });
    html += '<div id="visor-sitio"></div></div>';
    return html;
  }

  function abrirRecurso(gi, ri) {
    var it = D.recursos[gi].items[ri];
    var cuerpo = it.htmlRender
      ? '<div class="visor-cuerpo prosa">' + it.contenido + "</div>"
      : '<div class="visor-cuerpo"><pre class="codigo">' + esc(it.contenido) + "</pre></div>";
    $("#visor-sitio").innerHTML =
      '<div class="visor"><div class="visor-cab"><span>' + esc(it.nombre) + "</span>" +
      '<span class="espacio"></span>' +
      '<button id="btn-copiar-rec">Copiar contenido</button>' +
      '<button id="btn-cerrar-rec">Cerrar</button></div>' + cuerpo + "</div>";
    $("#btn-cerrar-rec").onclick = function () { $("#visor-sitio").innerHTML = ""; };
    $("#btn-copiar-rec").onclick = function () { copiar(it.contenido, this); };
    $("#visor-sitio").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copiar(texto, btn) {
    function ok() { var t = btn.textContent; btn.classList.add("copiado"); btn.textContent = "Copiado"; setTimeout(function () { btn.classList.remove("copiado"); btn.textContent = t; }, 1600); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(ok, function () { ok(); });
      } else { ok(); }
    } catch (e) { ok(); }
  }

  function vistaCreditos() {
    return (
      '<div class="vista-creditos"><h2>Créditos</h2>' +
      '<div class="ficha-credito"><div class="rol">Agencia Productora</div>' +
      '<div class="quien">UnoEsMarketing</div>' +
      '<div class="nota">Performance First · proyectos@unoesmarketing.com · unoesmarketing.com</div></div>' +
      '<div class="ficha-credito"><div class="rol">Desarrollador</div>' +
      '<div class="quien">Erling Sánchez</div>' +
      '<div class="nota">erlingsanchez.com</div></div>' +
      '<p class="legal">' + esc(D.notaEdicion) + "</p>" +
      "</div>"
    );
  }

  /* ---------- Router ---------- */

  function ruta() {
    var h = location.hash.replace(/^#\/?/, "");
    var partes = h.split("/");
    var vista = partes[0] || "inicio";
    var contenido = $("#contenido");
    var capActual = -1;

    if (vista === "libro") {
      var i = Math.max(0, Math.min(D.capitulos.length - 1, Number(partes[1]) || 0));
      capActual = i;
      contenido.innerHTML = vistaCapitulo(i);
      $("#miga").innerHTML = "<b>" + esc(D.titulo) + "</b> — " + esc(D.capitulos[i].etiqueta);
      var p = leerProgreso();
      p.ultimo = i; guardarProgreso(p);
      var btn = $("#btn-marcar");
      if (btn) btn.onclick = function () {
        var pr = leerProgreso();
        var pos = pr.leidos.indexOf(i);
        if (pos >= 0) pr.leidos.splice(pos, 1); else pr.leidos.push(i);
        guardarProgreso(pr);
        ruta();
      };
    } else if (vista === "practicas") {
      contenido.innerHTML = vistaPracticas();
      $("#miga").innerHTML = "<b>" + esc(D.titulo) + "</b> — " + esc(D.nombrePracticas);
      contenido.querySelectorAll(".item-rec").forEach(function (b) {
        b.onclick = function () { abrirRecurso(Number(b.getAttribute("data-g")), Number(b.getAttribute("data-r"))); };
      });
      contenido.querySelectorAll("[data-copiar]").forEach(function (b) {
        b.onclick = function () {
          var idx = b.getAttribute("data-copiar").split("-");
          copiar(D.recursos[Number(idx[0])].prompts[Number(idx[1])].texto, b);
        };
      });
    } else if (vista === "creditos") {
      contenido.innerHTML = vistaCreditos();
      $("#miga").innerHTML = "<b>" + esc(D.titulo) + "</b> — Créditos";
    } else {
      contenido.innerHTML = vistaPortada();
      $("#miga").innerHTML = "<b>" + esc(D.titulo) + "</b>";
    }

    document.querySelectorAll(".nav-vistas a").forEach(function (a) {
      a.classList.toggle("activa", a.getAttribute("data-vista") === vista ||
        (vista === "inicio" && a.getAttribute("data-vista") === "inicio"));
    });
    pintarEstadoIndice(capActual);
    cerrarSidebar();
    window.scrollTo(0, 0);
  }

  /* ---------- Menú móvil ---------- */

  function cerrarSidebar() {
    $("#sidebar").classList.remove("abierta");
    $("#velo").classList.remove("visible");
  }
  $("#btn-menu").onclick = function () {
    $("#sidebar").classList.add("abierta");
    $("#velo").classList.add("visible");
  };
  $("#velo").onclick = cerrarSidebar;

  renderIndice();
  window.addEventListener("hashchange", ruta);
  ruta();
})();
