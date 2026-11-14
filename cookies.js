/* Saus360 · aviso de cookies (LGPD, art. 7º e 8º)
   Site: o essencial funciona sempre; a contagem de visitas só guarda um identificador do aparelho
   ("saus360-v") depois do "Aceitar". Sem aceite, cada visita é contada sem nada salvo no aparelho.
   App web (data-modo="app"): só há armazenamento essencial (login e preferências), então o aviso é informativo.
   Estilos aplicados por JS (CSSOM) para funcionar mesmo com Content-Security-Policy restrita. */
(function () {
  "use strict";
  var K = "saus360-cookies", atual = null;
  try { atual = localStorage.getItem(K); } catch (e) { return; }
  var me = document.currentScript, app = !!(me && me.getAttribute("data-modo") === "app");
  if (atual === "sim" || (atual === "nao" && !app) || (app && atual)) return;

  var lang = "pt";
  try { lang = localStorage.getItem("saus360-idioma") || ""; } catch (e) {}
  if (lang !== "es" && lang !== "pt") lang = /^es/i.test(document.documentElement.lang || navigator.language || "") ? "es" : "pt";
  var T = {
    pt: {
      site: "Usamos cookies essenciais para o site funcionar. Com a sua permissão, também lembramos este aparelho para contar visitas, sem identificar você. Sem anúncios e sem venda de dados.",
      app: "O Saus360 guarda neste aparelho só o essencial: o seu login e as suas preferências. Não usamos cookies de anúncio nem de rastreamento.",
      sim: "Aceitar", nao: "Só os essenciais", ok: "Entendi", rot: "Aviso de cookies"
    },
    es: {
      site: "Usamos cookies esenciales para que el sitio funcione. Con tu permiso, también recordamos este dispositivo para contar visitas, sin identificarte. Sin anuncios y sin venta de datos.",
      app: "Saus360 guarda en este dispositivo solo lo esencial: tu inicio de sesión y tus preferencias. No usamos cookies de anuncios ni de rastreo.",
      sim: "Aceptar", nao: "Solo las esenciales", ok: "Entendido", rot: "Aviso de cookies"
    }
  }[lang];

  function mostrar() {
    var escuro = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    var cx = document.createElement("div");
    cx.setAttribute("role", "region"); cx.setAttribute("aria-label", T.rot);
    cx.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:560px;margin:0 auto;padding:16px 16px 14px;border-radius:14px;"
      + "font:15px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-shadow:0 10px 30px rgba(17,19,28,.22);"
      + (escuro ? "background:#1b1e2b;color:#ecebe6;border:1px solid #2f3346;" : "background:#fff;color:#22243a;border:1px solid #e3e1d8;");
    var p = document.createElement("p");
    p.style.cssText = "margin:0 0 12px"; p.textContent = app ? T.app : T.site;
    cx.appendChild(p);
    var linha = document.createElement("div");
    linha.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end";
    function botao(txt, prim, valor) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = txt;
      b.style.cssText = "font:600 15px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:10px 16px;border-radius:10px;cursor:pointer;min-height:44px;"
        + (prim ? "background:#464b71;color:#fff;border:1px solid #464b71;" : "background:transparent;color:inherit;border:1px solid " + (escuro ? "#4a4f68" : "#c9c6ba") + ";");
      b.addEventListener("click", function () {
        try { localStorage.setItem(K, valor); if (valor === "nao") localStorage.removeItem("saus360-v"); } catch (e) {}
        cx.remove();
        try { window.dispatchEvent(new CustomEvent("saus360-cookies", { detail: valor })); } catch (e) {}
      });
      return b;
    }
    if (app) linha.appendChild(botao(T.ok, true, "ok"));
    else { linha.appendChild(botao(T.nao, false, "nao")); linha.appendChild(botao(T.sim, true, "sim")); }
    cx.appendChild(linha);
    document.body.appendChild(cx);
  }
  if (document.body) mostrar(); else document.addEventListener("DOMContentLoaded", mostrar);
})();
