/* Portal de acceso — prueba gratuita de 3 días y desbloqueo por código.
   Producción: UnoEsMarketing · Desarrollo: Erling Sánchez */
(function () {
  "use strict";
  var D = window.PLATFORM_DATA || {};
  var A = D.acceso;
  if (!A) return;

  var clave = "uem-acceso-" + D.slug;
  var DIA = 24 * 60 * 60 * 1000;

  function leer() {
    try { return JSON.parse(localStorage.getItem(clave)) || {}; }
    catch (e) { return {}; }
  }
  function guardar(s) {
    try { localStorage.setItem(clave, JSON.stringify(s)); } catch (e) {}
  }
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function hashHex(texto) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) {
      return Promise.reject(new Error("sin-crypto"));
    }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  function diasRestantes(s) {
    if (!s.inicio) return null;
    var fin = s.inicio + A.diasPrueba * DIA;
    return Math.max(0, Math.ceil((fin - Date.now()) / DIA));
  }

  function bloquear(html) {
    var velo = document.createElement("div");
    velo.className = "portal";
    velo.innerHTML = '<div class="portal-caja">' + html + "</div>";
    document.body.appendChild(velo);
    document.body.classList.add("portal-bloqueado");
    return velo;
  }
  function desbloquearUI(velo) {
    velo.remove();
    document.body.classList.remove("portal-bloqueado");
    pintarBanner();
  }

  function formCodigo() {
    return (
      '<div class="portal-codigo">' +
      '<label for="portal-input">¿Ya realizaste el pago? Ingresa tu código de acceso</label>' +
      '<div class="fila"><input id="portal-input" type="text" autocomplete="off" ' +
      'placeholder="UEM-XXXX-XXXX"><button id="portal-validar" class="btn primario">Activar</button></div>' +
      '<p class="portal-error" id="portal-error" role="alert"></p></div>'
    );
  }

  function conectarCodigo(velo) {
    var input = velo.querySelector("#portal-input");
    var err = velo.querySelector("#portal-error");
    velo.querySelector("#portal-validar").onclick = function () {
      var codigo = (input.value || "").trim().toUpperCase();
      if (!codigo) return;
      hashHex(D.slug + ":" + codigo).then(function (h) {
        if (h === A.hashCodigo) {
          var s = leer(); s.desbloqueado = true; guardar(s);
          desbloquearUI(velo);
        } else {
          err.textContent = "El código no es válido. Revisa que esté escrito tal como lo recibiste.";
        }
      }, function () {
        err.textContent = "Tu navegador no permite validar el código aquí. Escríbenos a " + A.contacto + ".";
      });
    };
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") velo.querySelector("#portal-validar").click();
    });
  }

  function botonPago() {
    return '<a class="btn primario" href="' + esc(A.paypal) + '" target="_blank" rel="noopener">' +
      "Obtener acceso completo" + (A.precio ? " · " + esc(A.precio) : "") + "</a>";
  }

  function pantallaBienvenida() {
    var velo = bloquear(
      '<p class="portal-sello">Plataforma de enseñanza · UnoEsMarketing</p>' +
      "<h2>" + esc(D.titulo) + "</h2>" +
      '<p class="portal-texto">Accede al libro completo y a sus materiales de práctica. ' +
      "Tienes <strong>" + A.diasPrueba + " días de prueba gratuita</strong>; después, el acceso " +
      "completo se activa con un pago único" + (A.precio ? " de " + esc(A.precio) : "") + ".</p>" +
      '<div class="portal-acciones">' +
      '<button id="portal-empezar" class="btn primario">Comenzar mis ' + A.diasPrueba + " días gratis</button>" +
      botonPago().replace("btn primario", "btn secundario") +
      "</div>" + formCodigo() +
      '<p class="portal-pie">Agencia Productora: UnoEsMarketing · Desarrollador: Erling Sánchez</p>'
    );
    velo.querySelector("#portal-empezar").onclick = function () {
      var s = leer(); s.inicio = Date.now(); guardar(s);
      desbloquearUI(velo);
    };
    conectarCodigo(velo);
  }

  function pantallaVencida() {
    var velo = bloquear(
      '<p class="portal-sello">Plataforma de enseñanza · UnoEsMarketing</p>' +
      "<h2>Tu prueba gratuita terminó</h2>" +
      '<p class="portal-texto">Esperamos que estos días con <strong>' + esc(D.titulo) +
      "</strong> te hayan servido. Para seguir leyendo el libro y usar los materiales, " +
      "activa el acceso completo con un pago único" + (A.precio ? " de " + esc(A.precio) : "") + ". " +
      "Tras el pago recibirás tu código de acceso.</p>" +
      '<div class="portal-acciones">' + botonPago() + "</div>" + formCodigo() +
      '<p class="portal-pie">¿Dudas con tu pago o tu código? Escríbenos: ' + esc(A.contacto) + "</p>"
    );
    conectarCodigo(velo);
  }

  function pintarBanner() {
    var s = leer();
    if (s.desbloqueado) return;
    var dias = diasRestantes(s);
    if (dias == null || dias <= 0) return;
    var b = document.createElement("div");
    b.className = "portal-banner";
    b.innerHTML = "Prueba gratuita: " +
      (dias === 1 ? "te queda menos de un día" : "te quedan " + dias + " días") +
      ' <a href="' + esc(A.paypal) + '" target="_blank" rel="noopener">Obtener acceso completo' +
      (A.precio ? " · " + esc(A.precio) : "") + "</a>";
    document.querySelector(".main").insertBefore(b, document.querySelector(".content"));
  }

  var s = leer();
  if (s.desbloqueado) return;
  if (!s.inicio) { pantallaBienvenida(); return; }
  if (diasRestantes(s) <= 0) { pantallaVencida(); return; }
  pintarBanner();
})();
