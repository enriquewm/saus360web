(() => {
  // src/supa.js
  var SUPA_URL = "https://ojnjfrqzwjbyhmjqxirl.supabase.co";
  var SUPA_KEY = "sb_publishable_ItdXRy3sCa040UKmvU2FVQ_aRyF3FPT";
  var SITE = location.origin + location.pathname.replace(/[^/]*$/, "");
  var CHAVE = "s360eq-sessao";
  var ErroApi = class extends Error {
    constructor(msg, status, codigo) {
      super(msg);
      this.status = status;
      this.codigo = codigo || "";
    }
  };
  var sessao = ler();
  var aoExpirar = null;
  function quandoExpirar(fn) {
    aoExpirar = fn;
  }
  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) || "null");
    } catch (e) {
      return null;
    }
  }
  function gravar(s) {
    sessao = s;
    try {
      s ? localStorage.setItem(CHAVE, JSON.stringify(s)) : localStorage.removeItem(CHAVE);
    } catch (e) {
    }
  }
  function guardarSessao(d) {
    gravar({
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: Number(d.expires_at) || Math.floor(Date.now() / 1e3) + (Number(d.expires_in) || 3600),
      user: d.user || sessao && sessao.user || null
    });
  }
  var temSessao = () => !!(sessao && sessao.refresh_token);
  var esquecerSessao = () => gravar(null);
  function claims() {
    try {
      const p = sessao.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(atob(p).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
    } catch (e) {
      return {};
    }
  }
  var aal = () => claims().aal || "aal1";
  async function req(caminho, o = {}) {
    const h = { apikey: SUPA_KEY, "Content-Type": "application/json" };
    if (o.token !== false) {
      const t = await tokenValido();
      if (t) h.Authorization = "Bearer " + t;
    }
    let r;
    try {
      r = await fetch(SUPA_URL + caminho, { method: o.metodo || "POST", headers: h, body: o.corpo === void 0 ? void 0 : JSON.stringify(o.corpo) });
    } catch (e) {
      throw new ErroApi("Sin conexión. Revisa internet e inténtalo de nuevo.", 0, "rede");
    }
    const txt = await r.text();
    let d = null;
    try {
      d = txt ? JSON.parse(txt) : null;
    } catch (e) {
      d = txt;
    }
    if (!r.ok) {
      const msg = d && typeof d === "object" && (d.message || d.msg || d.error_description || (typeof d.erro === "string" && d.erro.length > 12 ? d.erro : "")) || "";
      throw new ErroApi(msg || "Algo salió mal (" + r.status + "). Inténtalo de nuevo.", r.status, d && typeof d === "object" ? d.error_code || d.erro || d.code || "" : "");
    }
    return d;
  }
  var renovando = null;
  async function tokenValido() {
    if (!sessao) return null;
    if (sessao.expires_at - 60 > Date.now() / 1e3) return sessao.access_token;
    if (!renovando) renovando = renovar().finally(() => {
      renovando = null;
    });
    return renovando;
  }
  async function renovar() {
    try {
      const d = await req("/auth/v1/token?grant_type=refresh_token", { corpo: { refresh_token: sessao.refresh_token }, token: false });
      guardarSessao(d);
      return d.access_token;
    } catch (e) {
      if (e.status >= 400 && e.status < 500) {
        gravar(null);
        if (aoExpirar) aoExpirar();
      }
      throw e;
    }
  }
  var forcarRenovacao = async () => {
    if (sessao) {
      sessao.expires_at = 0;
      await tokenValido();
    }
  };
  var comVolta = (caminho) => caminho + (caminho.includes("?") ? "&" : "?") + "redirect_to=" + encodeURIComponent(SITE);
  var rpc = (fn, args) => req("/rest/v1/rpc/" + fn, { corpo: args || {} });
  var ler_ = (tabela, filtro) => req("/rest/v1/" + tabela + "?" + filtro, { metodo: "GET" });
  var funcao = (nome, corpo) => req("/functions/v1/" + nome, { corpo });
  var auth = {
    entrar: async (email, senha) => {
      const d = await req("/functions/v1/equipe-entrar", { corpo: { email, senha }, token: false });
      guardarSessao(d);
      return d;
    },
    conferirSenha: (email, senha) => req("/functions/v1/equipe-entrar", { corpo: { email, senha, modo: "verificar" }, token: false }),
    criarConta: (email, senha, nome) => req(comVolta("/auth/v1/signup"), { corpo: { email, password: senha, data: { nome } }, token: false }),
    reenviarConfirmacao: (email) => req(comVolta("/auth/v1/resend"), { corpo: { type: "signup", email }, token: false }),
    confirmarCodigo: async (email, codigo, tipo) => {
      const d = await req("/auth/v1/verify", { corpo: { type: tipo || "signup", email, token: codigo }, token: false });
      if (d && d.access_token) guardarSessao(d);
      return d;
    },
    esqueci: (email) => req(comVolta("/auth/v1/recover"), { corpo: { email }, token: false }),
    definirSenha: (senha) => req("/auth/v1/user", { metodo: "PUT", corpo: { password: senha } }),
    usuario: () => req("/auth/v1/user", { metodo: "GET" }),
    sair: async (escopo) => {
      try {
        await req("/auth/v1/logout?scope=" + (escopo || "local"), {});
      } catch (e) {
      }
      gravar(null);
    },
    microsoft: () => {
      location.href = SUPA_URL + "/auth/v1/authorize?provider=azure&scopes=email&redirect_to=" + encodeURIComponent(SITE);
    },
    /* Verificação em duas etapas (TOTP) */
    fatores: async () => (await req("/auth/v1/user", { metodo: "GET" })).factors || [],
    inscrever: () => req("/auth/v1/factors", { corpo: { factor_type: "totp", friendly_name: "Saus360 Equipe " + Date.now().toString(36), issuer: "Saus360 Equipe" } }),
    confirmarFator: async (id, codigo) => {
      const c = await req("/auth/v1/factors/" + id + "/challenge", { corpo: {} });
      const d = await req("/auth/v1/factors/" + id + "/verify", { corpo: { challenge_id: c.id, code: codigo } });
      guardarSessao(d);
      return d;
    },
    removerFator: (id) => req("/auth/v1/factors/" + id, { metodo: "DELETE" })
  };
  function lerRetornoDoLink() {
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    const q = new URLSearchParams(location.search);
    const erro2 = h.get("error_description") || q.get("error_description");
    const codigoErro = h.get("error_code") || q.get("error_code") || "";
    const limpar = () => history.replaceState(null, "", location.pathname);
    if (erro2) {
      limpar();
      return { erro: codigoErro === "otp_expired" ? "expirado" : "invalido" };
    }
    if (h.get("access_token") && h.get("refresh_token")) {
      guardarSessao({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_at: h.get("expires_at"), expires_in: h.get("expires_in") });
      limpar();
      return { tipo: h.get("type") || (h.get("provider_token") || h.get("provider_refresh_token") ? "oauth" : "link") };
    }
    return null;
  }

  // src/util.js
  var esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var lang = () => document.documentElement.lang === "es" ? "es" : "pt-BR";
  function horas(n) {
    const v = Math.round((Number(n) || 0) * 10) / 10;
    return v.toLocaleString(lang(), { maximumFractionDigits: 1 }) + " h";
  }
  var numero = (v) => {
    const n = Number(String(v == null ? "" : v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };
  function dataHora(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(lang(), { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString(lang(), { hour: "2-digit", minute: "2-digit" });
  }
  function data(iso) {
    if (!iso) return "—";
    const d = new Date(String(iso).length === 10 ? iso + "T12:00:00" : iso);
    return d.toLocaleDateString(lang(), { day: "2-digit", month: "short", year: "numeric" });
  }
  function haQuanto(iso) {
    if (!iso) return "nunca";
    const s = (Date.now() - new Date(iso).getTime()) / 1e3;
    if (s < 90) return "hace un momento";
    if (s < 3600) return "hace " + Math.round(s / 60) + " min";
    if (s < 86400) return "hace " + Math.round(s / 3600) + " h";
    return dataHora(iso);
  }
  function segundaDe(d) {
    const x = new Date(d || Date.now());
    x.setHours(12, 0, 0, 0);
    const dia = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - dia);
    return x;
  }
  function rotuloSemana(seg) {
    const fim = new Date(seg);
    fim.setDate(fim.getDate() + 4);
    const o = { day: "numeric", month: "short" };
    return seg.toLocaleDateString(lang(), o) + " – " + fim.toLocaleDateString(lang(), o);
  }
  function regrasSenha(s) {
    s = s || "";
    return { tamanho: s.length >= 10, letra: /[A-Za-zÀ-ÿ]/.test(s), numero: /\d/.test(s) };
  }
  var senhaOk = (s) => {
    const r = regrasSenha(s);
    return r.tamanho && r.letra && r.numero;
  };
  function forcaSenha(s) {
    s = s || "";
    if (!s) return 0;
    let p = 0;
    if (s.length >= 10) p++;
    if (s.length >= 14) p++;
    if (/[a-z]/.test(s) && /[A-Z]/.test(s)) p++;
    if (/\d/.test(s)) p++;
    if (/[^A-Za-z0-9]/.test(s)) p++;
    return Math.min(3, Math.max(1, Math.round(p * 3 / 5)));
  }
  function aparelho(ua) {
    ua = ua || "";
    if (!ua) return "—";
    const nav = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Deno|node|curl/i.test(ua) ? "Servidor" : "Navegador";
    const so = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
    return so ? nav + " en " + so : nav;
  }
  function aplicarMedidas(raiz) {
    raiz.querySelectorAll("[data-w]").forEach((el) => {
      el.style.width = Math.max(0, Math.min(100, Number(el.dataset.w) || 0)) + "%";
    });
    raiz.querySelectorAll("[data-x]").forEach((el) => {
      el.style.left = Math.max(0, Math.min(100, Number(el.dataset.x) || 0)) + "%";
    });
    raiz.querySelectorAll("[data-cap]").forEach((el) => {
      el.style.setProperty("--passo", 100 / Math.max(1, Number(el.dataset.cap) || 1) + "%");
    });
  }
  var P = {
    semana: '<path d="M4 6.5h16M4 6.5v12h16v-12M8 3.5v4M16 3.5v4M7.5 11h3M13.5 11h3M7.5 14.5h3"/>',
    lista: '<path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
    caixa: '<path d="M4 13.5l2.4-7.2A1.5 1.5 0 017.8 5.3h8.4a1.5 1.5 0 011.4 1L20 13.5M4 13.5v4.5a1 1 0 001 1h14a1 1 0 001-1v-4.5M4 13.5h4.5l1.2 2.2h4.6l1.2-2.2H20"/>',
    equipe: '<path d="M9 11a3.2 3.2 0 100-6.4A3.2 3.2 0 009 11zM3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M16 11.2a2.8 2.8 0 100-5.6M17.4 14.4c1.7.5 2.8 2 3.1 4.6"/>',
    projetos: '<path d="M3.5 7.5a1.5 1.5 0 011.5-1.5h4.2l1.8 2h8a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5z"/>',
    auditoria: '<path d="M12 3.5l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9v-5zM9 12l2.2 2.2L15.5 10"/>',
    admin: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 13.5l1.4 1.1-1.8 3.1-1.7-.6a7 7 0 01-2 1.2l-.3 1.7h-3.6l-.3-1.7a7 7 0 01-2-1.2l-1.7.6-1.8-3.1 1.4-1.1a7 7 0 010-2.4L3.6 9.4l1.8-3.1 1.7.6a7 7 0 012-1.2l.3-1.7H13l.3 1.7a7 7 0 012 1.2l1.7-.6 1.8 3.1-1.4 1.1a7 7 0 010 2.4z"/>',
    saus: '<path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6"/>',
    conta: '<path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/>',
    sair: '<path d="M14 4.5h4.5a1 1 0 011 1v13a1 1 0 01-1 1H14M10 8l-4 4 4 4M6 12h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    escudo: '<path d="M12 3.5l7 3v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9v-5z"/>',
    copiar: '<path d="M9 9h10v10H9zM5 15V5h10"/>',
    sino: '<path d="M6 16.5V11a6 6 0 1112 0v5.5l1.5 2h-15zM10 20.5h4"/>',
    seta: '<path d="M14.5 6l-6 6 6 6"/>'
  };
  var ico = (n, cls) => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

  // src/regua.js
  function regua(o) {
    const cap = Math.max(0, Number(o.capacidade) || 0);
    const rotina = Math.max(0, Number(o.rotina) || 0), aus = Math.max(0, Number(o.ausencias) || 0);
    const apr = Math.max(0, Number(o.aprovadas) || 0), pend = Math.max(0, Number(o.pendentes) || 0);
    const usado = rotina + aus + apr, livre = cap - usado;
    const escala = Math.max(cap, usado + pend, 1);
    const p = (v) => v / escala * 100;
    const dentro = Math.max(0, Math.min(apr, cap - rotina - aus)), fora = apr - dentro;
    const marcas = [];
    const passo = escala > 60 ? 20 : 10;
    for (let h = 0; h < escala - passo / 3; h += passo) marcas.push(h);
    marcas.push(escala);
    const resumo = `${o.titulo ? o.titulo + ": " : ""}capacidad ${horas(cap)}, rutina fija ${horas(rotina)}, ausencias ${horas(aus)}, aprobadas ${horas(apr)}, pendientes ${horas(pend)}, ${livre >= 0 ? "libres " + horas(livre) : "por encima de la capacidad " + horas(-livre)}`;
    return `<div class="regua" role="img" aria-label="${esc(resumo)}">
  <div class="regua-topo"><b>${esc(o.titulo || "")}</b><span class="livre${livre <= 0 ? " zero" : ""}">${livre >= 0 ? horas(livre) + " libres" : horas(-livre) + " por encima de la capacidad"}</span></div>
  <div class="regua-trilho">
    <span class="seg seg-rotina" data-w="${p(rotina)}"></span><span class="seg seg-ausencia" data-w="${p(aus)}"></span><span class="seg seg-aprovada" data-w="${p(dentro)}"></span><span class="seg seg-excesso" data-w="${p(fora)}"></span><span class="seg seg-pendente" data-w="${p(pend)}"></span>
  </div>
  <div class="regua-escala" data-cap="${escala}">${marcas.map((h) => `<span data-x="${p(h)}">${horas(h)}</span>`).join("")}</div>
  <div class="regua-legenda">
    <span><i class="seg-rotina"></i>Rutina fija ${horas(rotina)}</span>
    <span><i class="seg-ausencia"></i>Ausencias ${horas(aus)}</span>
    <span><i class="seg-aprovada"></i>Aprobadas ${horas(apr)}</span>
    <span><i class="seg-pendente"></i>Pendientes ${horas(pend)}</span>
    <span><i class="livre-ic"></i>Libre ${horas(Math.max(0, livre))}</span>
  </div>
</div>`;
  }

  // src/marca.js
  function marcaSaus(v, fundo, tam) {
    const T = {
      claro: { a1: "#464B71", a2: "#118AB2", b1: "#118AB2", b2: "#7CD5C7", top: "#6A70A0", esq: "#464B71", dir: "#33385C", linha: "#FFFFFF", halo: "#FFFFFF" },
      escuro: { a1: "#2B9FCB", a2: "#47BEDD", b1: "#47BEDD", b2: "#7CD5C7", top: "#FFFFFF", esq: "#E4E7EF", dir: "#C3C9DA", linha: "#464B71", halo: "#464B71" },
      branco: { a1: "#FFFFFF", a2: "#F2F2ED", b1: "#F2F2ED", b2: "#C9F0EA", top: "#6A70A0", esq: "#464B71", dir: "#33385C", linha: "#FFFFFF", halo: "#118AB2" }
    };
    const c = T[v] || T.claro, h = fundo || c.halo, id = "ms" + (T[v] ? v : "claro"), s = tam ? ` width="${tam}" height="${tam}"` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${s} aria-hidden="true">
<defs><linearGradient id="${id}a" gradientUnits="userSpaceOnUse" x1="30" y1="16" x2="62" y2="50"><stop offset="0" stop-color="${c.a1}"/><stop offset="1" stop-color="${c.a2}"/></linearGradient>
<linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="40" y2="84"><stop offset="0" stop-color="${c.b1}"/><stop offset="1" stop-color="${c.b2}"/></linearGradient></defs>
<g fill="none" stroke-width="15" stroke-linejoin="miter" stroke-miterlimit="4">
<path d="M71.2 28.24 L50 16 L20.56 33 L20.56 50 L52 50" stroke="url(#${id}a)"/>
<path d="M48 50 L79.44 50 L79.44 67 L50 84 L28.8 71.76" stroke="url(#${id}b)"/></g>
<path d="M50 33.5 L64.3 41.75 L64.3 58.25 L50 66.5 L35.7 58.25 L35.7 41.75 Z" fill="${h}" stroke="${h}" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 36 L62.1 43 L50 50 L37.9 43 Z" fill="${c.top}"/><path d="M37.9 43 L50 50 L50 64 L37.9 57 Z" fill="${c.esq}"/><path d="M50 50 L62.1 43 L62.1 57 L50 64 Z" fill="${c.dir}"/>
<path d="M50 36 L62.1 43 L62.1 57 L50 64 L37.9 57 L37.9 43 Z M37.9 43 L50 50 L62.1 43 M50 50 L50 64" fill="none" stroke="${c.linha}" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M43.9 39.5 L56 46.5 L56 50.8" fill="none" stroke="${c.linha}" stroke-width="1.3" stroke-linejoin="round" opacity=".85"/>
</svg>`;
  }

  // src/telas.js
  var MICROSOFT_ATIVO = false;
  var PAPEIS = { colaborador: "Colaborador", gestor: "Gestor", admin: "Administrador" };
  var nomePapel = (p) => PAPEIS[p] || p;
  var marca = (sufixo) => `<span class="marca">${marcaSaus("escuro", "#1C2733")}<span>Saus360 <em>${esc(sufixo || "Equipe")}</em></span></span>`;
  var mensagem = (S2) => S2.msg ? `<div class="msg ${esc(S2.msg.tipo)}" role="${S2.msg.tipo === "erro" ? "alert" : "status"}">${esc(S2.msg.texto)}</div>` : "";
  var ocupado = (S2, txt, padrao) => S2.ocupado ? `${esc(txt)}…` : esc(padrao);
  function porta(S2, miolo2) {
    const ex = regua({ titulo: "Marina Alves, analista de procesos", capacidade: 40, rotina: 8, ausencias: 4, aprovadas: 14, pendentes: 6 });
    return `<div class="porta">
  <aside class="porta-lado">
    ${marca()}
    <div><p class="porta-tese">¿Quién tiene horas libres esta semana?</p>
    <p>Cada persona tiene una capacidad semanal. Quien necesita ayuda ve la disponibilidad, pide las horas y la propia persona o su jefe directo aprueba. Todo queda registrado.</p></div>
    <div class="porta-exemplo">${ex}</div>
    <p class="porta-rodape">Saus360 Equipe, versión piloto.</p>
  </aside>
  <main class="porta-form"><div class="cartao">${miolo2}</div></main>
</div>`;
  }
  function campoSenha(nome, rotulo, auto, valor, comRegras) {
    const r = regrasSenha(valor), f = forcaSenha(valor);
    return `<label class="campo"><span>${esc(rotulo)}</span><input class="entrada" type="password" name="${nome}" autocomplete="${auto}" required maxlength="200" value="${esc(valor || "")}" data-senha="${comRegras ? 1 : 0}"></label>
  ${comRegras ? `<div class="forca" data-n="${f}" aria-hidden="true"><i></i><i></i><i></i></div>
  <ul class="regras" aria-live="polite"><li class="${r.tamanho ? "ok" : ""}">Al menos 10 caracteres</li><li class="${r.letra ? "ok" : ""}">Letras</li><li class="${r.numero ? "ok" : ""}">Números</li></ul>` : ""}`;
  }
  function telaEntrar(S2) {
    return porta(S2, `<h1>Iniciar sesión</h1><p class="mudo">Usa el correo registrado en tu empresa.</p>${mensagem(S2)}
  <form data-form="entrar" novalidate>
    <label class="campo"><span>Correo</span><input class="entrada" type="email" name="email" autocomplete="username" required maxlength="254" value="${esc(S2.f.email || "")}"></label>
    ${campoSenha("senha", "Contraseña", "current-password", "", false)}
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Entrando", "Iniciar sesión")}</button>
  </form>
  <p class="acoes"><button type="button" class="btn texto" data-a="ir" data-v="esqueci">Olvidé mi contraseña</button></p>
  ${MICROSOFT_ATIVO ? `<div class="ou">o</div><button type="button" class="btn cheio" data-a="microsoft">Iniciar sesión con Microsoft</button>` : ""}
  <div class="rodape">¿Tu empresa aún no usa Saus360 Equipe? <button type="button" class="btn texto" data-a="ir" data-v="criar">Crear cuenta</button></div>`);
  }
  function telaCriar(S2) {
    return porta(S2, `<h1>Crear cuenta</h1><p class="mudo">Después de confirmar el correo, registras tu empresa. Para entrar a una empresa que ya usa Saus360 Equipe, pide una invitación al administrador.</p>${mensagem(S2)}
  <form data-form="criar" novalidate>
    <label class="campo"><span>Tu nombre</span><input class="entrada" name="nome" autocomplete="name" required maxlength="120" value="${esc(S2.f.nome || "")}"></label>
    <label class="campo"><span>Correo del trabajo</span><input class="entrada" type="email" name="email" autocomplete="email" required maxlength="254" value="${esc(S2.f.email || "")}"></label>
    ${campoSenha("senha", "Contraseña", "new-password", S2.f.senha, true)}
    ${campoSenha("senha2", "Repite la contraseña", "new-password", "", false)}
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Creando", "Crear cuenta")}</button>
  </form>
  <div class="rodape">¿Ya tienes cuenta? <button type="button" class="btn texto" data-a="ir" data-v="entrar">Iniciar sesión</button></div>`);
  }
  function telaConfirme(S2) {
    const espera = Math.max(0, Math.ceil(((S2.reenvioAte || 0) - Date.now()) / 1e3));
    return porta(S2, `<h1>Confirma tu correo</h1>
  <p class="mudo">Enviamos un enlace a <b>${esc(S2.f.email || "")}</b>. Abre el enlace para activar la cuenta. Si no llega en unos minutos, revisa también el spam.</p>${mensagem(S2)}
  <form data-form="codigo" novalidate>
    <label class="campo"><span>¿Recibiste un código de 6 dígitos?</span><input class="entrada codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="000000"></label>
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Confirmando", "Confirmar código")}</button>
  </form>
  <p class="acoes"><button type="button" class="btn texto" data-a="reenviar" data-espera="${espera}" ${espera ? "disabled" : ""}>${espera ? `Reenviar en ${espera} s` : "Reenviar correo"}</button>
  <button type="button" class="btn texto" data-a="ir" data-v="criar">Me equivoqué de correo</button></p>
  <div class="rodape">Si ese correo ya tiene cuenta, <button type="button" class="btn texto" data-a="ir" data-v="entrar">inicia sesión</button> o <button type="button" class="btn texto" data-a="ir" data-v="esqueci">crea una contraseña nueva</button>.</div>`);
  }
  function telaEsqueci(S2) {
    return porta(S2, `<h1>Crear contraseña nueva</h1><p class="mudo">Escribe tu correo. Si hay una cuenta con él, enviamos un enlace para crear una contraseña nueva.</p>${mensagem(S2)}
  ${S2.enviado ? "" : `<form data-form="esqueci" novalidate>
    <label class="campo"><span>Correo</span><input class="entrada" type="email" name="email" autocomplete="username" required maxlength="254" value="${esc(S2.f.email || "")}"></label>
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Enviando", "Enviar enlace")}</button>
  </form>`}
  <div class="rodape"><button type="button" class="btn texto" data-a="ir" data-v="entrar">Volver a iniciar sesión</button></div>`);
  }
  function telaNovaSenha(S2) {
    return porta(S2, `<h1>Contraseña nueva</h1><p class="mudo">Elige la contraseña que vas a usar a partir de ahora.</p>${mensagem(S2)}
  <form data-form="nova-senha" novalidate>
    ${campoSenha("senha", "Contraseña nueva", "new-password", S2.f.senha, true)}
    ${campoSenha("senha2", "Repite la contraseña", "new-password", "", false)}
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Guardando", "Guardar y entrar")}</button>
  </form>`);
  }
  function telaConvite(S2) {
    const cv = (S2.ctx && S2.ctx.convites || [])[0];
    if (!cv) return porta(S2, `<h1>Invitación</h1>${mensagem(S2)}<div class="msg aviso">Esta invitación ya no vale: venció o fue cancelada. Pide una nueva al administrador de la empresa.</div>
    <button class="btn cheio" data-a="sair">Volver a iniciar sesión</button>`);
    return porta(S2, `<h1>Te invitaron</h1>
  <p class="mudo">Para entrar a <b>${esc(cv.empresa)}</b> como ${esc(nomePapel(cv.papel).toLowerCase())}, confirma tu nombre y crea la contraseña.</p>${mensagem(S2)}
  <form data-form="aceitar-convite" novalidate>
    <input type="hidden" name="convite" value="${esc(cv.id)}">
    <label class="campo"><span>Tu nombre</span><input class="entrada" name="nome" autocomplete="name" required maxlength="120" value="${esc(S2.f.nome != null ? S2.f.nome : cv.nome)}"></label>
    ${campoSenha("senha", "Contraseña", "new-password", S2.f.senha, true)}
    ${campoSenha("senha2", "Repite la contraseña", "new-password", "", false)}
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Entrando", "Crear contraseña y entrar")}</button>
  </form>`);
  }
  function telaMfaVerificar(S2) {
    return porta(S2, `<h1>Verificación en dos pasos</h1><p class="mudo">Abre la app autenticadora en el celular (Google o Microsoft Authenticator) y escribe los 6 números que aparecen en "Saus360 Equipe". El código no llega por correo.</p>${mensagem(S2)}
  <form data-form="mfa-verificar" novalidate>
    <label class="campo"><span>Código</span><input class="entrada codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" autofocus></label>
    <button class="btn prim cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Verificando", "Confirmar")}</button>
  </form>
  <div class="rodape">¿Perdiste el celular? Pide al administrador de la empresa que hable con Saus360. <button type="button" class="btn texto" data-a="sair">Salir</button></div>`);
  }
  function qrSeguro(q) {
    const m = /^data:image\/svg\+xml;utf-?8,(.*)$/is.exec(q || "");
    return m ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(m[1]) : q;
  }
  function blocoQr(S2) {
    if (!S2.fator) return `<p class="mudo">Generando el código…</p>`;
    return `<div class="qr"><img src="${esc(qrSeguro(S2.fator.qr))}" alt="Código QR para la app autenticadora"><div><b>¿No puedes leerlo?</b><p class="pequeno mudo">Escribe esta clave en la app:</p><code>${esc(S2.fator.segredo)}</code></div></div>`;
  }
  function telaMfaAtivar(S2, obrigatoria) {
    return porta(S2, `<h1>Activa la verificación en dos pasos</h1>
  <p class="mudo">${obrigatoria ? "Es obligatoria para administradores: ellos cambian personas y permisos, y el código del celular protege a la empresa aunque se filtre la contraseña." : "Además de la contraseña, Saus360 Equipe va a pedir un código de tu celular."}</p>${mensagem(S2)}
  <div class="msg info">El código no llega por correo ni por SMS: aparece en la app autenticadora de tu celular y cambia cada 30 segundos.</div>
  <p class="pequeno"><b>1.</b> Instala en el celular Google Authenticator o Microsoft Authenticator (gratis en Play Store y App Store). En la app, toca "+" y lee este código QR.</p>
  ${blocoQr(S2)}
  <p class="pequeno"><b>2.</b> La app empieza a mostrar "Saus360 Equipe" con 6 números. Escríbelos aquí.</p>
  <form data-form="mfa-ativar" novalidate>
    <label class="campo"><span class="sr">Código</span><input class="entrada codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label>
    <button class="btn prim cheio" ${S2.ocupado || !S2.fator ? "disabled" : ""}>${ocupado(S2, "Activando", "Activar")}</button>
  </form>
  <div class="rodape"><button type="button" class="btn texto" data-a="sair">Salir</button></div>`);
  }
  function telaSemEmpresa(S2) {
    const cvs = S2.ctx && S2.ctx.convites || [];
    return porta(S2, `<h1>${cvs.length ? "Invitaciones para ti" : "Registra tu empresa"}</h1>${mensagem(S2)}
  ${cvs.map((c) => `<div class="painel"><div class="painel-corpo"><b>${esc(c.empresa)}</b><p class="mudo pequeno">Como ${esc(nomePapel(c.papel).toLowerCase())}. Vale hasta el ${esc(data(c.expira_em))}.</p>
    <p class="acoes" ><button class="btn prim" data-a="aceitar" data-id="${esc(c.id)}">Entrar a esta empresa</button></p></div></div>`).join("")}
  ${cvs.length ? `<div class="ou">o</div>` : `<p class="mudo">Aún no formas parte de ninguna empresa. Registra la tuya e invita al equipo. Para entrar a una empresa que ya usa Saus360 Equipe, pide una invitación al administrador.</p><br>`}
  <form data-form="criar-empresa" novalidate>
    <label class="campo"><span>Nombre de la empresa</span><input class="entrada" name="empresa" required maxlength="120" value="${esc(S2.f.empresa || "")}"></label>
    <label class="campo"><span>Tu nombre</span><input class="entrada" name="nome" required maxlength="120" value="${esc(S2.f.nome || S2.nomeConta || "")}"></label>
    <button class="btn ${cvs.length ? "" : "prim"} cheio" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Registrando", "Registrar empresa")}</button>
  </form>
  <p class="pequeno mudo">La empresa empieza con 30 días de prueba y hasta 15 personas.</p>
  <div class="rodape"><button type="button" class="btn texto" data-a="sair">Salir</button></div>`);
  }
  var NAV = [
    { r: "semana", t: "Mi semana", i: "semana" },
    { r: "solicitacoes", t: "Solicitudes", i: "lista", fase: 2 },
    { r: "aprovacao", t: "Bandeja de aprobación", i: "caixa", fase: 2 },
    { r: "equipe", t: "Equipe", i: "equipe", papel: ["gestor", "admin"], fase: 3 },
    { r: "projetos", t: "Proyectos", i: "projetos", fase: 2 },
    { r: "auditoria", t: "Auditoría", i: "auditoria", papel: ["admin"] },
    { r: "admin", t: "Admin", i: "admin", papel: ["admin"] }
  ];
  function navVisivel(S2) {
    const papel = S2.emp && S2.emp.papel;
    return NAV.filter((n) => !n.papel || n.papel.includes(papel));
  }
  function shell(S2, miolo2) {
    const emp = S2.emp, emps = S2.ctx.empresas || [], raiz = S2.rota.split("/")[0];
    const iniciais = (emp && emp.nome_membro || S2.ctx.email || "?").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
    return `<div class="app">
  <aside class="lateral${S2.menu ? " aberta" : ""}" aria-label="Menú">
    ${marca()}
    <nav class="nav">
      ${navVisivel(S2).map((n) => `<a href="#/${n.r}" ${raiz === n.r ? 'aria-current="page"' : ""}>${ico(n.i)}<span>${esc(n.t)}</span></a>`).join("")}
      ${S2.ctx.super ? `<p class="nav-titulo">Saus360</p><a href="#/saus360" ${raiz === "saus360" ? 'aria-current="page"' : ""}>${ico("saus")}<span>Empresas y planes</span></a>` : ""}
    </nav>
    <div class="lateral-pe"><b>${esc(emp ? emp.nome_membro : S2.ctx.email)}</b>${esc(emp ? nomePapel(emp.papel) : "")}</div>
  </aside>
  <div>
    <header class="topo">
      <button class="icobtn so-celular" data-a="menu" aria-label="Abrir menú">${ico("menu")}</button>
      <div class="empresa">${emps.length > 1 ? `<label class="sr" for="trocaEmp">Empresa</label><select id="trocaEmp" class="entrada" data-a="trocar-empresa">${emps.map((e) => `<option value="${esc(e.id)}" ${emp && e.id === emp.id ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select>` : esc(emp ? emp.nome : "")}</div>
      <div class="topo-dir">
        <a class="icobtn" href="#/conta" aria-label="Mi cuenta" title="Mi cuenta"><span class="avatar">${esc(iniciais)}</span></a>
        <button class="icobtn" data-a="sair" aria-label="Salir" title="Salir">${ico("sair")}</button>
      </div>
    </header>
    <main class="conteudo" id="conteudo">${miolo2}</main>
  </div>
  ${S2.menu ? `<div class="veu so-celular" data-a="menu"></div>` : ""}
</div>`;
  }
  function telaModuloOff(S2) {
    return `<div class="cabeca"><div><h1>${esc(S2.emp.nome)}</h1></div></div>
  <div class="painel"><div class="vazio"><h3>Saus360 Equipe está desactivado para esta empresa</h3><p>${S2.emp.valido_ate ? `El período ${S2.emp.plano === "teste" ? "de prueba" : "contratado"} terminó el ${esc(data(S2.emp.valido_ate))}. ` : ""}Habla con Saus360 para reactivarlo.</p></div></div>`;
  }
  function telaSemana(S2) {
    const d = S2.dados.semana;
    if (!d) return `<p class="mudo">Cargando…</p>`;
    const seg = segundaDe();
    const p = d.perfil || { capacidade_semanal: 40, rotina_fixa: 0 };
    const livre = p.capacidade_semanal - p.rotina_fixa;
    return `<div class="cabeca"><div><h1>Mi semana</h1><p>${esc(rotuloSemana(seg))}</p></div></div>
  <div class="semana-grade">
    <div class="painel"><div class="painel-corpo">${regua({ titulo: "Tu capacidad esta semana", capacidade: p.capacidade_semanal, rotina: p.rotina_fixa })}</div>
      <dl class="numeros">
        <div><dt>Capacidad semanal</dt><dd class="num">${horas(p.capacidade_semanal)}</dd></div>
        <div><dt>Rutina fija</dt><dd class="num">${horas(p.rotina_fixa)}</dd></div>
        <div><dt>Disponible para proyectos</dt><dd class="num">${horas(livre)}</dd></div>
        <div><dt>Apruebas solo hasta</dt><dd class="num">${horas(S2.emp.limite_aprovacao)}</dd></div>
      </dl>
    </div>
    <div class="painel"><div class="painel-cab"><h3>Quién decide tus pedidos</h3></div>
      <ul class="lista-simples">
        <li><span class="mudo">Jefe directo</span><b>${esc(d.chefe || "Ninguno")}</b></li>
        <li><span class="mudo">Cargo</span><b>${esc(p.cargo || "—")}</b></li>
        <li><span class="mudo">Rol</span><b>${esc(nomePapel(S2.emp.papel))}</b></li>
      </ul>
      <div class="painel-corpo pequeno mudo">Pedidos de hasta ${horas(S2.emp.limite_aprovacao)} que caben en tu semana, los apruebas tú. Por encima de eso, ${d.chefe ? "van a " + esc(d.chefe) : "decides tú, porque no tienes jefe directo registrado"}.</div>
    </div>
  </div>
  <div class="painel"><div class="vazio"><h3>Ninguna solicitud esta semana</h3><p>Solicitudes, ausencias y horas reales llegan en la fase 2 del piloto.</p></div></div>`;
  }
  function telaFase(S2, titulo, texto, fase) {
    return `<div class="cabeca"><div><h1>${esc(titulo)}</h1></div><span class="fase">Fase ${fase} del piloto</span></div>
  <div class="painel"><div class="vazio"><h3>En construcción</h3><p>${esc(texto)}</p></div></div>`;
  }
  var abasAdmin = (S2) => `<nav class="abas">${[["usuarios", "Personas"], ["config", "Configuración"], ["logins", "Registro de accesos"]].map(([r, t]) => `<a href="#/admin/${r}" ${S2.rota === "admin/" + r || r === "usuarios" && S2.rota === "admin" ? 'aria-current="page"' : ""}>${esc(t)}</a>`).join("")}</nav>`;
  function telaAdminUsuarios(S2) {
    const d = S2.dados.usuarios;
    const cab = `<div class="cabeca"><div><h1>Admin</h1><p>Personas, jefe directo, capacidad y acceso.</p></div><button class="btn prim" data-a="convidar">${ico("mais")}Invitar persona</button></div>${abasAdmin(S2)}`;
    if (!d) return cab + `<p class="mudo">Cargando…</p>`;
    const ativos = d.membros.filter((m) => m.ativo).length + d.convites.filter((c) => !c.vencido).length;
    return cab + `${mensagem(S2)}
  <div class="painel"><div class="painel-cab"><h3>Personas</h3><span class="mudo pequeno num">${ativos} de ${d.limite_usuarios} en el plan</span></div>
  <div class="rolar"><table class="tabela empilha"><thead><tr><th>Persona</th><th>Rol</th><th>Jefe directo</th><th>Capacidad</th><th>Dos pasos</th><th>Último acceso</th></tr></thead><tbody>
  ${d.membros.map((m) => `<tr class="clica${m.ativo ? "" : " inativo"}" data-a="editar" data-id="${esc(m.user_id)}" tabindex="0">
    <td class="pessoa"><b>${esc(m.nome)}</b><span>${esc(m.email)}${m.cargo ? " — " + esc(m.cargo) : ""}</span></td>
    <td>${m.ativo ? `<span class="pilula ${m.papel === "admin" ? "aco" : m.papel === "gestor" ? "info" : ""}">${esc(nomePapel(m.papel))}</span>` : `<span class="pilula erro">Sin acceso</span>`}</td>
    <td data-rot="Chefe" class="oculta-cel">${esc(m.chefe_nome || "—")}</td>
    <td data-rot="Capacidade" class="num">${horas(m.capacidade_semanal)}${Number(m.rotina_fixa) ? ` <span class="mudo pequeno">(rutina ${horas(m.rotina_fixa)})</span>` : ""}</td>
    <td data-rot="Duas etapas">${m.tem_mfa ? `<span class="pilula ok">Activa</span>` : m.papel === "admin" ? `<span class="pilula aviso">Pendiente</span>` : `<span class="mudo">No</span>`}</td>
    <td data-rot="Acesso" class="oculta-cel mudo">${esc(haQuanto(m.ultimo_login))}</td>
  </tr>`).join("")}
  </tbody></table></div></div>
  ${d.convites.length ? `<div class="painel"><div class="painel-cab"><h3>Invitaciones pendientes</h3></div>
  <div class="rolar"><table class="tabela empilha"><thead><tr><th>Persona</th><th>Rol</th><th>Enviada</th><th>Vale hasta</th><th></th></tr></thead><tbody>
  ${d.convites.map((c) => `<tr><td class="pessoa"><b>${esc(c.nome)}</b><span>${esc(c.email)}</span></td><td>${esc(nomePapel(c.papel))}</td>
    <td data-rot="Enviado" class="mudo">${esc(dataHora(c.criado_em))}</td><td data-rot="Vale até">${c.vencido ? `<span class="pilula erro">Venció</span>` : esc(data(c.expira_em))}</td>
    <td><div class="acoes fim"><button class="btn" data-a="reenviar-convite" data-id="${esc(c.id)}">Reenviar</button><button class="btn perigo" data-a="cancelar-convite" data-id="${esc(c.id)}">Cancelar</button></div></td></tr>`).join("")}
  </tbody></table></div></div>` : ""}`;
  }
  function opcoesChefe(S2, atual, excluir) {
    const ms = (S2.dados.usuarios && S2.dados.usuarios.membros || []).filter((m) => m.ativo && m.user_id !== excluir);
    return `<option value="">Sin jefe directo</option>` + ms.map((m) => `<option value="${esc(m.user_id)}" ${m.user_id === atual ? "selected" : ""}>${esc(m.nome)}</option>`).join("");
  }
  var opcoesPapel = (atual) => Object.keys(PAPEIS).map((p) => `<option value="${p}" ${p === atual ? "selected" : ""}>${esc(PAPEIS[p])}</option>`).join("");
  function gavetaConvidar(S2) {
    const f = S2.f;
    if (S2.convite) {
      const c = S2.convite;
      return gaveta(
        "Invitación creada",
        `${c.enviado ? `<div class="msg ok">Enviamos la invitación a <b>${esc(c.email)}</b>. Vale 7 días.</div>` : c.ja_tem_conta ? `<div class="msg info"><b>${esc(c.email)}</b> ya tiene cuenta en Saus360 Equipe. La invitación aparece cuando la persona inicie sesión.</div>` : `<div class="msg aviso">El correo no salió porque el envío de correos aún no está configurado. Manda este enlace solo a <b>${esc(c.email)}</b>: vale 1 hora y entra a su cuenta.</div>
        <div class="link-convite"><input class="entrada" readonly value="${esc(c.link)}" id="linkConvite" aria-label="Enlace de la invitación"><button class="btn" data-a="copiar-link">${ico("copiar")}Copiar</button></div>`}`,
        `<button class="btn" data-a="convidar">Invitar a otra persona</button><button class="btn prim" data-a="fechar">Listo</button>`
      );
    }
    return gaveta("Invitar persona", `${mensagem(S2)}<form data-form="convidar" id="formConvidar" novalidate>
    <label class="campo"><span>Correo</span><input class="entrada" type="email" name="email" required maxlength="254" value="${esc(f.email || "")}"></label>
    <label class="campo"><span>Nombre</span><input class="entrada" name="nome" required maxlength="120" value="${esc(f.nome || "")}"></label>
    <div class="duas">
      <label class="campo"><span>Rol</span><select class="entrada" name="papel">${opcoesPapel(f.papel || "colaborador")}</select></label>
      <label class="campo"><span>Jefe directo</span><select class="entrada" name="chefe">${opcoesChefe(S2, f.chefe || S2.ctx.user_id)}</select></label>
    </div>
    <label class="campo"><span>Cargo</span><input class="entrada" name="cargo" maxlength="80" value="${esc(f.cargo || "")}"></label>
    <div class="duas">
      <label class="campo"><span>Capacidad semanal (h)</span><input class="entrada" name="capacidade" inputmode="decimal" value="${esc(f.capacidade != null ? f.capacidade : 40)}"></label>
      <label class="campo"><span>Rutina fija (h)</span><input class="entrada" name="rotina" inputmode="decimal" value="${esc(f.rotina != null ? f.rotina : 0)}"><small>Horas de la semana que ya tienen dueño: reuniones, rutinas, atención.</small></label>
    </div>
  </form>`, `<button class="btn" data-a="fechar">Cancelar</button><button class="btn prim" type="submit" form="formConvidar" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Enviando", "Enviar invitación")}</button>`);
  }
  function gavetaEditar(S2) {
    const m = (S2.dados.usuarios.membros || []).find((x) => x.user_id === S2.editando);
    if (!m) return "";
    const eu = m.user_id === S2.ctx.user_id;
    return gaveta(m.nome, `${mensagem(S2)}<p class="mudo pequeno">${esc(m.email)}. Entró el ${esc(data(m.entrou_em))}. Verificación en dos pasos: ${m.tem_mfa ? "activa" : "no activada"}.</p><br>
  <form data-form="salvar-membro" id="formMembro" novalidate>
    <input type="hidden" name="user" value="${esc(m.user_id)}">
    <label class="campo"><span>Nombre</span><input class="entrada" name="nome" required maxlength="120" value="${esc(m.nome)}"></label>
    <div class="duas">
      <label class="campo"><span>Rol</span><select class="entrada" name="papel">${opcoesPapel(m.papel)}</select></label>
      <label class="campo"><span>Jefe directo</span><select class="entrada" name="chefe">${opcoesChefe(S2, m.chefe_id, m.user_id)}</select></label>
    </div>
    <label class="campo"><span>Cargo</span><input class="entrada" name="cargo" maxlength="80" value="${esc(m.cargo)}"></label>
    <div class="duas">
      <label class="campo"><span>Capacidad semanal (h)</span><input class="entrada" name="capacidade" inputmode="decimal" value="${esc(m.capacidade_semanal)}"></label>
      <label class="campo"><span>Rutina fija (h)</span><input class="entrada" name="rotina" inputmode="decimal" value="${esc(m.rotina_fixa)}"></label>
    </div>
    <label class="marcar"><input type="checkbox" name="ativo" ${m.ativo ? "checked" : ""} ${eu ? "disabled" : ""}><span><b>Tiene acceso</b><br><span class="mudo pequeno">${eu ? "No puedes quitarte tu propio acceso." : "Sin acceso, la persona sale al instante. Su historial sigue en la auditoría."}</span></span></label>
  </form>`, `<button class="btn" data-a="fechar">Cancelar</button><button class="btn prim" type="submit" form="formMembro" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Guardando", "Guardar")}</button>`);
  }
  function gaveta(titulo, corpo, pe) {
    return `<div class="veu" data-a="fechar-fora"><section class="gaveta" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
  <div class="gaveta-cab"><h2>${esc(titulo)}</h2><button class="icobtn" data-a="fechar" aria-label="Cerrar">${ico("fechar")}</button></div>
  <div class="gaveta-corpo">${corpo}</div><div class="gaveta-pe">${pe}</div></section></div>`;
  }
  function telaAdminConfig(S2) {
    const e = S2.emp;
    return `<div class="cabeca"><div><h1>Admin</h1><p>Personas, jefe directo, capacidad y acceso.</p></div></div>${abasAdmin(S2)}${mensagem(S2)}
  <div class="painel"><div class="painel-cab"><h3>Reglas de la empresa</h3></div><div class="painel-corpo">
  <form data-form="config" novalidate>
    <div class="duas">
      <label class="campo"><span>Límite de aprobación (h)</span><input class="entrada" name="limite" inputmode="decimal" value="${esc(e.limite_aprovacao)}"><small>Hasta cuántas horas cada persona aprueba sola lo que le piden, si cabe en la semana. Por encima de eso, va al jefe directo.</small></label>
      <label class="campo"><span>Cerrar sesión sin uso después de (min)</span><input class="entrada" name="minutos" inputmode="numeric" value="${esc(e.minutos_inatividade)}"><small>Aplica a todos en la empresa.</small></label>
    </div>
    <button class="btn prim" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Guardando", "Guardar reglas")}</button>
  </form></div></div>
  <div class="painel"><div class="painel-cab"><h3>Plan</h3></div><ul class="lista-simples">
    <li><span class="mudo">Plan</span><b>${esc({ teste: "Prueba", equipe: "Equipe", corporativo: "Corporativo" }[e.plano] || e.plano)}</b></li>
    <li><span class="mudo">Válido hasta</span><b>${e.valido_ate ? esc(data(e.valido_ate)) : "Sin plazo"}</b></li>
    <li><span class="mudo">Inicio de sesión con Microsoft</span><b>${e.sso_microsoft ? "Habilitado" : "No habilitado"}</b></li>
  </ul></div>`;
  }
  var MOTIVOS = { senha: "Contraseña", confirmou_senha: "Confirmó la contraseña", convite: "Enlace de invitación", recuperacao: "Enlace de contraseña nueva", confirmacao: "Enlace de confirmación", microsoft: "Microsoft", bloqueado: "Cuenta bloqueada por 15 min", nao_confirmado: "Correo no confirmado", limite: "Demasiados intentos" };
  function telaAdminLogins(S2) {
    const d = S2.dados.logins;
    const cab = `<div class="cabeca"><div><h1>Admin</h1><p>Personas, jefe directo, capacidad y acceso.</p></div></div>${abasAdmin(S2)}`;
    if (!d) return cab + `<p class="mudo">Cargando…</p>`;
    return cab + `<div class="painel"><div class="painel-cab"><h3>Registro de accesos</h3><span class="mudo pequeno">Últimos ${d.length}</span></div>
  ${d.length ? `<div class="rolar"><table class="tabela empilha"><thead><tr><th>Cuándo</th><th>Persona</th><th>Resultado</th><th>Como</th><th>IP</th><th>Dispositivo</th></tr></thead><tbody>
  ${d.map((l) => `<tr><td class="num">${esc(dataHora(l.em))}</td><td class="pessoa"><b>${esc(l.nome)}</b><span>${esc(l.email)}</span></td>
    <td>${l.sucesso ? `<span class="pilula ok">Entró</span>` : `<span class="pilula erro">${l.motivo === "senha" ? "Contraseña incorrecta" : "No entró"}</span>`}</td>
    <td data-rot="Como">${esc(l.sucesso ? MOTIVOS[l.motivo] || l.motivo : l.motivo === "senha" ? "Contraseña" : MOTIVOS[l.motivo] || l.motivo)}</td>
    <td data-rot="IP" class="num mudo">${esc(l.ip || "—")}</td><td data-rot="Aparelho" class="mudo">${esc(aparelho(l.agente))}</td></tr>`).join("")}
  </tbody></table></div>` : `<div class="vazio"><p>Aún no hay accesos registrados.</p></div>`}</div>`;
  }
  var CAMPOS = { papel: "rol", ativo: "acceso", nome: "nombre", chefe_id: "jefe directo", cargo: "cargo", capacidade_semanal: "capacidad", rotina_fixa: "rutina fija", limite_aprovacao: "límite de aprobación", minutos_inatividade: "tiempo sin uso", status: "situación", plano: "plan", valido_ate: "validez", sso_microsoft: "inicio de sesión Microsoft" };
  var IGNORAR = /* @__PURE__ */ new Set(["atualizado_em", "atualizado_por", "entrou_em", "criado_em", "aceito_em", "aceito_por", "expira_em", "convidado_por", "email"]);
  function valorLegivel(k, v, nomes) {
    if (v == null || v === "") return "vacío";
    if (k === "chefe_id") return nomes[v] || "otra persona";
    if (k === "papel") return nomePapel(v);
    if (k === "ativo" || k === "sso_microsoft") return v ? "sí" : "no";
    if (k === "capacidade_semanal" || k === "rotina_fixa" || k === "limite_aprovacao") return horas(v);
    if (k === "status") return { pendente: "pendiente", aceito: "aceptada", cancelado: "cancelada" }[v] || v;
    return String(v);
  }
  function frasesAuditoria(a, nomes) {
    const d = a.depois || {}, x = a.antes || {};
    const quem = d.nome || x.nome || nomes[a.registro] || "";
    if (a.tabela === "empresas") return a.acao === "INSERT" ? [`Creó la empresa ${d.nome}`] : [`Cambió la empresa`];
    if (a.tabela === "convites") {
      if (a.acao === "INSERT") return [`Invitó a ${d.email} como ${nomePapel(d.papel).toLowerCase()}`];
      if (d.status === "aceito" && x.status === "pendente") return [`${d.email} aceptó la invitación`];
      if (d.status === "cancelado" && x.status === "pendente") return [`Canceló la invitación de ${d.email}`];
    }
    if (a.tabela === "membros" && a.acao === "INSERT") return [`${d.nome} entró a la empresa como ${nomePapel(d.papel).toLowerCase()}`];
    if (a.tabela === "perfis_equipe" && a.acao === "INSERT") return [`Registró la capacidad de ${quem || "una persona"}: ${horas(d.capacidade_semanal)}, rutina ${horas(d.rotina_fixa)}`];
    if (a.tabela === "modulos_empresa" && a.acao === "INSERT") return [`Activó Saus360 Equipe (plan ${d.plano})`];
    if (a.tabela === "config_equipe" && a.acao === "INSERT") return [`Creó las reglas de la empresa: límite ${horas(d.limite_aprovacao)}`];
    if (a.acao === "UPDATE") {
      const mud = Object.keys(d).filter((k) => !IGNORAR.has(k) && CAMPOS[k] && JSON.stringify(d[k]) !== JSON.stringify(x[k]));
      if (!mud.length) return [];
      const alvo = a.tabela === "membros" || a.tabela === "perfis_equipe" ? ` de ${quem || nomes[a.registro] || "una persona"}` : "";
      return mud.map((k) => `Cambió ${CAMPOS[k]}${alvo}: ${valorLegivel(k, x[k], nomes)} a ${valorLegivel(k, d[k], nomes)}`);
    }
    if (a.acao === "DELETE") return [`Eliminó un registro de ${a.tabela}`];
    return [`${a.acao} en ${a.tabela}`];
  }
  function telaAuditoria(S2) {
    const d = S2.dados.auditoria;
    const cab = `<div class="cabeca"><div><h1>Auditoría</h1><p>Todo lo que cambia queda registrado aquí. Nadie modifica ni borra este registro.</p></div></div>`;
    if (!d) return cab + `<p class="mudo">Cargando…</p>`;
    const nomes = {};
    (S2.dados.usuarios && S2.dados.usuarios.membros || []).forEach((m) => {
      nomes[m.user_id] = m.nome;
    });
    d.forEach((a) => {
      const v = a.depois || a.antes || {};
      if (a.tabela === "membros" && v.user_id && v.nome) nomes[v.user_id] = nomes[v.user_id] || v.nome;
    });
    const linhas = d.flatMap((a) => frasesAuditoria(a, nomes).map((f) => ({ a, f })));
    return cab + `<div class="painel"><div class="painel-cab"><h3>Últimos cambios</h3><span class="mudo pequeno">${linhas.length}</span></div>
  ${linhas.length ? `<div class="rolar"><table class="tabela empilha"><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué</th></tr></thead><tbody>
  ${linhas.map(({ a, f }) => `<tr><td class="num mudo">${esc(dataHora(a.em))}</td><td><b>${esc(a.ator)}</b></td><td>${esc(f)}</td></tr>`).join("")}
  </tbody></table></div>` : `<div class="vazio"><p>Aún no hay nada registrado.</p></div>`}</div>`;
  }
  function telaConta(S2) {
    const fatores = S2.dados.fatores;
    const admin = S2.ctx.super || (S2.ctx.empresas || []).some((e) => e.papel === "admin");
    const fat = (fatores || []).find((f) => f.status === "verified");
    return `<div class="cabeca"><div><h1>Mi cuenta</h1><p>${esc(S2.ctx.email)}</p></div></div>${mensagem(S2)}
  <div class="painel"><div class="painel-cab"><h3>Cambiar contraseña</h3></div><div class="painel-corpo">
  <form data-form="trocar-senha" novalidate>
    ${campoSenha("atual", "Contraseña actual", "current-password", "", false)}
    ${campoSenha("senha", "Contraseña nueva", "new-password", S2.f.senha, true)}
    ${campoSenha("senha2", "Repite la contraseña nueva", "new-password", "", false)}
    <button class="btn prim" ${S2.ocupado ? "disabled" : ""}>${ocupado(S2, "Guardando", "Cambiar contraseña")}</button>
  </form></div></div>
  <div class="painel"><div class="painel-cab"><h3>Verificación en dos pasos</h3>${fat ? `<span class="pilula ok">Activa</span>` : `<span class="pilula">Desactivada</span>`}</div><div class="painel-corpo">
    ${fatores == null ? `<p class="mudo">Cargando…</p>` : fat ? `<p class="mudo">Al iniciar sesión, pedimos el código de la app autenticadora.${admin ? " Para administradores es obligatoria." : ""}</p>${admin ? "" : `<br><button class="btn perigo" data-a="mfa-desativar" data-id="${esc(fat.id)}">Desactivar</button>`}` : S2.ativandoMfa ? `${blocoQr(S2)}<form data-form="mfa-ativar" novalidate><label class="campo"><span>Código de 6 dígitos</span><input class="entrada codigo" name="codigo" inputmode="numeric" maxlength="6" placeholder="000000"></label><div class="acoes"><button class="btn prim" ${S2.fator ? "" : "disabled"}>Activar</button><button type="button" class="btn" data-a="mfa-cancelar">Cancelar</button></div></form>` : `<p class="mudo">Además de la contraseña, pedimos un código de tu celular. Protege la cuenta si se filtra la contraseña.</p><br><button class="btn prim" data-a="mfa-comecar">Activar</button>`}
  </div></div>
  <div class="painel"><div class="painel-cab"><h3>Sesiones</h3></div><div class="painel-corpo">
    <p class="mudo">Cierra la sesión en este y en todos los demás dispositivos y navegadores donde entraste.</p><br>
    <button class="btn perigo" data-a="sair-todos">Salir de todos los dispositivos</button>
  </div></div>
  <div class="painel"><div class="painel-cab"><h3>Idioma</h3></div><div class="painel-corpo acoes">
    <button class="btn ${document.documentElement.lang === "es" ? "" : "prim"}" data-a="idioma" data-v="pt">Português</button>
    <button class="btn ${document.documentElement.lang === "es" ? "prim" : ""}" data-a="idioma" data-v="es">Español</button>
  </div></div>`;
  }
  function telaSaus360(S2) {
    const d = S2.dados.empresas;
    const cab = `<div class="cabeca"><div><h1>Empresas y planes</h1><p>Activa o desactiva Saus360 Equipe por empresa.</p></div></div>${mensagem(S2)}`;
    if (!d) return cab + `<p class="mudo">Cargando…</p>`;
    return cab + `<div class="painel"><div class="rolar"><table class="tabela empilha"><thead><tr><th>Empresa</th><th>Situación</th><th>Plan</th><th>Válido hasta</th><th>Personas</th></tr></thead><tbody>
  ${d.map((e) => `<tr class="clica" data-a="editar-modulo" data-id="${esc(e.id)}" tabindex="0"><td class="pessoa"><b>${esc(e.nome)}</b><span>${esc(e.admin || "")}</span></td>
    <td>${e.modulo_ok ? `<span class="pilula ok">Activo</span>` : `<span class="pilula erro">Desactivado</span>`}</td>
    <td data-rot="Plano">${esc(e.plano)}</td><td data-rot="Até">${e.valido_ate ? esc(data(e.valido_ate)) : "Sin plazo"}</td><td data-rot="Pessoas" class="num">${esc(e.pessoas)}</td></tr>`).join("")}
  </tbody></table></div></div>`;
  }
  function gavetaModulo(S2) {
    const e = (S2.dados.empresas || []).find((x) => x.id === S2.editando);
    if (!e) return "";
    return gaveta(e.nome, `${mensagem(S2)}<form data-form="salvar-modulo" id="formModulo" novalidate>
    <input type="hidden" name="id" value="${esc(e.id)}">
    <label class="marcar"><input type="checkbox" name="ativo" ${e.ativo ? "checked" : ""}><span><b>Saus360 Equipe activo</b></span></label>
    <div class="duas">
      <label class="campo"><span>Plan</span><select class="entrada" name="plano">${["teste", "equipe", "corporativo"].map((p) => `<option ${p === e.plano ? "selected" : ""} value="${p}">${esc({ teste: "Prueba (15 personas)", equipe: "Equipe (60 personas)", corporativo: "Corporativo" }[p])}</option>`).join("")}</select></label>
      <label class="campo"><span>Válido hasta</span><input class="entrada" type="date" name="ate" value="${esc(e.valido_ate || "")}"><small>Vacío: sin plazo.</small></label>
    </div>
    <label class="marcar"><input type="checkbox" name="sso" ${e.sso_microsoft ? "checked" : ""}><span><b>Habilitar inicio de sesión con Microsoft</b><br><span class="mudo pequeno">Necesita Azure configurado en Supabase.</span></span></label>
  </form>`, `<button class="btn" data-a="fechar">Cancelar</button><button class="btn prim" type="submit" form="formModulo">Guardar</button>`);
  }

  // src/app.js
  var ERROS_ES = JSON.parse("{\"Entre para continuar.\":\"Inicia sesión para continuar.\",\"Confirme seu e-mail antes de criar a empresa.\":\"Confirma tu correo antes de crear la empresa.\",\"Informe o nome da empresa.\":\"Escribe el nombre de la empresa.\",\"Informe seu nome.\":\"Escribe tu nombre.\",\"Você já criou 3 empresas. Fale com a Saus360 para criar mais.\":\"Ya creaste 3 empresas. Habla con Saus360 para crear más.\",\"Confirme seu e-mail para aceitar o convite.\":\"Confirma tu correo para aceptar la invitación.\",\"Este convite não vale mais. Peça um novo ao administrador.\":\"Esta invitación ya no vale. Pide una nueva al administrador.\",\"Este convite foi enviado para outro e-mail.\":\"Esta invitación se envió a otro correo.\",\"O Saus360 Equipe está desativado para esta empresa.\":\"Saus360 Equipe está desactivado para esta empresa.\",\"Só o administrador da empresa pode fazer isso.\":\"Solo el administrador de la empresa puede hacer esto.\",\"Confirme a verificação em duas etapas para continuar.\":\"Confirma la verificación en dos pasos para continuar.\",\"Acesso restrito à Saus360.\":\"Acceso restringido a Saus360.\",\"Confira o e-mail.\":\"Revisa el correo.\",\"Informe o nome da pessoa.\":\"Escribe el nombre de la persona.\",\"Papel inválido.\":\"Rol inválido.\",\"A capacidade semanal vai de 0 a 80 horas.\":\"La capacidad semanal va de 0 a 80 horas.\",\"A rotina fixa não pode passar da capacidade.\":\"La rutina fija no puede superar la capacidad.\",\"Essa pessoa já faz parte da empresa.\":\"Esa persona ya forma parte de la empresa.\",\"O chefe direto precisa ser alguém ativo da empresa.\":\"El jefe directo tiene que ser alguien activo de la empresa.\",\"O plano desta empresa chegou ao limite de pessoas.\":\"El plan de esta empresa llegó al límite de personas.\",\"Convite não encontrado.\":\"Invitación no encontrada.\",\"Pessoa não encontrada nesta empresa.\":\"Persona no encontrada en esta empresa.\",\"Informe o nome.\":\"Escribe el nombre.\",\"A pessoa não pode ser chefe de si mesma.\":\"La persona no puede ser su propio jefe.\",\"Esse chefe criaria um ciclo: ele já responde a esta pessoa.\":\"Ese jefe crearía un ciclo: él ya responde a esta persona.\",\"A empresa precisa de pelo menos um administrador ativo.\":\"La empresa necesita al menos un administrador activo.\",\"O limite de aprovação vai de 0 a 80 horas.\":\"El límite de aprobación va de 0 a 80 horas.\",\"A inatividade vai de 5 a 480 minutos.\":\"La inactividad va de 5 a 480 minutos.\",\"Plano inválido.\":\"Plan inválido.\",\"Empresa não encontrada.\":\"Empresa no encontrada.\",\"Não foi possível criar o convite.\":\"No se pudo crear la invitación.\",\"O convite foi criado, mas o e-mail não saiu. Tente de novo em alguns minutos.\":\"La invitación se creó, pero el correo no salió. Inténtalo de nuevo en unos minutos.\"}");
  var GOTRUE = [
    [/sending .*email|email address not authorized|error sending/i, "No pudimos enviar el correo ahora. El envío de correos del piloto aún se está configurando."],
    [/rate limit|too many/i, "Demasiados pedidos seguidos. Espera unos minutos e inténtalo de nuevo."],
    [/only request this after/i, "Espera unos segundos para pedir de nuevo."],
    [/expired or is invalid|otp.?expired|invalid.*(otp|token)/i, "Código incorrecto o vencido."],
    [/password should|weak.?password|password is known/i, "La contraseña necesita al menos 10 caracteres, con letras y números."],
    [/same password|should be different/i, "La contraseña nueva tiene que ser distinta de la actual."],
    [/aal2/i, "Confirma la verificación en dos pasos para continuar."],
    [/invalid login credentials/i, "El correo o la contraseña no coinciden."],
    [/user not found/i, "Cuenta no encontrada."]
  ];
  var traduzErro = (m) => {
    const g = GOTRUE.find(([re]) => re.test(m || ""));
    if (g) return g[1];
    return document.documentElement.lang === "es" && ERROS_ES[m] || m;
  };
  var S = {
    tela: "carregando",
    rota: "semana",
    ctx: null,
    emp: null,
    dados: {},
    f: {},
    msg: null,
    ocupado: false,
    gaveta: null,
    editando: null,
    convite: null,
    fator: null,
    ativandoMfa: false,
    menu: false,
    enviado: false,
    retorno: null
  };
  var app = document.getElementById("app");
  var CHAVE_EMP = "s360eq-empresa";
  function render() {
    let h;
    switch (S.tela) {
      case "entrar":
        h = telaEntrar(S);
        break;
      case "criar":
        h = telaCriar(S);
        break;
      case "confirme":
        h = telaConfirme(S);
        break;
      case "esqueci":
        h = telaEsqueci(S);
        break;
      case "nova-senha":
        h = telaNovaSenha(S);
        break;
      case "convite":
        h = telaConvite(S);
        break;
      case "mfa-verificar":
        h = telaMfaVerificar(S);
        break;
      case "mfa-obrigatoria":
        h = telaMfaAtivar(S, true);
        break;
      case "sem-empresa":
        h = telaSemEmpresa(S);
        break;
      case "app":
        h = shell(S, miolo()) + gavetaAtual();
        break;
      default:
        h = `<div class="carregando">Cargando…</div>`;
    }
    const foco = document.activeElement && document.activeElement.name;
    app.innerHTML = h;
    aplicarMedidas(app);
    if (foco) {
      const el = app.querySelector(`[name="${foco}"]`);
      if (el && el.type !== "hidden") el.focus();
    }
  }
  function miolo() {
    if (!S.emp.modulo_ok) return telaModuloOff(S);
    const r = S.rota;
    if (r === "semana") return telaSemana(S);
    if (r === "solicitacoes") return telaFase(S, "Solicitudes", "Aquí pides horas a otra persona, ves su disponibilidad al instante y sigues la negociación.", 2);
    if (r === "aprovacao") return telaFase(S, "Bandeja de aprobación", "Aquí llegan los pedidos que tienes que aprobar, contraproponer o rechazar, con el motivo.", 2);
    if (r === "equipe") return telaFase(S, "Equipe", "La carga del equipo por semana, con alerta de quien pasó del 100% de su capacidad.", 3);
    if (r === "projetos") return telaFase(S, "Proyectos", "Proyectos con código, prioridad y responsable, para que cada pedido de horas apunte a un proyecto.", 2);
    if (r === "auditoria") return telaAuditoria(S);
    if (r === "admin" || r === "admin/usuarios") return telaAdminUsuarios(S);
    if (r === "admin/config") return telaAdminConfig(S);
    if (r === "admin/logins") return telaAdminLogins(S);
    if (r === "conta") return telaConta(S);
    if (r === "saus360") return telaSaus360(S);
    return telaSemana(S);
  }
  function gavetaAtual() {
    if (S.gaveta === "convidar") return gavetaConvidar(S);
    if (S.gaveta === "editar") return gavetaEditar(S);
    if (S.gaveta === "modulo") return gavetaModulo(S);
    return "";
  }
  var toastT;
  function toast(txt) {
    clearTimeout(toastT);
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = txt;
    toastT = setTimeout(() => el.remove(), 3200);
  }
  var erro = (e) => {
    S.msg = { tipo: "erro", texto: traduzErro(e && e.message || String(e)) };
  };
  var limparMsg = () => {
    S.msg = null;
  };
  async function boot() {
    quandoExpirar(() => {
      irPara("entrar", { tipo: "info", texto: "Tu sesión terminó. Inicia sesión de nuevo." });
    });
    S.retorno = lerRetornoDoLink();
    if (S.retorno && S.retorno.erro) {
      S.tela = "entrar";
      S.msg = { tipo: "erro", texto: S.retorno.erro === "expirado" ? "Ese enlace venció o ya se usó. Pide uno nuevo." : "Ese enlace no es válido. Pide uno nuevo." };
      return render();
    }
    if (!temSessao()) {
      S.tela = /criar-conta/.test(location.hash) ? "criar" : "entrar";
      return render();
    }
    await carregar();
  }
  async function carregar() {
    try {
      S.ctx = await rpc("eq_contexto");
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        esquecerSessao();
        S.tela = "entrar";
        return render();
      }
      S.tela = "entrar";
      erro(e);
      return render();
    }
    const tipo = S.retorno && S.retorno.tipo;
    if (tipo && !S.retornoRegistrado) {
      S.retornoRegistrado = true;
      const m = { invite: "convite", recovery: "recuperacao", signup: "confirmacao", magiclink: "confirmacao", oauth: "microsoft" }[tipo];
      if (m) rpc("eq_registrar_entrada", { p_metodo: m }).catch(() => {
      });
    }
    if (tipo === "recovery") {
      S.retorno = null;
      if (S.ctx.tem_mfa && aal() !== "aal2") {
        S.depoisMfa = "nova-senha";
        return irPara("mfa-verificar");
      }
      return irPara("nova-senha");
    }
    if (tipo === "invite") {
      S.retorno = null;
      S.f = {};
      return irPara("convite");
    }
    return decidir();
  }
  async function decidir() {
    const c = S.ctx;
    if (c.tem_mfa && aal() !== "aal2") return irPara("mfa-verificar");
    const precisaMfa = c.super || (c.empresas || []).some((e) => e.papel === "admin");
    if (precisaMfa && !c.tem_mfa) {
      irPara("mfa-obrigatoria");
      return prepararFator();
    }
    if (!(c.empresas || []).length) {
      if (!S.nomeConta) {
        try {
          const u = await auth.usuario();
          S.nomeConta = u.user_metadata && u.user_metadata.nome || "";
        } catch (e) {
        }
      }
      return irPara("sem-empresa");
    }
    const salvo = localStorage.getItem(CHAVE_EMP);
    S.emp = c.empresas.find((e) => e.id === salvo) || c.empresas[0];
    try {
      localStorage.setItem(CHAVE_EMP, S.emp.id);
    } catch (e) {
    }
    vigiarInatividade();
    S.tela = "app";
    if (!location.hash.startsWith("#/")) history.replaceState(null, "", "#/semana");
    return abrirRota();
  }
  function irPara(tela, msg) {
    S.tela = tela;
    S.msg = msg || null;
    S.ocupado = false;
    S.enviado = false;
    render();
  }
  async function abrirRota() {
    S.rota = (location.hash.replace(/^#\/?/, "") || "semana").replace(/\/$/, "");
    S.menu = false;
    S.gaveta = null;
    limparMsg();
    const r = S.rota, admin = S.emp && S.emp.papel === "admin";
    if ((r.startsWith("admin") || r === "auditoria") && !admin) {
      history.replaceState(null, "", "#/semana");
      S.rota = "semana";
    }
    if (r === "saus360" && !S.ctx.super) {
      history.replaceState(null, "", "#/semana");
      S.rota = "semana";
    }
    render();
    try {
      if (!S.emp.modulo_ok) return;
      if (S.rota === "semana") await carregarSemana();
      else if (S.rota === "admin" || S.rota === "admin/usuarios") S.dados.usuarios = await rpc("eq_admin_usuarios", { e: S.emp.id });
      else if (S.rota === "admin/logins") S.dados.logins = await rpc("eq_admin_logins", { e: S.emp.id, p_limite: 300 });
      else if (S.rota === "auditoria") {
        const [aud, us] = await Promise.all([rpc("eq_admin_auditoria", { e: S.emp.id, p_limite: 400 }), rpc("eq_admin_usuarios", { e: S.emp.id })]);
        S.dados.auditoria = aud;
        S.dados.usuarios = us;
      } else if (S.rota === "conta") S.dados.fatores = await auth.fatores();
      else if (S.rota === "saus360") S.dados.empresas = await rpc("eq_super_empresas");
    } catch (e) {
      erro(e);
    }
    render();
  }
  async function carregarSemana() {
    const me = S.ctx.user_id, e = S.emp.id;
    const [perfil] = await ler_("perfis_equipe", `empresa_id=eq.${e}&user_id=eq.${me}&select=chefe_id,cargo,capacidade_semanal,rotina_fixa`);
    let chefe = "";
    if (perfil && perfil.chefe_id) {
      const [m] = await ler_("membros", `empresa_id=eq.${e}&user_id=eq.${perfil.chefe_id}&ativo=is.true&select=nome`);
      chefe = m ? m.nome : "";
    }
    S.dados.semana = { perfil: perfil && { ...perfil, capacidade_semanal: Number(perfil.capacidade_semanal), rotina_fixa: Number(perfil.rotina_fixa) }, chefe };
  }
  window.addEventListener("hashchange", () => {
    if (S.tela === "app") abrirRota();
  });
  async function prepararFator() {
    S.fator = null;
    render();
    try {
      const fs = await auth.fatores();
      for (const f of fs.filter((x) => x.status !== "verified")) {
        try {
          await auth.removerFator(f.id);
        } catch (e) {
        }
      }
      const d = await auth.inscrever();
      S.fator = { id: d.id, qr: d.totp.qr_code, segredo: d.totp.secret };
    } catch (e) {
      erro(e);
    }
    render();
  }
  var ultimoUso = Date.now();
  var vigia = null;
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach((ev) => window.addEventListener(ev, () => {
    ultimoUso = Date.now();
  }, { passive: true }));
  function vigiarInatividade() {
    clearInterval(vigia);
    vigia = setInterval(async () => {
      const min = S.emp && S.emp.minutos_inatividade || 30;
      if (temSessao() && Date.now() - ultimoUso > min * 6e4) {
        clearInterval(vigia);
        await auth.sair("local");
        S.ctx = null;
        S.emp = null;
        S.dados = {};
        irPara("entrar", { tipo: "info", texto: "Tu sesión terminó porque estuvo " + min + " minutos sin uso." });
      }
    }, 2e4);
  }
  var dadosForm = (f) => Object.fromEntries(new FormData(f).entries());
  var conferirSenhas = (a, b) => {
    if (!senhaOk(a)) return "La contraseña necesita al menos 10 caracteres, con letras y números.";
    if (a !== b) return "Las dos contraseñas no son iguales.";
    return null;
  };
  var emailValido = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s || "");
  async function enviar(form) {
    const tipo = form.dataset.form, v = dadosForm(form);
    const passo = async (fn) => {
      S.ocupado = true;
      limparMsg();
      render();
      try {
        await fn();
      } catch (e) {
        erro(e);
      }
      S.ocupado = false;
      render();
    };
    if (tipo === "entrar") {
      S.f.email = (v.email || "").trim();
      if (!emailValido(S.f.email) || !v.senha) {
        S.msg = { tipo: "erro", texto: "Escribe el correo y la contraseña." };
        return render();
      }
      return passo(async () => {
        try {
          await auth.entrar(S.f.email, v.senha);
        } catch (e) {
          if (e.codigo === "nao_confirmado") {
            S.tela = "confirme";
            S.msg = { tipo: "info", texto: "Falta confirmar el correo de esta cuenta." };
            return;
          }
          if (e.codigo === "bloqueado") throw new Error("Demasiados intentos con contraseña incorrecta. Por seguridad, la cuenta queda bloqueada 15 minutos.");
          if (e.codigo === "limite") throw new Error("Demasiados intentos ahora. Espera unos minutos e inténtalo de nuevo.");
          if (e.codigo === "senha" || e.status === 401) throw new Error("El correo o la contraseña no coinciden.");
          throw e;
        }
        await carregar();
      });
    }
    if (tipo === "criar") {
      S.f.nome = (v.nome || "").trim();
      S.f.email = (v.email || "").trim();
      if (!S.f.nome) {
        S.msg = { tipo: "erro", texto: "Escribe tu nombre." };
        return render();
      }
      if (!emailValido(S.f.email)) {
        S.msg = { tipo: "erro", texto: "Revisa el correo." };
        return render();
      }
      const p = conferirSenhas(v.senha, v.senha2);
      if (p) {
        S.msg = { tipo: "erro", texto: p };
        return render();
      }
      return passo(async () => {
        const d = await auth.criarConta(S.f.email, v.senha, S.f.nome);
        S.nomeConta = S.f.nome;
        S.f.senha = "";
        if (d && d.access_token) {
          await carregar();
          return;
        }
        S.reenvioAte = Date.now() + 6e4;
        S.tela = "confirme";
        tickReenvio();
      });
    }
    if (tipo === "codigo") {
      const cod = (v.codigo || "").replace(/\D/g, "");
      if (cod.length < 6) {
        S.msg = { tipo: "erro", texto: "Escribe el código de 6 dígitos del correo." };
        return render();
      }
      return passo(async () => {
        await auth.confirmarCodigo(S.f.email, cod, "signup");
        S.retorno = { tipo: "signup" };
        await carregar();
      });
    }
    if (tipo === "esqueci") {
      S.f.email = (v.email || "").trim();
      if (!emailValido(S.f.email)) {
        S.msg = { tipo: "erro", texto: "Revisa el correo." };
        return render();
      }
      return passo(async () => {
        await auth.esqueci(S.f.email);
        S.enviado = true;
        S.msg = { tipo: "ok", texto: "Si hay una cuenta con ese correo, el enlace ya va en camino. Vale 1 hora." };
      });
    }
    if (tipo === "nova-senha") {
      const p = conferirSenhas(v.senha, v.senha2);
      if (p) {
        S.msg = { tipo: "erro", texto: p };
        return render();
      }
      return passo(async () => {
        await auth.definirSenha(v.senha);
        S.f = {};
        toast("Contraseña nueva guardada.");
        await carregar();
      });
    }
    if (tipo === "aceitar-convite") {
      S.f.nome = v.nome;
      if (!(v.nome || "").trim()) {
        S.msg = { tipo: "erro", texto: "Escribe tu nombre." };
        return render();
      }
      const p = conferirSenhas(v.senha, v.senha2);
      if (p) {
        S.msg = { tipo: "erro", texto: p };
        return render();
      }
      return passo(async () => {
        await auth.definirSenha(v.senha);
        const e = await rpc("eq_aceitar_convite", { p_convite: v.convite, p_nome: v.nome.trim() });
        try {
          localStorage.setItem(CHAVE_EMP, e);
        } catch (x) {
        }
        S.f = {};
        await carregar();
      });
    }
    if (tipo === "mfa-verificar") {
      const cod = (v.codigo || "").replace(/\D/g, "");
      if (cod.length !== 6) {
        S.msg = { tipo: "erro", texto: "Escribe los 6 dígitos de la app autenticadora." };
        return render();
      }
      return passo(async () => {
        const f = (await auth.fatores()).find((x) => x.status === "verified");
        if (!f) throw new Error("No hay app autenticadora activa en esta cuenta.");
        try {
          await auth.confirmarFator(f.id, cod);
        } catch (e) {
          throw new Error("Código incorrecto o vencido. Revisa la app e inténtalo de nuevo.");
        }
        S.ctx = await rpc("eq_contexto");
        if (S.depoisMfa === "nova-senha") {
          S.depoisMfa = null;
          S.tela = "nova-senha";
          return;
        }
        await decidir();
      });
    }
    if (tipo === "mfa-ativar") {
      const cod = (v.codigo || "").replace(/\D/g, "");
      if (cod.length !== 6 || !S.fator) {
        S.msg = { tipo: "erro", texto: "Escribe los 6 dígitos de la app autenticadora." };
        return render();
      }
      return passo(async () => {
        try {
          await auth.confirmarFator(S.fator.id, cod);
        } catch (e) {
          throw new Error("Código incorrecto o vencido. Revisa la app e inténtalo de nuevo.");
        }
        S.fator = null;
        S.ativandoMfa = false;
        S.ctx = await rpc("eq_contexto");
        toast("Verificación en dos pasos activada.");
        if (S.tela === "app") {
          S.dados.fatores = await auth.fatores();
          return;
        }
        await decidir();
      });
    }
    if (tipo === "criar-empresa") {
      S.f.empresa = v.empresa;
      S.f.nome = v.nome;
      if ((v.empresa || "").trim().length < 2) {
        S.msg = { tipo: "erro", texto: "Escribe el nombre de la empresa." };
        return render();
      }
      if (!(v.nome || "").trim()) {
        S.msg = { tipo: "erro", texto: "Escribe tu nombre." };
        return render();
      }
      return passo(async () => {
        const e = await rpc("eq_criar_empresa", { p_nome: v.empresa.trim(), p_seu_nome: v.nome.trim() });
        try {
          localStorage.setItem(CHAVE_EMP, e);
        } catch (x) {
        }
        S.f = {};
        S.ctx = await rpc("eq_contexto");
        await decidir();
      });
    }
    if (tipo === "convidar") {
      Object.assign(S.f, { email: (v.email || "").trim(), nome: (v.nome || "").trim(), papel: v.papel, chefe: v.chefe, cargo: v.cargo, capacidade: v.capacidade, rotina: v.rotina });
      const cap = numero(v.capacidade), rot = numero(v.rotina);
      const p = !emailValido(S.f.email) ? "Revisa el correo." : !S.f.nome ? "Escribe el nombre de la persona." : !(cap >= 0 && cap <= 80) ? "La capacidad semanal va de 0 a 80 horas." : !(rot >= 0 && rot <= cap) ? "La rutina fija no puede superar la capacidad." : null;
      if (p) {
        S.msg = { tipo: "erro", texto: p };
        return render();
      }
      return passo(async () => {
        const r = await funcao("equipe-convidar", { empresa_id: S.emp.id, email: S.f.email, nome: S.f.nome, papel: S.f.papel, chefe_id: S.f.chefe || null, cargo: S.f.cargo, capacidade: cap, rotina: rot });
        S.convite = { ...r, email: S.f.email.toLowerCase() };
        S.f = {};
        S.dados.usuarios = await rpc("eq_admin_usuarios", { e: S.emp.id });
      });
    }
    if (tipo === "salvar-membro") {
      const cap = numero(v.capacidade), rot = numero(v.rotina);
      if (!(cap >= 0 && cap <= 80)) {
        S.msg = { tipo: "erro", texto: "La capacidad semanal va de 0 a 80 horas." };
        return render();
      }
      if (!(rot >= 0 && rot <= cap)) {
        S.msg = { tipo: "erro", texto: "La rutina fija no puede superar la capacidad." };
        return render();
      }
      const m = S.dados.usuarios.membros.find((x) => x.user_id === v.user);
      const ativo = m.user_id === S.ctx.user_id ? true : !!form.querySelector('[name="ativo"]').checked;
      return passo(async () => {
        await rpc("eq_admin_salvar_membro", { e: S.emp.id, p_user: v.user, p_nome: v.nome, p_papel: v.papel, p_chefe: v.chefe || null, p_cargo: v.cargo, p_capacidade: cap, p_rotina: rot, p_ativo: ativo });
        S.dados.usuarios = await rpc("eq_admin_usuarios", { e: S.emp.id });
        S.gaveta = null;
        toast("Cambios guardados.");
        if (v.user === S.ctx.user_id) {
          S.ctx = await rpc("eq_contexto");
          S.emp = S.ctx.empresas.find((e) => e.id === S.emp.id) || S.emp;
        }
      });
    }
    if (tipo === "config") {
      const lim = numero(v.limite), min = Math.round(numero(v.minutos));
      if (!(lim >= 0 && lim <= 80)) {
        S.msg = { tipo: "erro", texto: "El límite de aprobación va de 0 a 80 horas." };
        return render();
      }
      if (!(min >= 5 && min <= 480)) {
        S.msg = { tipo: "erro", texto: "El tiempo sin uso va de 5 a 480 minutos." };
        return render();
      }
      return passo(async () => {
        await rpc("eq_admin_config", { e: S.emp.id, p_limite: lim, p_minutos: min });
        S.ctx = await rpc("eq_contexto");
        S.emp = S.ctx.empresas.find((e) => e.id === S.emp.id) || S.emp;
        toast("Reglas guardadas.");
      });
    }
    if (tipo === "trocar-senha") {
      if (!v.atual) {
        S.msg = { tipo: "erro", texto: "Escribe la contraseña actual." };
        return render();
      }
      const p = conferirSenhas(v.senha, v.senha2);
      if (p) {
        S.msg = { tipo: "erro", texto: p };
        return render();
      }
      if (v.senha === v.atual) {
        S.msg = { tipo: "erro", texto: "La contraseña nueva tiene que ser distinta de la actual." };
        return render();
      }
      return passo(async () => {
        try {
          await auth.conferirSenha(S.ctx.email, v.atual);
        } catch (e) {
          throw new Error(e.codigo === "bloqueado" ? "Demasiados intentos con contraseña incorrecta. Espera 15 minutos." : "La contraseña actual no coincide.");
        }
        await auth.definirSenha(v.senha);
        S.f = {};
        S.msg = { tipo: "ok", texto: "Contraseña cambiada." };
      });
    }
    if (tipo === "salvar-modulo") {
      return passo(async () => {
        await rpc("eq_super_modulo", { e: v.id, p_ativo: !!form.querySelector('[name="ativo"]').checked, p_plano: v.plano, p_valido_ate: v.ate || null, p_sso: !!form.querySelector('[name="sso"]').checked });
        S.dados.empresas = await rpc("eq_super_empresas");
        S.gaveta = null;
        toast("Empresa actualizada.");
      });
    }
  }
  async function acao(el, ev) {
    const a = el.dataset.a;
    if (a === "ir") {
      S.f = { email: S.f.email };
      return irPara(el.dataset.v);
    }
    if (a === "sair") {
      await auth.sair("local");
      S.ctx = null;
      S.emp = null;
      S.dados = {};
      clearInterval(vigia);
      history.replaceState(null, "", location.pathname);
      return irPara("entrar");
    }
    if (a === "sair-todos") {
      if (!confirm("¿Salir de todos los dispositivos? Vas a tener que iniciar sesión de nuevo en cada uno.")) return;
      await auth.sair("global");
      S.ctx = null;
      S.emp = null;
      S.dados = {};
      clearInterval(vigia);
      history.replaceState(null, "", location.pathname);
      return irPara("entrar", { tipo: "ok", texto: "Saliste de todos los dispositivos." });
    }
    if (a === "microsoft") return auth.microsoft();
    if (a === "reenviar") {
      S.ocupado = true;
      render();
      try {
        await auth.reenviarConfirmacao(S.f.email);
        S.msg = { tipo: "ok", texto: "Lo enviamos de nuevo. Revisa también el spam." };
        S.reenvioAte = Date.now() + 6e4;
        tickReenvio();
      } catch (e) {
        erro(e);
      }
      S.ocupado = false;
      return render();
    }
    if (a === "aceitar") {
      S.ocupado = true;
      render();
      try {
        const e = await rpc("eq_aceitar_convite", { p_convite: el.dataset.id, p_nome: null });
        try {
          localStorage.setItem(CHAVE_EMP, e);
        } catch (x) {
        }
        S.ctx = await rpc("eq_contexto");
        S.ocupado = false;
        return decidir();
      } catch (e) {
        erro(e);
        S.ocupado = false;
        return render();
      }
    }
    if (a === "menu") {
      S.menu = !S.menu;
      return render();
    }
    if (a === "convidar") {
      S.gaveta = "convidar";
      S.convite = null;
      S.f = {};
      limparMsg();
      return render();
    }
    if (a === "editar") {
      S.gaveta = "editar";
      S.editando = el.dataset.id;
      limparMsg();
      return render();
    }
    if (a === "editar-modulo") {
      S.gaveta = "modulo";
      S.editando = el.dataset.id;
      limparMsg();
      return render();
    }
    if (a === "fechar") {
      S.gaveta = null;
      S.convite = null;
      limparMsg();
      return render();
    }
    if (a === "fechar-fora") {
      if (ev.target === el) {
        S.gaveta = null;
        S.convite = null;
        limparMsg();
        render();
      }
      return;
    }
    if (a === "copiar-link") {
      const i = document.getElementById("linkConvite");
      i.select();
      try {
        await navigator.clipboard.writeText(i.value);
        toast("Enlace copiado.");
      } catch (e) {
        document.execCommand && document.execCommand("copy");
        toast("Enlace copiado.");
      }
      return;
    }
    if (a === "cancelar-convite") {
      if (!confirm("¿Cancelar esta invitación? El enlace deja de funcionar.")) return;
      try {
        await rpc("eq_admin_cancelar_convite", { p_convite: el.dataset.id });
        S.dados.usuarios = await rpc("eq_admin_usuarios", { e: S.emp.id });
        toast("Invitación cancelada.");
      } catch (e) {
        erro(e);
      }
      return render();
    }
    if (a === "reenviar-convite") {
      const c = S.dados.usuarios.convites.find((x) => x.id === el.dataset.id);
      S.gaveta = "convidar";
      S.convite = null;
      S.f = { email: c.email, nome: c.nome, papel: c.papel, chefe: c.chefe_id || "", cargo: c.cargo || "", capacidade: c.capacidade_semanal != null ? c.capacidade_semanal : 40, rotina: c.rotina_fixa != null ? c.rotina_fixa : 0 };
      S.msg = { tipo: "info", texto: "Revisa los datos y envía de nuevo. La invitación anterior deja de valer." };
      return render();
    }
    if (a === "mfa-comecar") {
      S.ativandoMfa = true;
      limparMsg();
      return prepararFator();
    }
    if (a === "mfa-cancelar") {
      S.ativandoMfa = false;
      S.fator = null;
      return render();
    }
    if (a === "mfa-desativar") {
      if (!confirm("¿Desactivar la verificación en dos pasos? La cuenta queda protegida solo por la contraseña.")) return;
      try {
        await auth.removerFator(el.dataset.id);
        await forcarRenovacao();
        S.ctx = await rpc("eq_contexto");
        S.dados.fatores = await auth.fatores();
        toast("Verificación en dos pasos desactivada.");
      } catch (e) {
        erro(e);
      }
      return render();
    }
    if (a === "idioma") {
      try {
        localStorage.setItem("s360eq-idioma", el.dataset.v);
      } catch (e) {
      }
      return location.reload();
    }
  }
  app.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-a]");
    if (!el || el.disabled || el.tagName === "SELECT") return;
    if (el.tagName === "A" && el.getAttribute("href")) return;
    if (el.dataset.a === "fechar-fora" && ev.target !== el) return;
    ev.preventDefault();
    acao(el, ev);
  });
  app.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && S.gaveta) {
      S.gaveta = null;
      S.convite = null;
      render();
    }
    if (ev.key === "Enter" && ev.target.matches("tr[data-a]")) {
      ev.preventDefault();
      acao(ev.target, ev);
    }
  });
  app.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!S.ocupado) enviar(ev.target);
  });
  app.addEventListener("change", (ev) => {
    if (ev.target.dataset.a === "trocar-empresa") {
      const e = S.ctx.empresas.find((x) => x.id === ev.target.value);
      if (e) {
        S.emp = e;
        S.dados = {};
        try {
          localStorage.setItem(CHAVE_EMP, e.id);
        } catch (x) {
        }
        abrirRota();
      }
    }
  });
  app.addEventListener("input", (ev) => {
    const i = ev.target;
    if (i.dataset && i.dataset.senha === "1") {
      S.f.senha = i.value;
      const r = regrasSenha(i.value), lis = i.closest("form").querySelectorAll(".regras li"), fz = i.closest("form").querySelector(".forca");
      [r.tamanho, r.letra, r.numero].forEach((ok, k) => lis[k] && lis[k].classList.toggle("ok", ok));
      if (fz) fz.dataset.n = forcaSenha(i.value);
    }
  });
  var tick;
  function tickReenvio() {
    clearInterval(tick);
    tick = setInterval(() => {
      const b = app.querySelector('[data-a="reenviar"]');
      if (!b || S.tela !== "confirme") return clearInterval(tick);
      const s = Math.max(0, Math.ceil(((S.reenvioAte || 0) - Date.now()) / 1e3));
      b.disabled = s > 0;
      b.textContent = s > 0 ? `Reenviar en ${s} s` : "Reenviar correo";
      if (!s) clearInterval(tick);
    }, 1e3);
  }
  boot();
})();
