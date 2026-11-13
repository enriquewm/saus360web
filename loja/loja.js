/* Saus360 · loja online pública (saus360.com.br/loja/<endereço>)
   Mostra o catálogo que a empresa publicou e envia o pedido. Preços, promoções e combos são sempre
   conferidos no servidor: o que sai daqui é só "qual produto" e "quantos".
   Todo texto que vem do servidor passa por esc() antes de entrar na página. */
(function () {
  "use strict";
  var CFG = window.DECANTA_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"'`]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c]; }); };
  var digits = function (s) { return String(s || "").replace(/\D/g, ""); };
  var tem = function (o, k) { return typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k); };
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var m = location.pathname.match(/^\/loja\/([a-z0-9-]{3,40})\/?$/i);
  var slug = (m ? m[1] : (new URLSearchParams(location.search).get("l") || location.hash.replace(/^#\/?/, "") || "")).toLowerCase();
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) slug = "";

  var L = null, PRODS = [], COMBOS = [], CARRO = {}, BUSCA = "", ENVIANDO = false, ERRO = "", CAMPO = "", OUTRA = false, QF = 1;
  var FORM = { nome: "", fone: "", modo: "", end: "", data: "", hora: "", obs: "", site: "" };

  var TEMAS = { framboesa: ["#B5285A", "#8F1D46", "#FCEBF1"], chocolate: ["#6B3E26", "#51301D", "#F6ECE4"], pistache: ["#4F7A3A", "#3D6030", "#EDF4E7"], caramelo: ["#A35C08", "#7F4705", "#FBF0DF"],
    lavanda: ["#6B4FA8", "#523C85", "#F0ECFA"], azul: ["#1D5C96", "#164876", "#E7F1FB"], carvao: ["#2B2E3F", "#1B1D2A", "#EEEEF3"] };
  var SELOS = { novo: "Novidade", top: "Mais pedido", limitado: "Edição limitada" };
  var MOEDA = { BR: ["pt-BR", "BRL"], MX: ["es-MX", "MXN"], US: ["en-US", "USD"] };
  var money = function (n) { var c = L && tem(MOEDA, L.pais) ? MOEDA[L.pais] : MOEDA.BR; return Number(n || 0).toLocaleString(c[0], { style: "currency", currency: c[1] }); };
  var numTxt = function (n) { return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 }); };
  var dataBR = function (s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return ""; var p = s.split("-"); return p[2] + "/" + p[1]; };
  var somaDias = function (iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var diaSem = function (iso, longo) { return new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: longo ? "long" : "short", timeZone: "UTC" }).replace(".", ""); };
  var iniciais = function (s) { var w = String(s || "?").split(/\s+/).filter(function (x) { return x && !/^(de|da|do|das|dos|com|e|no|na|em|\d.*)$/i.test(x); }); return (w.length ? w : [String(s || "?")]).slice(0, 2).map(function (x) { return x[0]; }).join("").toUpperCase(); };
  /* imagem só do armazenamento do Saus360 (o servidor já confere; aqui é a segunda trava) */
  var imgOk = function (u) { return typeof u === "string" && !!CFG.supabaseUrl && u.indexOf(CFG.supabaseUrl + "/storage/v1/object/public/produtos/") === 0 && !/["'<>\s\\]/.test(u); };
  var ph = function (nome, cls) { return '<span class="ph ' + (cls || "") + '" aria-hidden="true">' + IC.bolo + "</span>"; };
  var foto = function (o, alt) { return imgOk(o.foto) ? '<img src="' + esc(o.foto) + '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async">' : ph(o.nome); };

  var IC = {
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.300-4.200A8.300 8.300 0 1112 20.300a8.300 8.300 0 01-3.900-1L4 20z"/><path d="M9.300 8.600c-.300 2.700 2.400 5.800 5.400 6.100l1.100-1.300-1.700-1-.900.700c-.800-.400-1.500-1.100-1.900-1.900l.700-.900-1-1.700-1.700 1z" fill="currentColor" stroke="none"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3.500" y="3.500" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.200" cy="6.800" r="1" fill="currentColor" stroke="none"/></svg>',
    envia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5"/></svg>',
    pino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.200 7-11.500A7 7 0 005 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></svg>',
    moto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17.500" cy="17.500" r="1.800"/></svg>',
    hora: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="5.500" width="16" height="14.500" rx="3"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/></svg>',
    sino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h3l7 4V6l-7 4H4zM17.500 9.500a4 4 0 010 5"/></svg>',
    volta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    bolo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16M5 20v-6.500a1.500 1.500 0 011.500-1.500h11a1.500 1.500 0 011.500 1.500V20"/><path d="M5 15.500c1.200 1 2.300 1 3.500 0s2.300-1 3.500 0 2.300 1 3.500 0 2.300-1 3.500 0M8 12V9.500M12 12V9.500M16 12V9.500"/><path d="M8 7.500c-.700-.700-.700-1.600 0-2.500.700.900.700 1.800 0 2.500zM12 7.500c-.700-.700-.700-1.600 0-2.500.700.900.700 1.800 0 2.500zM16 7.500c-.700-.700-.700-1.600 0-2.500.700.900.700 1.800 0 2.500z"/></svg>',
    sacola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.200 11.200a1.800 1.800 0 01-1.800 1.600H8a1.800 1.800 0 01-1.800-1.600L5 8z"/><path d="M9 10V7a3 3 0 016 0v3"/></svg>',
    certo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'
  };

  /* ---------- sacola ---------- */
  var CHAVE = "saus360-loja-" + slug;
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify({ c: CARRO, f: { nome: FORM.nome, fone: FORM.fone, end: FORM.end } })); } catch (e) {} }
  function recuperar() {
    try {
      var g = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (!g || typeof g !== "object") return;
      var c = g.c && typeof g.c === "object" ? g.c : {};
      Object.keys(c).forEach(function (k) { var q = Number(c[k]); if (isFinite(q) && q > 0 && q <= 999) CARRO[k] = q; });
      ["nome", "fone", "end"].forEach(function (k) { if (g.f && typeof g.f[k] === "string") FORM[k] = g.f[k].slice(0, 200); });
    } catch (e) {}
  }
  /* chave "c:<id>" = combo; o resto é produto */
  function item(k) {
    if (String(k).indexOf("c:") === 0) { var c = COMBOS.find(function (x) { return "c:" + x.id === k; }); return c ? { k: k, combo: true, o: c, nome: c.nome, preco: Number(c.preco), de: Number(c.de), un: "un", passo: 1 } : null; }
    var p = PRODS.find(function (x) { return x.id === k; });
    return p ? { k: k, combo: false, o: p, nome: p.nome, preco: Number(p.preco), de: p.de ? Number(p.de) : 0, un: p.un, passo: p.un === "un" ? 1 : 0.5 } : null;
  }
  /* mesma conta do servidor: soma pelo preço normal e tira promoções e combos como desconto */
  function carro() {
    var itens = [], bruto = 0, desc = 0, n = 0;
    Object.keys(CARRO).forEach(function (k) {
      var it = item(k), q = CARRO[k]; if (!it || !(q > 0)) return;
      var cheio = it.de > it.preco ? it.de : it.preco;
      itens.push({ it: it, q: q }); bruto += q * cheio; desc += q * (cheio - it.preco); n += it.un === "un" ? q : 1;
    });
    bruto = r2(bruto); desc = Math.min(r2(desc), bruto);
    return { itens: itens, bruto: bruto, desc: desc, total: r2(bruto - desc), n: n };
  }
  function mudar(k, delta) {
    var it = item(k); if (!it) return;
    var q = r2((CARRO[k] || 0) + delta * it.passo);
    if (q <= 0) delete CARRO[k]; else CARRO[k] = Math.min(it.combo ? 50 : 999, q);
    guardar();
    Array.prototype.forEach.call(document.querySelectorAll("[data-ctl]"), function (el) { if (el.dataset.ctl === k) el.innerHTML = ctl(k); });
    barra(delta > 0);
  }

  function rpc(nome, corpo) {
    return fetch(CFG.supabaseUrl + "/rest/v1/rpc/" + nome, { method: "POST", headers: { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify(corpo), credentials: "omit", referrerPolicy: "no-referrer" })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error("Erro " + r.status); return j; }); });
  }
  function estado(titulo, texto) {
    $("app").innerHTML = '<div class="estado"><h1>' + esc(titulo) + '</h1><p class="muted">' + esc(texto) + '</p><p style="margin-top:22px"><a class="btn linha" style="display:inline-flex;flex:none" href="https://saus360.com.br/">Conhecer o Saus360</a></p></div>';
  }
  function brinde(txt) {
    var b = document.createElement("div"); b.className = "brinde"; b.setAttribute("role", "status"); b.textContent = txt; document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 1700);
  }

  /* ---------- carregar ---------- */
  function carregar() {
    if (!slug) { estado("Página não encontrada", "Confira o endereço que você recebeu."); return; }
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(CFG.supabaseUrl || "")) { estado("Loja indisponível", "Tente de novo em instantes."); return; }
    rpc("loja_publica", { p_slug: slug }).then(function (r) {
      if (!r || !r.ok) {
        if (r && r.motivo === "fechada") estado(r.nome || "Loja fechada", "A loja online está pausada no momento. Fale com a loja para fazer seu pedido.");
        else if (r && r.motivo === "indisponivel") estado(r.nome || "Loja indisponível", "Esta loja não está recebendo pedidos agora.");
        else estado("Loja não encontrada", "Confira o endereço que você recebeu.");
        return;
      }
      L = r.loja || {}; L.hoje = /^\d{4}-\d{2}-\d{2}$/.test(r.hoje || "") ? r.hoje : new Date().toISOString().slice(0, 10);
      L.antecedencia = Math.max(0, Math.min(60, parseInt(L.antecedencia, 10) || 0)); L.taxa = Math.max(0, Number(L.taxa) || 0); L.minimo = Math.max(0, Number(L.minimo) || 0);
      PRODS = Array.isArray(r.produtos) ? r.produtos : []; COMBOS = Array.isArray(r.combos) ? r.combos : [];
      var t = tem(TEMAS, L.tema) ? TEMAS[L.tema] : TEMAS.framboesa, st = document.documentElement.style;
      st.setProperty("--acc", t[0]); st.setProperty("--acc-d", t[1]); st.setProperty("--acc-soft", t[2]);
      var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute("content", imgOk(L.capa) ? "#FFFFFF" : t[0]);
      document.title = (L.nome || "Loja") + " · Faça seu pedido";
      recuperar();
      Object.keys(CARRO).forEach(function (k) { if (!item(k)) delete CARRO[k]; });
      FORM.modo = L.retirada ? "retirada" : "entrega";
      FORM.data = somaDias(L.hoje, L.antecedencia);
      desenhar();
    }).catch(function () { estado("Sem conexão", "Não foi possível abrir a loja. Verifique a internet e tente de novo."); });
  }

  /* ---------- vitrine ---------- */
  function precoHtml(o, un) {
    var promo = o.de && Number(o.de) > Number(o.preco);
    return '<span class="pr' + (promo ? " promo" : "") + '"><b>' + money(o.preco) + "</b>" + (un && un !== "un" ? "<small>/" + esc(un) + "</small>" : "") + (promo ? "<s>" + money(o.de) + "</s>" : "") + "</span>";
  }
  function pct(o) { return o.de && Number(o.de) > Number(o.preco) ? Math.round((1 - Number(o.preco) / Number(o.de)) * 100) : 0; }
  function ctl(k) {
    var it = item(k), q = CARRO[k] || 0; if (!it) return "";
    if (!q) return '<button class="mais" data-a="add" data-k="' + esc(k) + '" aria-label="Adicionar ' + esc(it.nome) + '">' + IC.mais + "</button>";
    return '<div class="step"><button data-a="sub" data-k="' + esc(k) + '" aria-label="Tirar um">−</button><output aria-label="Na sacola">' + numTxt(q) + '</output><button data-a="add" data-k="' + esc(k) + '" aria-label="Mais um">+</button></div>';
  }
  function card(p) {
    var d = pct(p);
    return '<article class="prod"><div class="pw"><button class="pfoto" data-a="ver" data-k="' + esc(p.id) + '" aria-label="' + esc(p.nome) + ", " + esc(money(p.preco)) + '">' + foto(p) + "</button>" +
      (d > 0 ? '<span class="stk">−' + d + "%</span>" : "") + (tem(SELOS, p.selo) ? '<span class="selo">' + SELOS[p.selo] + "</span>" : "") +
      '<div class="ctl" data-ctl="' + esc(p.id) + '">' + ctl(p.id) + "</div></div>" +
      '<div class="ptx"><h3>' + esc(p.nome) + "</h3>" + (p.desc ? "<p>" + esc(p.desc) + "</p>" : "") + precoHtml(p, p.un) + (p.pronta ? '<span class="pronta">Pronta entrega</span>' : "") + "</div></article>";
  }
  function cardDest(p) {
    var d = pct(p);
    return '<article class="dest"><button class="dfoto" data-a="ver" data-k="' + esc(p.id) + '" aria-label="' + esc(p.nome) + ", " + esc(money(p.preco)) + '">' + foto(p) +
      '<span class="dtx"><b>' + esc(p.nome) + "</b><span>" + money(p.preco) + (p.un !== "un" ? "/" + esc(p.un) : "") + (d > 0 ? "<s>" + money(p.de) + "</s>" : "") + "</span></span></button>" +
      (d > 0 ? '<span class="stk">−' + d + "%</span>" : "") + '<div class="ctl" data-ctl="' + esc(p.id) + '">' + ctl(p.id) + "</div></article>";
  }
  function comboItens(c) { return (c.itens || []).map(function (i) { return numTxt(i.q) + (i.un && i.un !== "un" ? " " + i.un : "") + " " + i.nome; }).join(" + "); }
  function cardCombo(c) {
    var k = "c:" + c.id, econ = r2(Number(c.de) - Number(c.preco));
    return '<article class="combo"><button class="cbody" data-a="ver" data-k="' + esc(k) + '" aria-label="' + esc(c.nome) + ", " + esc(money(c.preco)) + '"><span class="cfoto">' + foto(c) + "</span>" +
      '<span class="ctx"><b>' + esc(c.nome) + "</b><small>" + esc(comboItens(c)) + "</small>" + precoHtml(c) + (econ > 0 ? '<span><span class="econ">Economize ' + money(econ) + "</span></span>" : "") + "</span></button>" +
      '<div class="ctl" data-ctl="' + esc(k) + '">' + ctl(k) + "</div></article>";
  }
  function catsUsadas() {
    var nomes = Object.create(null); (Array.isArray(L.cats) ? L.cats : []).forEach(function (c) { nomes[c.id] = c.l; });
    var ids = []; PRODS.forEach(function (p) { if (ids.indexOf(p.cat) < 0) ids.push(p.cat); });
    return ids.map(function (id, i) { return { id: "cat" + i, cat: id, l: nomes[id] || "Outros" }; });
  }
  function secoes() {
    var s = [], dest = PRODS.filter(function (p) { return p.destaque; }).slice(0, 8), promos = PRODS.filter(function (p) { return pct(p) > 0; });
    if (dest.length) s.push({ id: "destaques", l: "Destaques", t: "Destaques de hoje", extra: diaSem(L.hoje, true) + ", " + dataBR(L.hoje), h: '<div class="trilho">' + dest.map(cardDest).join("") + "</div>" });
    if (COMBOS.length) s.push({ id: "combos", l: "Combos", t: "Combos", extra: "", h: '<div class="trilho">' + COMBOS.map(cardCombo).join("") + "</div>" });
    if (promos.length) s.push({ id: "promos", l: "Promoções", t: "Promoções", extra: "", h: '<div class="trilho">' + promos.map(card).join("") + "</div>" });
    var cs = catsUsadas();
    cs.forEach(function (c) { s.push({ id: c.id, l: c.l, t: cs.length > 1 || s.length ? c.l : "Cardápio", extra: "", h: '<div class="grade">' + PRODS.filter(function (p) { return p.cat === c.cat; }).map(card).join("") + "</div>" }); });
    return s;
  }
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  function conteudo() {
    if (!PRODS.length && !COMBOS.length) return '<div class="vazio"><b>Cardápio em preparação</b>A loja ainda está colocando os produtos. Volte em breve ou fale pelo WhatsApp.</div>';
    if (BUSCA.trim()) {
      var q = norm(BUSCA.trim()), ps = PRODS.filter(function (p) { return norm(p.nome + " " + (p.desc || "")).indexOf(q) >= 0; }), cs = COMBOS.filter(function (c) { return norm(c.nome + " " + comboItens(c)).indexOf(q) >= 0; });
      if (!ps.length && !cs.length) return '<div class="vazio"><b>Nada encontrado</b>Tente outra palavra ou veja o cardápio completo.<p style="margin-top:14px"><button class="btn linha" style="flex:none" data-a="limpar">Ver tudo</button></p></div>';
      return '<section class="sec"><header><h2>' + (ps.length + cs.length) + (ps.length + cs.length === 1 ? " resultado" : " resultados") + "</h2></header>" + (cs.length ? '<div class="trilho">' + cs.map(cardCombo).join("") + "</div>" : "") + '<div class="grade">' + ps.map(card).join("") + "</div></section>";
    }
    return secoes().map(function (s) { return '<section class="sec" id="s-' + s.id + '"><header><h2>' + esc(s.t) + "</h2>" + (s.extra ? "<small>" + esc(s.extra) + "</small>" : "") + "</header>" + s.h + "</section>"; }).join("");
  }
  function desenhar() {
    var fatos = [], ss = secoes(), temCapa = imgOk(L.capa);
    var fato = function (ic, rot, val) { return "<li>" + ic + "<span><small>" + rot + "</small><b>" + val + "</b></span></li>"; };
    if (L.retirada) fatos.push(fato(IC.pino, "Retirada", L.endereco ? esc(L.endereco) : "Na loja"));
    if (L.entrega) fatos.push(fato(IC.moto, "Entrega", L.taxa > 0 ? money(L.taxa) : "Grátis"));
    fatos.push(fato(IC.cal, "Encomendas", L.antecedencia > 0 ? "Com " + L.antecedencia + (L.antecedencia === 1 ? " dia" : " dias") + " de antecedência" : "Também para hoje"));
    if (L.horario) fatos.push(fato(IC.hora, "Horário", esc(L.horario)));
    if (L.minimo > 0) fatos.push(fato(IC.sacola, "Pedido mínimo", money(L.minimo)));
    var h = '<div class="capa' + (temCapa ? "" : " lisa") + '">' + (temCapa ? '<img src="' + esc(L.capa) + '" alt="" fetchpriority="high">' : "") + "</div>" +
      '<div class="wrap"><header class="topo"><div class="linha"><div class="logo">' + (imgOk(L.logo) ? '<img src="' + esc(L.logo) + '" alt="Logo de ' + esc(L.nome) + '">' : esc(iniciais(L.nome))) + '</div><div class="acoes">' +
      (digits(L.whatsapp) ? '<a class="wa" href="' + esc(waLink("Olá! Vim pela loja online.")) + '" target="_blank" rel="noopener" aria-label="Falar pelo WhatsApp">' + IC.wa + "</a>" : "") +
      (/^[A-Za-z0-9._]{1,30}$/.test(L.insta || "") ? '<a href="https://instagram.com/' + esc(L.insta) + '" target="_blank" rel="noopener" aria-label="Instagram da loja">' + IC.insta + "</a>" : "") +
      '<button data-a="compartilhar" aria-label="Compartilhar a loja">' + IC.envia + "</button></div></div>" +
      '<div class="corpo"><div class="ident"><h1>' + esc(L.nome) + "</h1>" + (L.bio ? '<p class="bio">' + esc(L.bio) + "</p>" : "") +
      (L.aviso ? '<p class="fita">' + IC.sino + "<span>" + esc(L.aviso) + "</span></p>" : "") + '</div><ul class="fatos" aria-label="Como a loja atende">' + fatos.join("") + "</ul></div></header></div>";
    if (PRODS.length + COMBOS.length > 0) {
      h += '<nav class="nav" aria-label="Seções da loja"><div class="wrap">' +
        (PRODS.length > 8 ? '<div class="busca">' + IC.busca + '<input type="search" id="busca" placeholder="Buscar na loja" value="' + esc(BUSCA) + '" aria-label="Buscar na loja" autocomplete="off" enterkeyhint="search" maxlength="60"></div>' : "") +
        (ss.length > 1 ? '<div class="abas" id="abas">' + ss.map(function (s, i) { return '<button data-a="ir" data-id="' + esc(s.id) + '" aria-current="' + (i === 0) + '">' + esc(s.l) + "</button>"; }).join("") + "</div>" : "") + "</div></nav>";
    }
    h += '<div class="wrap" id="conteudo">' + conteudo() + "</div>" + (PRODS.length + COMBOS.length > 0 ? fimLoja() : "");
    $("app").innerHTML = h;
    barra(); espiar();
  }
  /* fim da vitrine: como o pedido funciona e os dados da loja */
  function fimLoja() {
    var wa = digits(L.whatsapp), ig = /^[A-Za-z0-9._]{1,30}$/.test(L.insta || "") ? L.insta : "";
    var passos = '<section class="como" aria-labelledby="t-como"><h2 id="t-como">Como fazer seu pedido</h2><ol>' +
      "<li><b>Escolha os produtos</b><span>Toque no + e eles vão para a sacola.</span></li>" +
      "<li><b>Marque o dia</b><span>" + (L.retirada && L.entrega ? "Retirada na loja ou entrega, no dia que preferir." : L.entrega ? "Escolha o dia da entrega." : "Escolha o dia da retirada.") + "</span></li>" +
      "<li><b>Envie o pedido</b><span>" + esc(L.nome || "A loja") + " confirma" + (wa ? " pelo WhatsApp" : "") + " e combina o pagamento com você.</span></li></ol></section>";
    var dados = [];
    if (L.retirada && L.endereco) dados.push("<li>" + IC.pino + "<span>" + esc(L.endereco) + "</span></li>");
    if (L.horario) dados.push("<li>" + IC.hora + "<span>" + esc(L.horario) + "</span></li>");
    var links = (wa ? '<a class="btn wa" href="' + esc(waLink("Olá! Vim pela loja online.")) + '" target="_blank" rel="noopener">' + IC.wa + "Falar no WhatsApp</a>" : "") +
      (ig ? '<a class="btn linha" href="https://instagram.com/' + esc(ig) + '" target="_blank" rel="noopener">' + IC.insta + "@" + esc(ig) + "</a>" : "");
    var marca = imgOk(L.logo) ? '<img src="' + esc(L.logo) + '" alt="">' : esc(iniciais(L.nome));
    return '<div class="wrap" id="fimloja">' + passos + '<section class="sobre" aria-labelledby="t-sobre"><div class="sobre-id"><span class="logo pequena">' + marca + '</span><div><h2 id="t-sobre">' + esc(L.nome) + "</h2>" +
      (L.bio ? '<p class="muted">' + esc(L.bio) + "</p>" : "") + "</div></div>" + (dados.length ? '<ul class="dados">' + dados.join("") + "</ul>" : "") + (links ? '<div class="links">' + links + "</div>" : "") + "</section></div>";
  }
  /* marca na navegação a seção que está na tela */
  var OBS = null;
  function espiar() {
    if (OBS) OBS.disconnect();
    var abas = $("abas"); if (!abas || !("IntersectionObserver" in window)) return;
    OBS = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id.slice(2);
        Array.prototype.forEach.call(abas.children, function (b) { var on = b.dataset.id === id; b.setAttribute("aria-current", on); if (on && b.scrollIntoView) { var r = b.getBoundingClientRect(); if (r.left < 0 || r.right > innerWidth) abas.scrollLeft += r.left - 40; } });
      });
    }, { rootMargin: "-130px 0px -65% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".sec[id]"), function (s) { OBS.observe(s); });
  }
  function barra(pulo) {
    var c = carro(), falta = L.minimo > 0 && c.total < L.minimo ? r2(L.minimo - c.total) : 0;
    $("barra").innerHTML = c.itens.length ? '<div class="barra' + (pulo ? " pulo" : "") + '"><button data-a="sacola"><span class="n">' + numTxt(c.n) + '</span><span class="t">Ver sacola' + (falta ? "<small>Faltam " + money(falta) + " para o pedido mínimo</small>" : c.desc > 0 ? "<small>Você economiza " + money(c.desc) + "</small>" : "") + "</span><span>" + money(c.total) + "</span></button></div>" : "";
  }

  /* ---------- folhas ---------- */
  var ANTES = null;
  function abrir(html, rotulo, cls) {
    var ja = document.querySelector(".folha"), mesmo = ja && ja.getAttribute("aria-label") === rotulo, sc = mesmo ? ja.scrollTop : 0;
    if (!ja) ANTES = document.activeElement;
    $("folha").innerHTML = '<div class="fundo' + (ja ? " sem" : "") + '" data-a="fechar-fundo"><div class="folha ' + (cls || "") + '" role="dialog" aria-modal="true" aria-label="' + esc(rotulo) + '">' + html + '<button class="fechar" data-a="fechar" aria-label="Fechar">' + IC.x + "</button></div></div>";
    document.body.style.overflow = "hidden";
    if (mesmo) document.querySelector(".folha").scrollTop = sc;
  }
  function fechar() { $("folha").innerHTML = ""; document.body.style.overflow = ""; if (ANTES && ANTES.focus && document.contains(ANTES)) ANTES.focus({ preventScroll: true }); ANTES = null; }
  function verItem(k, q) {
    var it = item(k); if (!it) return;
    QF = q == null ? (CARRO[k] || it.passo) : q;
    var o = it.o, tem = imgOk(o.foto), d = pct(o), h = tem ? '<img class="grande" src="' + esc(o.foto) + '" alt="' + esc(it.nome) + '">' : "";
    h += "<h2>" + esc(it.nome) + "</h2>" + precoHtml(o, it.un);
    if (it.combo) {
      var econ = r2(it.de - it.preco);
      h += (econ > 0 ? '<p style="margin-top:8px"><span class="econ">Economize ' + money(econ) + "</span></p>" : "") + (o.desc ? '<p class="desc">' + esc(o.desc) + "</p>" : "") +
        '<span class="lbl">O que vem no combo</span><ul class="oque" style="margin-top:0">' + (o.itens || []).map(function (i) { return "<li><span>" + numTxt(i.q) + (i.un && i.un !== "un" ? " " + esc(i.un) : "×") + "</span>" + esc(i.nome) + "</li>"; }).join("") + "</ul>";
    } else {
      h += (d > 0 ? '<p style="margin-top:8px"><span class="econ">' + d + "% de desconto" + (o.ate ? " até " + dataBR(o.ate) : "") + "</span></p>" : "") +
        (o.pronta ? '<p><span class="pronta" style="font-size:14px;margin-top:8px">Pronta entrega</span></p>' : "") +
        (o.desc ? '<p class="desc">' + esc(o.desc) + "</p>" : "") + (o.alerg ? '<p class="alerg">Contém: ' + esc(o.alerg) + "</p>" : "");
    }
    h += '<div class="add"><div class="passo"><button data-a="f-menos" data-k="' + esc(k) + '" aria-label="Diminuir">−</button><output id="q">' + numTxt(QF) + '</output><button data-a="f-mais" data-k="' + esc(k) + '" aria-label="Aumentar">+</button></div>' +
      '<button class="btn" data-a="por" data-k="' + esc(k) + '">' + (CARRO[k] ? "Atualizar" : "Adicionar") + " · " + money(QF * it.preco) + "</button></div>" +
      (CARRO[k] ? '<button class="btn linha cheio" style="margin-top:10px" data-a="tirar" data-k="' + esc(k) + '">Tirar da sacola</button>' : "");
    abrir(h, it.nome, tem ? "temfoto" : "");
  }
  function linhasTotais(c, taxa) {
    return '<div class="tot" style="margin-top:10px"><span>Produtos</span><span>' + money(c.bruto) + "</span></div>" +
      (c.desc > 0 ? '<div class="tot menos"><span>Promoções e combos</span><span>−' + money(c.desc) + "</span></div>" : "") +
      (taxa ? '<div class="tot"><span>Taxa de entrega</span><span>' + money(taxa) + "</span></div>" : "") +
      '<div class="tot big"><span>Total</span><span>' + money(c.total + taxa) + "</span></div>";
  }
  function verSacola() {
    var c = carro(); if (!c.itens.length) { fechar(); return; }
    var falta = L.minimo > 0 && c.total < L.minimo;
    var h = "<h2>Sua sacola</h2>" + c.itens.map(function (x) {
      var it = x.it;
      return '<div class="item"><span class="mini">' + foto(it.o) + '</span><div class="nm"><b>' + esc(it.nome) + "</b><small>" + money(r2(x.q * it.preco)) + (it.combo ? " · combo" : "") + '</small></div><div class="passo"><button data-a="s-menos" data-k="' + esc(it.k) + '" aria-label="Diminuir">−</button><output>' + numTxt(x.q) + '</output><button data-a="s-mais" data-k="' + esc(it.k) + '" aria-label="Aumentar">+</button></div></div>';
    }).join("") + linhasTotais(c, 0);
    if (falta) h += '<div class="aviso">O pedido mínimo é ' + money(L.minimo) + ". Faltam " + money(L.minimo - c.total) + ".</div>";
    h += '<button class="btn cheio" data-a="dados" ' + (falta ? "disabled" : "") + ">Continuar</button>" + '<button class="btn linha cheio" style="margin-top:10px" data-a="fechar">Escolher mais produtos</button>';
    abrir(h, "Sua sacola");
  }
  function mascara(v) {
    if ((L.pais || "BR") !== "BR") return v;
    var d = digits(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  function verDados() {
    var c = carro(); if (!c.itens.length) { fechar(); return; }
    var taxa = FORM.modo === "entrega" ? L.taxa : 0, min = somaDias(L.hoje, L.antecedencia), dias = [0, 1, 2, 3, 4, 5].map(function (i) { return somaDias(min, i); });
    var fora = OUTRA || dias.indexOf(FORM.data) < 0;
    var cl = function (k) { return "campo" + (CAMPO === k ? " erro" : ""); };
    var h = '<button class="volta" data-a="sacola">' + IC.volta + "Sacola</button><h2>Entrega e seus dados</h2>";
    if (L.retirada && L.entrega) h += '<span class="lbl">Como você quer receber</span><div class="seg"><button data-a="modo" data-id="retirada" aria-pressed="' + (FORM.modo === "retirada") + '">Retirar na loja</button><button data-a="modo" data-id="entrega" aria-pressed="' + (FORM.modo === "entrega") + '">Entrega' + (L.taxa > 0 ? " · " + money(L.taxa) : "") + "</button></div>";
    if (FORM.modo === "retirada" && L.endereco) h += '<p class="nota">Retirada em ' + esc(L.endereco) + "</p>";
    if (FORM.modo === "entrega") h += '<label class="' + cl("end") + '">Endereço de entrega<input data-f="end" autocomplete="street-address" maxlength="200" value="' + esc(FORM.end) + '" placeholder="Rua, número, bairro"></label>';
    h += '<span class="lbl">Para qual dia</span><div class="dias">' + dias.map(function (d) { return '<button data-a="dia" data-id="' + d + '" aria-pressed="' + (!fora && FORM.data === d) + '"><small>' + (d === L.hoje ? "hoje" : esc(diaSem(d))) + "</small>" + dataBR(d) + "</button>"; }).join("") +
      '<button class="outra" data-a="outra" aria-pressed="' + fora + '">Outra data</button></div>';
    h += '<div class="dupla">' + (fora ? '<label class="' + cl("data") + '">Dia<input type="date" data-f="data" min="' + min + '" max="' + somaDias(L.hoje, 120) + '" value="' + esc(FORM.data) + '"></label>' : "") + '<label class="campo">Horário (opcional)<input type="time" data-f="hora" value="' + esc(FORM.hora) + '"></label></div>';
    if (L.horario) h += '<p class="nota">Atendimento: ' + esc(L.horario) + "</p>";
    h += '<label class="' + cl("nome") + '">Seu nome<input data-f="nome" autocomplete="name" maxlength="80" value="' + esc(FORM.nome) + '"></label>' +
      '<label class="' + cl("fone") + '">Seu WhatsApp<input data-f="fone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" value="' + esc(FORM.fone) + '" placeholder="(47) 99999-0000"></label>' +
      '<label class="campo">Observação (opcional)<textarea data-f="obs" rows="2" maxlength="500" placeholder="Ex.: sem granulado, mensagem no bolo">' + esc(FORM.obs) + "</textarea></label>" +
      '<label class="isca" aria-hidden="true">Site<input data-f="site" tabindex="-1" autocomplete="off" value=""></label>' + linhasTotais(c, taxa);
    if (ERRO) h += '<div class="aviso erro" role="alert">' + esc(ERRO) + "</div>";
    h += '<button class="btn cheio" data-a="enviar" ' + (ENVIANDO ? "disabled" : "") + ">" + (ENVIANDO ? "Enviando…" : "Enviar pedido · " + money(c.total + taxa)) + "</button>" +
      '<p class="nota">A loja confirma o pedido e combina o pagamento com você pelo WhatsApp. Seus dados vão só para esta loja.</p>';
    abrir(h, "Entrega e seus dados");
    if (CAMPO) { var el = document.querySelector('.folha [data-f="' + CAMPO + '"]'); if (el) el.focus(); }
  }
  function waLink(txt) { var d = digits(L.whatsapp); if (d && d.length <= 11 && (L.pais || "BR") === "BR") d = "55" + d; return "https://wa.me/" + d + "?text=" + encodeURIComponent(txt); }

  function enviar() {
    var c = carro(); if (!c.itens.length || ENVIANDO) return;
    var min = somaDias(L.hoje, L.antecedencia);
    ERRO = ""; CAMPO = "";
    if (FORM.modo === "entrega" && FORM.end.trim().length < 8) { ERRO = "Informe o endereço de entrega."; CAMPO = "end"; }
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(FORM.data) || FORM.data < min) { ERRO = "Escolha o dia a partir de " + dataBR(min) + "."; CAMPO = "data"; OUTRA = true; }
    else if (FORM.nome.trim().length < 2) { ERRO = "Informe seu nome."; CAMPO = "nome"; }
    else if (digits(FORM.fone).length < 10) { ERRO = "Informe seu WhatsApp com DDD."; CAMPO = "fone"; }
    if (ERRO) { verDados(); return; }
    ENVIANDO = true; verDados();
    rpc("loja_pedido", { p_slug: slug, p: { nome: FORM.nome.trim(), fone: FORM.fone, modo: FORM.modo, end: FORM.end.trim(), data: FORM.data, hora: FORM.hora, obs: FORM.obs.trim(), site: FORM.site,
      itens: c.itens.map(function (x) { return x.it.combo ? { combo: x.it.o.id, q: x.q } : { id: x.it.o.id, q: x.q }; }) } })
      .then(function (r) {
        ENVIANDO = false;
        if (!r || !r.ok) { ERRO = (r && typeof r.erro === "string" && r.erro) || "Não foi possível enviar. Tente de novo."; CAMPO = r && /^(nome|fone|end|data)$/.test(r.campo || "") ? r.campo : ""; if (CAMPO === "data") OUTRA = true; verDados(); return; }
        var num = parseInt(r.num, 10) || 0, hora = /^\d{2}:\d{2}$/.test(r.hora || "") ? r.hora : "";
        var quando = (r.modo === "entrega" ? "Entrega" : "Retirada") + " em " + dataBR(r.data) + (hora ? " às " + hora : "");
        var msg = "Olá! Acabei de fazer o pedido #" + num + " pela loja online:\n" + r.resumo + "\nTotal: " + money(r.total) + "\n" + quando + (r.modo === "entrega" ? "\nEndereço: " + FORM.end.trim() : "") + (FORM.obs.trim() ? "\nObs.: " + FORM.obs.trim() : "") + "\nNome: " + FORM.nome.trim();
        CARRO = {}; FORM.obs = ""; FORM.hora = ""; guardar(); desenhar();
        abrir('<div class="ok"><div class="sel">' + IC.certo + "</div><h2>Pedido #" + num + ' enviado!</h2><p class="muted">' + esc(L.nome) + " vai confirmar o pedido e combinar o pagamento com você.</p>" +
          '<div class="resumo">' + esc(r.resumo) + "\n\nTotal: " + esc(money(r.total)) + (Number(r.economia) > 0 ? "\nVocê economizou " + esc(money(r.economia)) : "") + "\n" + esc(quando) + "</div>" +
          (digits(L.whatsapp) ? '<a class="btn wa cheio" style="margin-top:0" href="' + esc(waLink(msg)) + '" target="_blank" rel="noopener">' + IC.wa + "Avisar a loja pelo WhatsApp</a>" : "") +
          '<button class="btn linha cheio" style="margin-top:10px" data-a="fechar">Voltar para a loja</button></div>', "Pedido enviado");
      })
      .catch(function () { ENVIANDO = false; ERRO = "Sem conexão. Verifique a internet e tente de novo."; verDados(); });
  }
  function compartilhar() {
    var url = location.origin + "/loja/" + slug, d = { title: L.nome, text: "Faça seu pedido na loja online de " + L.nome, url: url };
    if (navigator.share) { navigator.share(d).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { brinde("Link copiado"); }, function () { brinde(url); }); else brinde(url);
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-a]"); if (!t || !L) return;
    var a = t.dataset.a, k = t.dataset.k, id = t.dataset.id, it = k ? item(k) : null;
    if (a === "fechar-fundo" && e.target !== t) return;
    if (a === "fechar" || a === "fechar-fundo") { fechar(); return; }
    if (a === "ir") { var s = $("s-" + id); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (a === "limpar") { BUSCA = ""; var b = $("busca"); if (b) b.value = ""; $("conteudo").innerHTML = conteudo(); if ($("abas")) $("abas").hidden = false; if ($("fimloja")) $("fimloja").hidden = false; espiar(); return; }
    if (a === "compartilhar") { compartilhar(); return; }
    if (a === "ver" && it) { verItem(k); return; }
    if (a === "add" && it) { var novo = !CARRO[k]; mudar(k, 1); if (novo) brinde("Adicionado à sacola"); return; }
    if (a === "sub" && it) { mudar(k, -1); return; }
    if ((a === "f-mais" || a === "f-menos") && it) { verItem(k, Math.min(it.combo ? 50 : 999, Math.max(it.passo, r2(QF + (a === "f-mais" ? it.passo : -it.passo))))); return; }
    if (a === "por" && it) { CARRO[k] = QF; guardar(); fechar(); mudar(k, 0); barra(true); return; }
    if (a === "tirar" && it) { delete CARRO[k]; guardar(); fechar(); mudar(k, 0); return; }
    if (a === "sacola") { ERRO = ""; CAMPO = ""; verSacola(); return; }
    if ((a === "s-mais" || a === "s-menos") && it) { mudar(k, a === "s-mais" ? 1 : -1); verSacola(); return; }
    if (a === "dados") { ERRO = ""; CAMPO = ""; verDados(); return; }
    if (a === "modo") { FORM.modo = id === "entrega" && L.entrega ? "entrega" : L.retirada ? "retirada" : "entrega"; ERRO = ""; verDados(); return; }
    if (a === "dia") { if (/^\d{4}-\d{2}-\d{2}$/.test(id || "")) { FORM.data = id; OUTRA = false; verDados(); } return; }
    if (a === "outra") { OUTRA = true; verDados(); return; }
    if (a === "enviar") { enviar(); return; }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "busca") { BUSCA = t.value.slice(0, 60); $("conteudo").innerHTML = conteudo(); if ($("abas")) $("abas").hidden = !!BUSCA.trim(); if ($("fimloja")) $("fimloja").hidden = !!BUSCA.trim(); if (!BUSCA.trim()) espiar(); return; }
    var f = t.dataset && t.dataset.f; if (!f || !(f in FORM)) return;
    if (f === "fone") { var v = mascara(t.value); if (v !== t.value) t.value = v; }
    FORM[f] = t.value;
    if (f === "nome" || f === "fone" || f === "end") guardar();
    if (f === CAMPO) { CAMPO = ""; var c = t.closest(".campo"); if (c) c.classList.remove("erro"); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("folha").innerHTML) fechar(); });
  carregar();
})();
