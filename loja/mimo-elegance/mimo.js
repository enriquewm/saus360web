/* Mimo Elegance · loja online (saus360.com.br/loja/mimo-elegance)
   Mesma conversa com o servidor do Saus360 que a loja padrão: o catálogo vem de loja_publica e o pedido vai por loja_pedido.
   Preços, promoções e combos são sempre conferidos no servidor: o que sai daqui é só "qual produto" e "quantos".
   Todo texto que vem do servidor ou do cliente passa por esc() antes de entrar na página. */
(function () {
  "use strict";
  var CFG = window.DECANTA_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"'`]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c]; }); };
  var digits = function (s) { return String(s || "").replace(/\D/g, ""); };
  var tem = function (o, k) { return typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k); };
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var m = location.pathname.match(/^\/loja\/([a-z0-9-]{3,40})(?:\/|$)/i);
  var slug = (m ? m[1] : (new URLSearchParams(location.search).get("l") || "mimo-elegance")).toLowerCase();
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) slug = "";

  /* CARRO: embalagens e combos (chave → quantidade). PECAS: canecas, uma linha para cada jeito de personalizar (frase, foto da frente, foto do verso, recado). */
  var L = null, NOME = "", PRODS = [], COMBOS = [], CARRO = {}, PECAS = [], BUSCA = "", ENVIANDO = false, ERRO = "", CAMPO = "", OUTRA = false, QF = 1, ED = null;
  var FORM = { nome: "", fone: "", modo: "", end: "", data: "", hora: "", obs: "", site: "" };
  var HERO = { v: "me_cn_branca", t: "", quente: false, foto: null, verso: null, n: 0 };
  var MAXFRASE = 36, MAXREC = 120;
  var ORDEM_HERO = ["me_cn_branca", "me_cn_cor_rosa", "me_cn_cor_azul", "me_cn_coracao", "me_cn_magica"];
  var SELOS = { novo: "Novidade", top: "Mais pedido", limitado: "Edição limitada" };
  var MOEDA = { BR: ["pt-BR", "BRL"], MX: ["es-MX", "MXN"], US: ["en-US", "USD"] };
  var money = function (n) { var c = L && tem(MOEDA, L.pais) ? MOEDA[L.pais] : MOEDA.BR; return Number(n || 0).toLocaleString(c[0], { style: "currency", currency: c[1] }); };
  var numTxt = function (n) { return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 }); };
  var dataBR = function (s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return ""; var p = s.split("-"); return p[2] + "/" + p[1]; };
  var somaDias = function (iso, n) { var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  var diaSem = function (iso, longo) { return new Date(iso + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: longo ? "long" : "short", timeZone: "UTC" }).replace(".", ""); };
  var bonito = function (s) { return String(s || "").trim().replace(/\S+/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }); };
  /* imagem só do armazenamento do Saus360 (o servidor já confere; aqui é a segunda trava) */
  var imgOk = function (u) { return typeof u === "string" && !!CFG.supabaseUrl && u.indexOf(CFG.supabaseUrl + "/storage/v1/object/public/produtos/") === 0 && !/["'<>\s\\]/.test(u); };
  /* fotos dos clientes: caminho "<loja>/<32 hex>.jpg" no armazenamento do Saus360 */
  var caminhoOk = function (p) { return typeof p === "string" && p.indexOf(slug + "/") === 0 && /^[0-9a-f]{32}\.jpg$/.test(p.slice(slug.length + 1)); };
  var thOk = function (t) { return typeof t === "string" && t.length < 60000 && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(t); };
  var fotoSrc = function (f) { return f ? (f.pv || (caminhoOk(f.path) ? CFG.supabaseUrl + "/storage/v1/object/public/pedidos-fotos/" + f.path : "")) : ""; };
  var nid = function () { return Math.random().toString(36).slice(2, 10); };

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
    sacola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.200 11.200a1.800 1.800 0 01-1.800 1.600H8a1.800 1.800 0 01-1.800-1.600L5 8z"/><path d="M9 10V7a3 3 0 016 0v3"/></svg>',
    certo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    /* marca da loja: uma caneca branca no círculo cobalto */
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.500h3l1.500-2.500h7L17 8.500h3V19H4z"/><circle cx="12" cy="13.500" r="3.500"/></svg>',
    lapis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 013 3L8 19l-4 1z"/><path d="M14 7l3 3"/></svg>',
    giro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/></svg>',
    caneca: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h10v7a4 4 0 01-4 4H9a4 4 0 01-4-4V8z"/><path d="M15 10h1.500a2.500 2.500 0 010 5H15"/><path d="M8 4.500c0 .800.800.800.800 1.600M11 4.500c0 .800.800.800.800 1.600"/></svg>'
  };

  /* ---------- ilustrações: canecas e caixas desenhadas, para quando o produto ainda não tem foto ---------- */
  var UID = 0, TINTA = "#14183A", COB = "#2640D8", ROSA = "#F7B9C6";
  var SPEC = {
    me_cn_branca: { corpo: "#FFFFFF", alca: "#FFFFFF", dentro: "#EEF0F8", dentro2: "#DCE0EF" },
    me_cn_cor_rosa: { corpo: "#FFFFFF", alca: "#F28CA3", aro: "#F28CA3", dentro: "#F28CA3", dentro2: "#E0728C" },
    me_cn_cor_azul: { corpo: "#FFFFFF", alca: "#4F6BF0", aro: "#4F6BF0", dentro: "#4F6BF0", dentro2: "#3A52D0" },
    me_cn_coracao: { corpo: "#FFFFFF", alca: "#E2526F", coracao: true, dentro: "#EEF0F8", dentro2: "#DCE0EF" },
    me_cn_magica: { corpo: "#1D1D26", alca: "#1D1D26", linha: "#1D1D26", dentro: "#3A3A48", dentro2: "#101016", texto: "#FFE7B3", magica: true },
    me_cn_agata: { corpo: "#FFFFFF", alca: "#1F3A93", aro: "#1F3A93", esmalte: true, dentro: "#EEF0F8", dentro2: "#DCE0EF", f: 1.04 },
    me_cn_lata: { corpo: "#FFFFFF", alca: "#FFFFFF", lata: true, bw: 80, f: 1.14, dentro: "#EEF0F8", dentro2: "#DCE0EF" },
    me_cn_infantil: { corpo: "#BCCBFF", alca: COB, aro: COB, bw: 80, f: 0.82, dentro: "#E6EBFF", dentro2: "#C7D3FF", texto: TINTA },
    me_cx_kraft: { caixa: "kraft" },
    me_cx_presente: { caixa: "laco" }
  };
  function specDe(p) {
    if (p && tem(SPEC, p.id)) return SPEC[p.id];
    var n = norm((p && p.nome) || "");
    if (p && p.itens) return { caixa: "laco" };
    if (/kraft|sacola|embalagem/.test(n)) return SPEC.me_cx_kraft;
    if (/caixa|presente/.test(n) || (p && p.cat === "embalagens")) return SPEC.me_cx_presente;
    if (/magica/.test(n)) return SPEC.me_cn_magica;
    if (/rosa/.test(n)) return SPEC.me_cn_cor_rosa;
    if (/azul/.test(n)) return SPEC.me_cn_cor_azul;
    if (/coracao/.test(n)) return SPEC.me_cn_coracao;
    if (/agata|esmalt/.test(n)) return SPEC.me_cn_agata;
    if (/lata/.test(n)) return SPEC.me_cn_lata;
    if (/infantil|polimero/.test(n)) return SPEC.me_cn_infantil;
    return SPEC.me_cn_branca;
  }
  /* a altura da caneca acompanha os mililitros do nome */
  function fDe(p, s) {
    if (s.f) return s.f;
    var ml = (String((p && p.nome) || "").match(/(\d{2,4})\s*ml/i) || [])[1];
    if (!ml) return 1;
    return 0.82 + (Math.min(Math.max(+ml, 250), 400) - 250) / 150 * 0.30 + 0.03;
  }
  function quebrar(t, max) {
    var w = String(t).trim().split(/\s+/).filter(Boolean), lin = [], cur = "";
    w.forEach(function (p) {
      while (p.length > max) { if (cur) { lin.push(cur); cur = ""; } lin.push(p.slice(0, max)); p = p.slice(max); }
      if (!cur) cur = p; else if ((cur + " " + p).length <= max) cur += " " + p; else { lin.push(cur); cur = p; }
    });
    if (cur) lin.push(cur);
    return lin.slice(0, 4);
  }
  function mugSvg(s, o) {
    o = o || {};
    var id = "mg" + (++UID), f = o.f || 1, bw = s.bw || 88, bh = Math.round(112 * f), cx = 90, x0 = cx - bw / 2, x1 = cx + bw / 2, yb = 176, yt = yb - bh, ry = 9;
    var ln = s.linha || "#CBD1E6", brilho = s.magica ? 0.16 : 0.55;
    /* foto do cliente: só imagem gerada aqui (data:) ou do armazenamento do Saus360 */
    var ft = typeof o.foto === "string" && (/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(o.foto) || (!!CFG.supabaseUrl && o.foto.indexOf(CFG.supabaseUrl + "/storage/v1/object/public/pedidos-fotos/") === 0 && !/["'<>\s\\]/.test(o.foto))) ? o.foto : "";
    var px = x0 + 5, py = yt + 8, pw = bw - 10, ph = bh - 8 - 12;
    var h = '<svg viewBox="' + (o.vb || "0 0 200 200") + '" xmlns="http://www.w3.org/2000/svg"' + (o.rotulo ? ' role="img" aria-label="' + esc(o.rotulo) + '"' : ' aria-hidden="true" focusable="false"') + ">";
    h += '<defs><linearGradient id="' + id + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#14183A" stop-opacity=".10"/><stop offset=".2" stop-color="#fff" stop-opacity="' + brilho + '"/><stop offset=".44" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#14183A" stop-opacity="0"/><stop offset="1" stop-color="#14183A" stop-opacity=".16"/></linearGradient>' +
      (ft ? '<clipPath id="' + id + 'c"><rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="5"/></clipPath>' : "") + "</defs>";
    h += '<ellipse cx="96" cy="178" rx="' + (bw / 2 + 18) + '" ry="6" fill="#14183A" opacity=".14"/>';
    /* alça (atrás do corpo) */
    if (s.coracao) {
      var hx = x1 + 18, hy = yt + bh * 0.46;
      var heart = "M" + hx + " " + (hy + 20) + " C " + (hx - 34) + " " + (hy - 2) + " " + (hx - 16) + " " + (hy - 30) + " " + hx + " " + (hy - 14) + " C " + (hx + 16) + " " + (hy - 30) + " " + (hx + 34) + " " + (hy - 2) + " " + hx + " " + (hy + 20) + "Z";
      h += '<path d="' + heart + '" fill="none" stroke="' + ln + '" stroke-width="13" stroke-linejoin="round"/><path d="' + heart + '" fill="none" stroke="' + s.alca + '" stroke-width="9" stroke-linejoin="round"/>';
    } else {
      var y1 = yt + bh * 0.2, y2 = yt + bh * 0.72, hx2 = x1 + 38;
      var al = "M" + (x1 - 6) + " " + y1 + " C " + hx2 + " " + (y1 - 8) + " " + hx2 + " " + (y2 + 8) + " " + (x1 - 6) + " " + y2;
      h += '<path d="' + al + '" fill="none" stroke="' + ln + '" stroke-width="15" stroke-linecap="round"/><path d="' + al + '" fill="none" stroke="' + s.alca + '" stroke-width="11" stroke-linecap="round"/>';
    }
    /* corpo */
    var corpo = "M" + x0 + " " + yt + " L" + x0 + " " + (yb - 12) + " Q" + x0 + " " + yb + " " + (x0 + 12) + " " + yb + " L" + (x1 - 12) + " " + yb + " Q" + x1 + " " + yb + " " + x1 + " " + (yb - 12) + " L" + x1 + " " + yt + "Z";
    h += '<path d="' + corpo + '" fill="' + s.corpo + '" stroke="' + ln + '" stroke-width="1.5"/>';
    if (s.lata) h += '<path d="M' + x0 + " " + (yt + 16) + " Q" + cx + " " + (yt + 24) + " " + x1 + " " + (yt + 16) + " M" + x0 + " " + (yb - 16) + " Q" + cx + " " + (yb - 8) + " " + x1 + " " + (yb - 16) + '" fill="none" stroke="' + ln + '" stroke-width="2"/>';
    if (s.esmalte) {
      h += '<path d="M' + x0 + " " + (yt + 12) + " Q" + cx + " " + (yt + 20) + " " + x1 + " " + (yt + 12) + '" fill="none" stroke="' + s.aro + '" stroke-width="2.5"/>';
      [[16, 38], [64, 30], [30, 66], [72, 78], [20, 96], [52, 92]].forEach(function (d) { h += '<circle cx="' + (x0 + d[0]) + '" cy="' + (yt + d[1]) + '" r="1.7" fill="#C5CEEC"/>'; });
    }
    /* foto impressa: preenche a área de impressão (a caneca mágica só mostra com a bebida quente) */
    if (ft) h += '<g class="' + (s.magica ? "tx-m" : "ft") + '"><g clip-path="url(#' + id + 'c)"><image href="' + esc(ft) + '" x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" preserveAspectRatio="xMidYMid slice"/></g></g>';
    h += '<path d="' + corpo + '" fill="url(#' + id + ')"/>';
    /* texto impresso */
    var t = String(o.txt || "").trim(), fantasma = false;
    if (!t && o.fantasma && !ft) { t = "Sua frase aqui"; fantasma = true; }
    if (t) {
      var lin = quebrar(t, 11), mx = lin.reduce(function (a, b) { return Math.max(a, b.length); }, 1);
      var fs = Math.min(21, (bw - 24) / (mx * 0.58), (bh * 0.56) / (lin.length * 1.2)), lh = fs * 1.2, y0 = yt + bh * 0.54 - (lin.length - 1) * lh / 2 + fs * 0.32;
      h += '<g class="' + (s.magica ? "tx-m" : "tx") + '" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="' + fs.toFixed(1) + '" fill="' + (s.texto || COB) + '" text-anchor="middle"' + (fantasma ? ' opacity=".34"' : "") + (ft ? ' stroke="' + (s.magica ? "#1D1D26" : "#fff") + '" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round"' : "") + ">";
      lin.forEach(function (l, i) { h += '<text x="' + cx + '" y="' + (y0 + i * lh).toFixed(1) + '">' + esc(l) + "</text>"; });
      h += "</g>";
    }
    /* abertura */
    h += '<ellipse cx="' + cx + '" cy="' + yt + '" rx="' + bw / 2 + '" ry="' + ry + '" fill="' + s.dentro + '" stroke="' + (s.aro || ln) + '" stroke-width="' + (s.aro ? 3 : 1.5) + '"/>';
    h += '<ellipse cx="' + cx + '" cy="' + (yt + 1.5) + '" rx="' + (bw / 2 - 6) + '" ry="' + (ry - 3.5) + '" fill="' + s.dentro2 + '"/>';
    if (s.magica && o.grande) {
      var fio = function (x, y) { return '<path d="M' + x + " " + y + ' q-8 -11 0 -21 q8 -10 0 -20"/>'; };
      h += '<g class="vapor" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round">' + fio(cx - 16, yt - 10) + fio(cx, yt - 14) + fio(cx + 16, yt - 10) + "</g>";
    }
    return h + "</svg>";
  }
  function caixaSvg(tipo, vb) {
    var h = '<svg viewBox="' + (vb || "0 0 200 200") + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g transform="translate(17 0)"><ellipse cx="96" cy="178" rx="64" ry="6" fill="#14183A" opacity=".14"/>';
    if (tipo === "kraft") {
      h += '<rect x="46" y="100" width="88" height="76" rx="3" fill="#D1AA78" stroke="#B08655" stroke-width="1.5"/><rect x="42" y="86" width="96" height="18" rx="3" fill="#DFC397" stroke="#B08655" stroke-width="1.5"/>' +
        '<rect x="62" y="114" width="56" height="50" rx="9" fill="#F6F7FB" stroke="#B08655" stroke-width="1.5"/>' +
        '<rect x="73" y="130" width="26" height="30" rx="4" fill="#fff" stroke="#CBD1E6" stroke-width="1.5"/><ellipse cx="86" cy="130" rx="13" ry="3.500" fill="#EEF0F8" stroke="#CBD1E6" stroke-width="1.2"/>' +
        '<path d="M99 136 q9 0 9 8 q0 8 -9 8" fill="none" stroke="#CBD1E6" stroke-width="4.500" stroke-linecap="round"/>';
    } else {
      h += '<rect x="40" y="118" width="100" height="58" rx="3" fill="#FAD3DB" stroke="#E597AA" stroke-width="1.5"/><rect x="34" y="96" width="112" height="24" rx="4" fill="#F7B9C6" stroke="#E597AA" stroke-width="1.5"/>' +
        '<rect x="84" y="96" width="12" height="80" fill="#2640D8"/>' +
        '<path d="M90 96 C 66 64, 46 84, 62 96 C 70 102, 82 100, 90 96Z" fill="#2640D8"/><path d="M90 96 C 114 64, 134 84, 118 96 C 110 102, 98 100, 90 96Z" fill="#2640D8"/><circle cx="90" cy="95" r="7" fill="#1A2FA6"/>';
    }
    return h + "</g></svg>";
  }
  function ilustra(p, o) {
    var s = specDe(p);
    if (s.caixa) return caixaSvg(s.caixa, o && o.vb);
    o = o || {}; o.f = fDe(p, s);
    return mugSvg(s, o);
  }
  var ehCaneca = function (o) { return !!o && !o.itens && !specDe(o).caixa; };
  var MINI = "21 24 172 172";
  var visual = function (o) { return imgOk(o.foto) ? '<img src="' + esc(o.foto) + '" alt="" loading="lazy" decoding="async">' : ilustra(o, { vb: MINI }); };

  /* ---------- caneca em 3D: o cliente gira com o dedo para ver a frente e o verso ----------
     Desenho em canvas, sem bibliotecas (a página só roda código do próprio site): a estampa (frente, verso e frase)
     vira uma faixa que envolve o corpo, e cada coluna de pixels do corpo mostra o pedaço da faixa que está de frente.
     A frente fica no meio da faixa, o verso nas pontas e a alça entre os dois, como na sublimação de verdade. */
  var TEM3D = (function () { try { var c = document.createElement("canvas"); return !!(c.getContext && c.getContext("2d") && window.requestAnimationFrame); } catch (e) { return false; } })();
  var CALMO = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var IMGS = Object.create(null), VIEWS = [], DICA = false, RY = 9;
  function imagem(src) {
    if (!src) return null;
    var im = IMGS[src];
    if (!im) {
      im = IMGS[src] = new Image();
      im.onload = function () { im.pronta = true; VIEWS.forEach(function (v) { v.sujo(); }); };
      im.src = src;
    }
    return im.pronta && im.naturalWidth ? im : null;
  }
  function retArred(t, x, y, w, h, r) { t.beginPath(); t.moveTo(x + r, y); t.arcTo(x + w, y, x + w, y + h, r); t.arcTo(x + w, y + h, x, y + h, r); t.arcTo(x, y + h, x, y, r); t.arcTo(x, y, x + w, y, r); t.closePath(); }
  /* a foto preenche a área de impressão sem distorcer (corta o que sobra, como na prévia de antes) */
  function cobrir(t, im, x, y, w, h, r) {
    var iw = im.naturalWidth, ih = im.naturalHeight, k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
    t.save(); retArred(t, x, y, w, h, r); t.clip(); t.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h); t.restore();
  }
  var difAng = function (a, b) { var d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };

  function Caneca3D(box) {
    var cv = document.createElement("canvas"), g = cv.getContext("2d"), tex = document.createElement("canvas");
    cv.className = "c3d"; cv.tabIndex = 0; cv.setAttribute("role", "img");
    box.innerHTML = ""; box.appendChild(cv);
    var est = null, chave = "", sujoTex = true, rot = 0, alvo = null, vel = 0, raf = 0, arr = null, k = 1, ox = 0, oy = 0;
    function montar() {
      var s = est.s, bh = Math.round(112 * (est.f || 1)), R = (s.bw || 88) / 2, hc = bh - RY;
      var W = 1200, U = W / (2 * Math.PI * R), H = Math.max(40, Math.round(hc * U)), ln = s.linha || "#CBD1E6";
      tex.width = W; tex.height = H;
      var t = tex.getContext("2d");
      t.fillStyle = s.corpo; t.fillRect(0, 0, W, H);
      if (s.esmalte) {
        var acaso = function (i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }; /* pintinhas do esmalte, sempre nos mesmos lugares */
        t.fillStyle = "#C5CEEC";
        for (var i = 0; i < 90; i++) { t.beginPath(); t.arc(acaso(i) * W, (16 + acaso(i + 500) * (hc - 24)) * U, (1.1 + acaso(i + 900) * 0.9) * U, 0, 2 * Math.PI); t.fill(); }
        t.fillStyle = s.aro; t.fillRect(0, 11 * U, W, 2.5 * U);
      }
      if (s.lata) { t.fillStyle = ln; t.fillRect(0, 15 * U, W, 2 * U); t.fillRect(0, (hc - 9) * U, W, 2 * U); }
      if (s.magica && !est.quente) return; /* a caneca mágica só mostra a estampa com bebida quente */
      var pw = 0.31 * W, py = 8 * U, ph = (bh - 20) * U, r = 5 * U, fr = imagem(est.frente), vs = imagem(est.verso);
      if (fr) cobrir(t, fr, W / 2 - pw / 2, py, pw, ph, r);
      if (vs) { cobrir(t, vs, -pw / 2, py, pw, ph, r); cobrir(t, vs, W - pw / 2, py, pw, ph, r); }
      var txt = String(est.txt || "").trim(), fant = false;
      if (!txt && est.fantasma && !fr && !vs) { txt = "Sua frase aqui"; fant = true; }
      if (!txt) return;
      var bw = s.bw || 88, lin = quebrar(txt, 11), mx = lin.reduce(function (a, b) { return Math.max(a, b.length); }, 1);
      var fs = Math.min(21, (bw - 24) / (mx * 0.58), (bh * 0.56) / (lin.length * 1.2)), lh = fs * 1.2, y0 = bh * 0.54 - (lin.length - 1) * lh / 2 + fs * 0.32;
      t.font = "600 " + (fs * U).toFixed(1) + "px Fraunces, Georgia, serif"; t.textAlign = "center"; t.textBaseline = "alphabetic";
      t.globalAlpha = fant ? 0.34 : 1; t.lineJoin = "round";
      lin.forEach(function (l, i) {
        var y = (y0 + i * lh) * U;
        if (fr) { t.lineWidth = 3.4 * U; t.strokeStyle = s.magica ? "#1D1D26" : "#fff"; t.strokeText(l, W / 2, y); }
        t.fillStyle = s.texto || COB; t.fillText(l, W / 2, y);
      });
      t.globalAlpha = 1;
    }
    /* alça: sai do corpo no ângulo de 90° da faixa; de lado aparece inteira, de frente vira uma faixa estreita */
    function alca(s, cx, R, yt, bh, sa, ca, ln) {
      var dy = RY * ca;
      g.lineCap = "round"; g.lineJoin = "round";
      if (s.coracao) {
        var hx = cx + (R + 18) * sa, hy = yt + bh * 0.46 + dy, X = function (d) { return hx + d * sa; };
        g.beginPath(); g.moveTo(X(0), hy + 20);
        g.bezierCurveTo(X(-34), hy - 2, X(-16), hy - 30, X(0), hy - 14); g.bezierCurveTo(X(16), hy - 30, X(34), hy - 2, X(0), hy + 20); g.closePath();
        g.strokeStyle = ln; g.lineWidth = 13; g.stroke(); g.strokeStyle = s.alca; g.lineWidth = 9; g.stroke();
        return;
      }
      var y1 = yt + bh * 0.2 + dy, y2 = yt + bh * 0.72 + dy, xi = cx + (R - 6) * sa, xo = cx + (R + 38) * sa;
      g.beginPath(); g.moveTo(xi, y1); g.bezierCurveTo(xo, y1 - 8, xo, y2 + 8, xi, y2);
      g.strokeStyle = ln; g.lineWidth = 15; g.stroke(); g.strokeStyle = s.alca; g.lineWidth = 11; g.stroke();
    }
    function desenha() {
      if (!est) return;
      var w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
      var d = Math.min(window.devicePixelRatio || 1, 2.5), W = Math.round(w * d), H = Math.round(h * d);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      if (sujoTex) { montar(); sujoTex = false; }
      var s = est.s, bh = Math.round(112 * (est.f || 1)), bw = s.bw || 88, R = bw / 2, cx = 100, yb = 176, yt = yb - bh, hc = bh - RY, ln = s.linha || "#CBD1E6";
      k = Math.min(W, H) / 200; ox = (W - 200 * k) / 2; oy = H - 200 * k;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.setTransform(k, 0, 0, k, ox, oy);
      g.fillStyle = "rgba(20,24,58,.14)"; g.beginPath(); g.ellipse(cx + 4, 178, R + 18, 6, 0, 0, 2 * Math.PI); g.fill();
      var ah = Math.PI / 2 - rot, sa = Math.sin(ah), ca = Math.cos(ah);
      if (ca < 0) alca(s, cx, R, yt, bh, sa, ca, ln);
      /* corpo: uma coluna de pixels por vez, cada uma com o pedaço da faixa que está de frente */
      g.setTransform(1, 0, 0, 1, 0, 0);
      var X0 = Math.floor(ox + (cx - R) * k), X1 = Math.ceil(ox + (cx + R) * k), TW = tex.width, TH = tex.height, dois = 2 * Math.PI;
      for (var X = X0; X < X1; X++) {
        var nx = ((X + 0.5 - ox) / k - cx) / R; if (nx <= -1 || nx >= 1) continue;
        var ph = Math.asin(nx), u = ((ph + rot + Math.PI) / dois) % 1; if (u < 0) u += 1;
        var du = Math.max(1, (Math.asin(Math.min(0.99999, nx + 1 / (R * k))) - ph) / dois * TW), sx = u * TW;
        if (sx + du > TW) sx = TW - du;
        g.drawImage(tex, sx, 0, du, TH, X, oy + (yt + RY * Math.cos(ph)) * k, 1, hc * k);
      }
      g.setTransform(k, 0, 0, k, ox, oy);
      var lado = function () { g.beginPath(); g.ellipse(cx, yt, R, RY, 0, Math.PI, 0, true); g.lineTo(cx + R, yb - RY); g.ellipse(cx, yb - RY, R, RY, 0, 0, Math.PI, false); g.closePath(); };
      var br = s.magica ? 0.14 : 0.5, gr = g.createLinearGradient(cx - R, 0, cx + R, 0);
      gr.addColorStop(0, "rgba(20,24,58,.28)"); gr.addColorStop(0.1, "rgba(20,24,58,.06)"); gr.addColorStop(0.24, "rgba(255,255,255," + br + ")");
      gr.addColorStop(0.42, "rgba(255,255,255,0)"); gr.addColorStop(0.72, "rgba(20,24,58,0)"); gr.addColorStop(0.93, "rgba(20,24,58,.13)"); gr.addColorStop(1, "rgba(20,24,58,.32)");
      lado(); g.fillStyle = gr; g.fill(); g.strokeStyle = ln; g.lineWidth = 1.5; g.stroke();
      /* boca da caneca */
      g.beginPath(); g.ellipse(cx, yt, R, RY, 0, 0, 2 * Math.PI); g.fillStyle = s.dentro; g.fill(); g.strokeStyle = s.aro || ln; g.lineWidth = s.aro ? 3 : 1.5; g.stroke();
      g.beginPath(); g.ellipse(cx, yt + 1.5, R - 6, RY - 3.5, 0, 0, 2 * Math.PI); g.fillStyle = s.dentro2; g.fill();
      if (s.magica && est.quente) {
        g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 3.4; g.lineCap = "round";
        [[-16, 10], [0, 14], [16, 10]].forEach(function (p) { var x = cx + p[0], y = yt - p[1]; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 8, y - 11, x, y - 21); g.quadraticCurveTo(x + 8, y - 31, x, y - 41); g.stroke(); });
      }
      if (ca >= 0) alca(s, cx, R, yt, bh, sa, ca, ln);
    }
    function quadro() {
      raf = 0;
      if (!arr && alvo !== null) { var dd = alvo - rot; if (Math.abs(dd) < 0.003 || CALMO) { rot = alvo; alvo = null; } else rot += dd * 0.14; }
      else if (!arr && Math.abs(vel) > 0.0008) { rot += vel; vel *= 0.93; }
      desenha();
      if (!arr && (alvo !== null || Math.abs(vel) > 0.0008)) pinta();
    }
    function pinta() { if (!raf) raf = requestAnimationFrame(quadro); }
    var Rcss = function () { var s = est ? est.s : null; return Math.max(20, ((s && s.bw) || 88) / 2 * k / Math.min(window.devicePixelRatio || 1, 2.5)); };
    cv.addEventListener("pointerdown", function (e) { if (e.button > 0) return; arr = { x: e.clientX, t: performance.now() }; vel = 0; alvo = null; try { cv.setPointerCapture(e.pointerId); } catch (x) {} cv.classList.add("pega"); });
    cv.addEventListener("pointermove", function (e) {
      if (!arr) return;
      var agora = performance.now(), dr = -(e.clientX - arr.x) / Rcss();
      rot += dr; vel = dr * Math.min(1, 16 / Math.max(1, agora - arr.t)); arr.x = e.clientX; arr.t = agora;
      v.mexeu = true; pinta();
    });
    var solta = function () { if (!arr) return; arr = null; cv.classList.remove("pega"); if (CALMO) vel = 0; pinta(); };
    cv.addEventListener("pointerup", solta); cv.addEventListener("pointercancel", solta); cv.addEventListener("lostpointercapture", solta);
    cv.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); v.mexeu = true; vel = 0; alvo = (alvo === null ? rot : alvo) + (e.key === "ArrowRight" ? -1 : 1) * Math.PI / 8; pinta();
    });
    if (window.ResizeObserver) new ResizeObserver(function () { pinta(); }).observe(box);
    var v = {
      box: box, mexeu: false,
      set: function (o) {
        var c = [o.id, o.f, o.txt, o.frente, o.verso, !!o.quente, !!o.fantasma].join("\u0001");
        est = o; if (c !== chave) { chave = c; sujoTex = true; }
        cv.setAttribute("aria-label", (o.rotulo || "Prévia da caneca") + ". Arraste para os lados ou use as setas para girar.");
        pinta();
      },
      /* gira até a frente (0) ou o verso (π) pelo caminho mais curto */
      para: function (a) { vel = 0; alvo = rot + difAng(a, rot); pinta(); },
      dica: function () { if (DICA || CALMO || v.mexeu) return; DICA = true; setTimeout(function () { if (!v.mexeu && box.isConnected) { alvo = -0.7; pinta(); setTimeout(function () { if (!v.mexeu) { alvo = 0; pinta(); } }, 900); } }, 700); },
      sujo: function () { sujoTex = true; pinta(); }
    };
    VIEWS = VIEWS.filter(function (x) { return x.box.isConnected; }); VIEWS.push(v);
    return v;
  }
  /* liga (ou atualiza) a caneca 3D dentro de box; sem canvas, fica a ilustração de antes */
  function caneca3D(box, o) {
    if (!box || !TEM3D) return null;
    var v = box._v; if (!v || !box.querySelector("canvas.c3d")) v = box._v = Caneca3D(box);
    v.set(o); return v;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { VIEWS.forEach(function (v) { v.sujo(); }); });
  window.addEventListener("resize", function () { VIEWS.forEach(function (v) { v.sujo(); }); });
  /* controles embaixo da caneca: lembrar que dá para girar e ir direto à frente ou ao verso */
  var giroHtml = function (qual) { return TEM3D ? '<div class="giro"><span class="dica3d">' + IC.giro + 'Arraste para girar</span><span class="lados" role="group" aria-label="Ver a caneca"><button type="button" data-a="lado" data-id="f" data-v="' + qual + '">Frente</button><button type="button" data-a="lado" data-id="v" data-v="' + qual + '">Verso</button></span></div>' : ""; };
  var viewDe = function (qual) { var b = $(qual === "h" ? "h-svg" : "gv"); return b && b._v ? b._v : null; };
  function girarPara(alvoFoto) { var v = viewDe(alvoFoto.indexOf("hero") === 0 ? "h" : "e"); if (v) v.para(/-v$/.test(alvoFoto) ? Math.PI : 0); }

  /* ---------- sacola ---------- */
  var CHAVE = "saus360-loja-" + slug;
  /* da foto só o caminho (já enviada) e uma miniatura vão para o aparelho; a prévia grande fica na memória */
  function guardar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ c: CARRO, f: { nome: FORM.nome, fone: FORM.fone, end: FORM.end },
        pc: PECAS.map(function (x) { var ok = x.foto && x.foto.st === "ok", okv = x.verso && x.verso.st === "ok"; return { i: x.i, id: x.id, q: x.q, f: x.f, r: x.r, fp: ok ? x.foto.path : "", th: ok ? x.foto.th : "", vp: okv ? x.verso.path : "", vth: okv ? x.verso.th : "" }; }) }));
    } catch (e) {}
  }
  function recuperar() {
    try {
      var g = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (!g || typeof g !== "object") return;
      var c = g.c && typeof g.c === "object" ? g.c : {};
      Object.keys(c).forEach(function (k) { var q = Number(c[k]); if (isFinite(q) && q > 0 && q <= 999) CARRO[k] = q; });
      /* sacolas guardadas antes: as canecas ficavam em c, com a frase em p */
      var p = g.p && typeof g.p === "object" ? g.p : {};
      Object.keys(CARRO).forEach(function (k) { var pr = PRODS.find(function (x) { return x.id === k; }); if (pr && ehCaneca(pr)) { PECAS.push({ i: nid(), id: k, q: Math.round(CARRO[k]) || 1, f: typeof p[k] === "string" ? p[k].trim().slice(0, MAXFRASE) : "", r: "", foto: null, verso: null }); delete CARRO[k]; } });
      (Array.isArray(g.pc) ? g.pc : []).slice(0, 40).forEach(function (x) {
        if (!x || typeof x !== "object" || typeof x.id !== "string") return;
        var q = Math.round(Number(x.q)); if (!(q >= 1 && q <= 999)) return;
        var pr = PRODS.find(function (y) { return y.id === x.id; }); if (!pr || !ehCaneca(pr)) return;
        var foto = caminhoOk(x.fp) && thOk(x.th) ? { path: x.fp, th: x.th, pv: "", st: "ok", blob: null, msg: "" } : null;
        var verso = caminhoOk(x.vp) && thOk(x.vth) ? { path: x.vp, th: x.vth, pv: "", st: "ok", blob: null, msg: "" } : null;
        PECAS.push({ i: typeof x.i === "string" ? x.i.slice(0, 12) : nid(), id: x.id, q: q, f: typeof x.f === "string" ? x.f.slice(0, MAXFRASE) : "", r: typeof x.r === "string" ? x.r.slice(0, MAXREC) : "", foto: foto, verso: verso });
      });
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
    var itens = [], bruto = 0, desc = 0, n = 0, soma = Object.create(null), ordem = [];
    Object.keys(CARRO).forEach(function (k) { var it = item(k), q = CARRO[k]; if (it && q > 0) itens.push({ it: it, q: q }); });
    /* as canecas entram no pedido somadas por modelo; a personalização de cada linha vai à parte, em "pers" */
    PECAS.forEach(function (x) { if (!item(x.id)) return; if (!(x.id in soma)) { soma[x.id] = 0; ordem.push(x.id); } soma[x.id] += x.q; });
    ordem.forEach(function (k) { itens.push({ it: item(k), q: soma[k], pecas: true }); });
    itens.forEach(function (x) {
      var it = x.it, cheio = it.de > it.preco ? it.de : it.preco;
      bruto += x.q * cheio; desc += x.q * (cheio - it.preco); n += it.un === "un" ? x.q : 1;
    });
    bruto = r2(bruto); desc = Math.min(r2(desc), bruto);
    return { itens: itens, bruto: bruto, desc: desc, total: r2(bruto - desc), n: n };
  }
  var qCaneca = function (k) { return PECAS.reduce(function (a, x) { return x.id === k ? a + x.q : a; }, 0); };
  function atualizaCtl(k) { Array.prototype.forEach.call(document.querySelectorAll("[data-ctl]"), function (el) { if (el.dataset.ctl === k) el.innerHTML = ctl(k); }); }
  function mudar(k, delta) {
    var it = item(k); if (!it) return;
    var q = r2((CARRO[k] || 0) + delta * it.passo);
    if (q <= 0) delete CARRO[k]; else CARRO[k] = Math.min(it.combo ? 50 : 999, q);
    guardar(); atualizaCtl(k); barra(delta > 0);
  }
  /* adiciona uma caneca personalizada; se já existe uma linha igual, só soma a quantidade */
  var caminhoDe = function (f) { return f && f.path ? f.path : ""; };
  var igual = function (a, b) { return a.id === b.id && a.f === b.f && a.r === b.r && caminhoDe(a.foto) === caminhoDe(b.foto) && caminhoDe(a.verso) === caminhoDe(b.verso); };
  function adicionarPeca(l) {
    var ja = PECAS.find(function (x) { return igual(x, l); });
    if (ja) ja.q = Math.min(999, ja.q + l.q); else PECAS.push({ i: nid(), id: l.id, q: Math.min(999, l.q), f: l.f, r: l.r, foto: l.foto, verso: l.verso || null });
    guardar(); atualizaCtl(l.id); barra(true);
  }
  function tirarPeca(i) {
    var x = PECAS.find(function (y) { return y.i === i; }); if (!x) return;
    PECAS = PECAS.filter(function (y) { return y.i !== i; }); guardar(); atualizaCtl(x.id); barra();
  }
  /* a personalização de cada caneca viaja em "pers"; a observação do pedido fica só com o que o cliente escreveu */
  function persPedido() {
    return PECAS.filter(function (x) { return x.f || x.r || (x.foto && x.foto.path) || (x.verso && x.verso.path); }).map(function (x) { return { p: x.id, q: x.q, f: x.f, foto: x.foto ? x.foto.path : "", verso: x.verso ? x.verso.path : "", r: x.r }; });
  }
  function obsFinal() { return FORM.obs.trim().slice(0, 500); }

  /* ---------- foto do cliente: reduzida no aparelho e enviada ao armazenamento do Saus360 ---------- */
  function lerViaDataUrl(file) {
    return new Promise(function (ok, no) {
      var fr = new FileReader();
      fr.onload = function () { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = no; im.src = fr.result; };
      fr.onerror = no; fr.readAsDataURL(file);
    });
  }
  function lerImagem(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () { return lerViaDataUrl(file); });
    return lerViaDataUrl(file);
  }
  function reduzir(im, lado) {
    var w = im.width || im.naturalWidth, h = im.height || im.naturalHeight, k = Math.min(1, lado / Math.max(w, h)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  var paraBlob = function (c, q) { return new Promise(function (ok) { c.toBlob(ok, "image/jpeg", q); }); };
  /* JPEG de até ~900 KB (o limite do armazenamento é 1 MB): tenta qualidades menores até caber */
  function prepararFoto(file) {
    return lerImagem(file).then(function (im) {
      var etapas = [[1400, 0.82], [1200, 0.72], [1000, 0.64], [800, 0.58]];
      var tenta = function (i) {
        return paraBlob(reduzir(im, etapas[i][0]), etapas[i][1]).then(function (b) {
          if (!b) throw new Error("vazia");
          if (b.size > 900 * 1024 && i < etapas.length - 1) return tenta(i + 1);
          if (b.size > 1000 * 1024) throw new Error("grande");
          return { blob: b, pv: reduzir(im, 480).toDataURL("image/jpeg", 0.72), th: reduzir(im, 120).toDataURL("image/jpeg", 0.7) };
        });
      };
      return tenta(0);
    });
  }
  function hex32() { var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join(""); }
  function subirFoto(f) {
    f.st = "env"; f.msg = "";
    return fetch(CFG.supabaseUrl + "/storage/v1/object/pedidos-fotos/" + f.path, { method: "POST", body: f.blob, credentials: "omit", referrerPolicy: "no-referrer",
      headers: { apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey, "Content-Type": "image/jpeg", "x-upsert": "false", "cache-control": "max-age=31536000" } })
      .then(function (r) { f.st = r.ok ? "ok" : "erro"; if (!r.ok) f.msg = r.status === 400 || r.status === 403 ? "Não foi possível enviar a foto agora. Tente de novo em alguns minutos." : "Não foi possível enviar a foto."; })
      .catch(function () { f.st = "erro"; f.msg = "Sem conexão. Verifique a internet e tente de novo."; });
  }
  var ALVOS = ["hero", "hero-v", "ed", "ed-v"];
  var fotoDe = function (alvo) { return alvo === "hero" ? HERO.foto : alvo === "hero-v" ? HERO.verso : !ED ? null : alvo === "ed-v" ? ED.verso : ED.foto; };
  function poeFoto(alvo, f) { if (alvo === "hero") HERO.foto = f; else if (alvo === "hero-v") HERO.verso = f; else if (ED) { if (alvo === "ed-v") ED.verso = f; else ED.foto = f; ED.erro = ""; } }
  var enviando = function (f) { return !!f && f.st !== "ok" && f.st !== "erro"; };
  function refresca() { if (ED) edAtualiza(); if ($("h-svg")) heroAtualiza(); }
  function escolherFoto(file, alvo) {
    var f = { st: "prep", path: slug + "/" + hex32() + ".jpg", pv: "", th: "", blob: null, msg: "" };
    poeFoto(alvo, f);
    girarPara(alvo);
    if (!file || (file.type && !/^image\//.test(file.type))) { f.st = "erro"; f.msg = "Escolha uma imagem (JPG ou PNG)."; refresca(); return; }
    if (file.size > 40 * 1024 * 1024) { f.st = "erro"; f.msg = "Essa foto é grande demais. Escolha outra."; refresca(); return; }
    refresca();
    prepararFoto(file).then(function (r) { f.blob = r.blob; f.pv = r.pv; f.th = r.th; refresca(); girarPara(alvo); return subirFoto(f); })
      .catch(function () { f.st = "erro"; f.blob = null; f.msg = "Não consegui ler essa foto. Tente um JPG ou PNG."; })
      .then(refresca);
  }
  function fotoDeNovo(alvo) { var f = fotoDe(alvo); if (!f || !f.blob) return; var p = subirFoto(f); refresca(); p.then(refresca); }
  /* o botão da foto: escolher, acompanhar o envio, trocar ou tirar (uma para a frente e outra para o verso) */
  function fotoBox(alvo) {
    var f = fotoDe(alvo), verso = /-v$/.test(alvo), qual = verso ? "do verso" : "da frente";
    var input = function (txt, cls, rot) { return '<label class="' + cls + '"><input type="file" accept="image/*" data-up="' + alvo + '" aria-label="' + (rot || txt) + '">' + (cls === "upl" ? IC.camera : "") + "<span>" + txt + "</span></label>"; };
    if (!f) return input(verso ? "Foto do verso" : "Foto da frente", "upl", "Escolher a foto " + qual + " da caneca");
    var th = f.pv || f.th, img = th ? '<img src="' + esc(th) + '" alt="Foto ' + qual + '">' : '<span class="rodando" aria-hidden="true"></span>';
    var estado = f.st === "ok" ? '<div class="ft bom">Foto ' + qual + ' enviada<small>Já está no pedido.</small></div>'
      : f.st === "erro" ? '<div class="ft ruim" role="alert">' + esc(f.msg || "Não foi possível enviar a foto.") + "</div>"
      : '<div class="ft">' + (f.st === "prep" ? "Preparando a foto " + qual + "…" : "Enviando a foto " + qual + "…") + "<small>Aguarde um instante.</small></div>";
    var acoes = f.st === "erro" && f.blob ? '<button type="button" class="lk" data-a="foto-de-novo" data-alvo="' + alvo + '">Tentar de novo</button>' : "";
    return '<div class="fotob">' + img + estado + '<div class="ac">' + acoes + (f.st === "env" || f.st === "prep" ? "" : input("Trocar", "lk", "Trocar a foto " + qual)) + '<button type="button" class="lk x" data-a="foto-x" data-alvo="' + alvo + '" aria-label="Tirar a foto ' + qual + '">Tirar</button></div></div>';
  }
  /* as duas fotos juntas: lado a lado enquanto vazias, uma embaixo da outra depois de escolhidas */
  function fotosBox(base) { var a = fotoDe(base), b = fotoDe(base + "-v"); return '<div class="fotos2' + (!a && !b ? " duas" : "") + '">' + fotoBox(base) + fotoBox(base + "-v") + "</div>"; }

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
      NOME = bonito(L.nome || "Loja");
      PRODS = Array.isArray(r.produtos) ? r.produtos : []; COMBOS = Array.isArray(r.combos) ? r.combos : [];
      document.title = NOME + " · Canecas personalizadas";
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
    /* caneca: o botão abre a personalização, em vez de só jogar na sacola */
    if (!it.combo && ehCaneca(it.o)) {
      var n = qCaneca(k);
      return '<button class="pers" data-a="ver" data-k="' + esc(k) + '" aria-label="Personalizar ' + esc(it.nome) + '">' + IC.lapis + "<span>Personalizar</span></button>" + (n ? '<span class="nsac">' + numTxt(n) + " na sacola</span>" : "");
    }
    if (!q) return '<button class="mais" data-a="add" data-k="' + esc(k) + '" aria-label="Adicionar ' + esc(it.nome) + '">' + IC.mais + "</button>";
    return '<div class="step"><button data-a="sub" data-k="' + esc(k) + '" aria-label="Tirar um">−</button><output aria-label="Na sacola">' + numTxt(q) + '</output><button data-a="add" data-k="' + esc(k) + '" aria-label="Mais um">+</button></div>';
  }
  /* cada produto fica de pé numa prateleira; a tábua é desenhada pelo CSS, de uma coluna à outra */
  function obj(p) {
    var d = pct(p);
    return '<li class="obj"><div class="palco-o"><button class="ov" data-a="ver" data-k="' + esc(p.id) + '" aria-label="' + esc(p.nome) + ", " + esc(money(p.preco)) + '">' + visual(p) + "</button>" +
      (tem(SELOS, p.selo) ? '<span class="selo">' + SELOS[p.selo] + "</span>" : "") + (d > 0 ? '<span class="laco">−' + d + "%</span>" : "") + "</div>" +
      '<div class="otx"><h3>' + esc(p.nome) + "</h3>" + (p.desc ? '<p class="desc2">' + esc(p.desc) + "</p>" : "") +
      '<div class="rod' + (ehCaneca(p) ? " cust" : "") + '"><div>' + precoHtml(p, p.un) + (p.pronta ? '<span class="pronta">Pronta entrega</span>' : "") + '</div><div class="ctl" data-ctl="' + esc(p.id) + '">' + ctl(p.id) + "</div></div></div></li>";
  }
  function comboItens(c) { return (c.itens || []).map(function (i) { return numTxt(i.q) + (i.un && i.un !== "un" ? " " + i.un : "") + " " + i.nome; }).join(" + "); }
  function cardCombo(c) {
    var k = "c:" + c.id, econ = r2(Number(c.de) - Number(c.preco));
    return '<article class="combo"><button class="cbody" data-a="ver" data-k="' + esc(k) + '" aria-label="' + esc(c.nome) + ", " + esc(money(c.preco)) + '"><span class="cfoto">' + visual(c) + "</span>" +
      '<span class="ctx"><b>' + esc(c.nome) + "</b><small>" + esc(comboItens(c)) + "</small>" + precoHtml(c) + (econ > 0 ? '<span><span class="econ">Economize ' + money(econ) + "</span></span>" : "") + "</span></button>" +
      '<div class="ctl" data-ctl="' + esc(k) + '">' + ctl(k) + "</div></article>";
  }
  function catsUsadas() {
    var nomes = Object.create(null), ordem = []; (Array.isArray(L.cats) ? L.cats : []).forEach(function (c) { nomes[c.id] = c.l; ordem.push(c.id); });
    var usadas = []; PRODS.forEach(function (p) { if (usadas.indexOf(p.cat) < 0) usadas.push(p.cat); });
    var ids = ordem.filter(function (id) { return usadas.indexOf(id) >= 0; }).concat(usadas.filter(function (id) { return ordem.indexOf(id) < 0; }));
    return ids.map(function (id, i) { return { id: "cat" + i, cat: id, l: nomes[id] || "Outros" }; });
  }
  function secoes() {
    var s = [];
    if (COMBOS.length) s.push({ id: "combos", l: "Combos", t: "Combos", n: COMBOS.length, h: '<div class="combos">' + COMBOS.map(cardCombo).join("") + "</div>" });
    catsUsadas().forEach(function (c) {
      var ps = PRODS.filter(function (p) { return p.cat === c.cat; });
      /* os destaques da loja vêm primeiro na prateleira */
      ps = ps.filter(function (p) { return p.destaque; }).concat(ps.filter(function (p) { return !p.destaque; }));
      s.push({ id: c.id, l: c.l, t: c.l, n: ps.length, kraft: c.cat === "embalagens", h: '<ul class="fila">' + ps.map(obj).join("") + "</ul>" });
    });
    return s;
  }
  function conteudo() {
    if (!PRODS.length && !COMBOS.length) return '<div class="wrap"><div class="vazio"><b>Cardápio em preparação</b>A loja ainda está colocando os produtos. Volte em breve ou fale pelo WhatsApp.</div></div>';
    if (BUSCA.trim()) {
      var q = norm(BUSCA.trim()), ps = PRODS.filter(function (p) { return norm(p.nome + " " + (p.desc || "")).indexOf(q) >= 0; }), cs = COMBOS.filter(function (c) { return norm(c.nome + " " + comboItens(c)).indexOf(q) >= 0; });
      if (!ps.length && !cs.length) return '<div class="wrap"><div class="vazio"><b>Nada encontrado</b>Tente outra palavra ou veja todos os produtos.<p style="margin-top:14px"><button class="btn linha" style="flex:none" data-a="limpar">Ver tudo</button></p></div></div>';
      return '<section class="sec"><div class="wrap"><header><h2>' + (ps.length + cs.length) + (ps.length + cs.length === 1 ? " resultado" : " resultados") + "</h2></header>" + (cs.length ? '<div class="combos" style="margin-bottom:26px">' + cs.map(cardCombo).join("") + "</div>" : "") + '<ul class="fila">' + ps.map(obj).join("") + "</ul></div></section>";
    }
    return secoes().map(function (s) {
      return '<section class="sec' + (s.kraft ? " kraft" : "") + '" id="s-' + s.id + '"><div class="wrap"><header><h2>' + esc(s.t) + "</h2><small>" + (s.n === 1 ? "1 item" : s.n + " itens") + "</small></header>" + (s.kraft ? '<p class="sub-sec">Embalagens para presentear a caneca. Adicione ao pedido.</p>' : "") + s.h + "</div></section>";
    }).join("");
  }

  /* ---------- capa: escreva a frase e veja na caneca ---------- */
  function variantes() { return ORDEM_HERO.map(function (id) { return PRODS.find(function (p) { return p.id === id; }); }).filter(Boolean); }
  function heroProd() { return PRODS.find(function (p) { return p.id === HERO.v; }) || variantes()[0]; }
  function heroRotulo(p) { return "Prévia: " + p.nome + (HERO.t.trim() ? ", com o texto " + HERO.t.trim() : "") + (HERO.foto ? ", com foto na frente" : "") + (HERO.verso ? ", com foto no verso" : ""); }
  function heroSvg() {
    var p = heroProd();
    return mugSvg(specDe(p), { f: fDe(p, specDe(p)), txt: HERO.t, foto: fotoSrc(HERO.foto), fantasma: true, grande: true, rotulo: heroRotulo(p) });
  }
  /* a capa usa a caneca 3D quando o aparelho desenha em canvas */
  function hero3D() {
    var p = heroProd(), b = $("h-svg"); if (!p || !b) return;
    var s = specDe(p), v = caneca3D(b, { id: p.id, s: s, f: fDe(p, s), txt: HERO.t, frente: fotoSrc(HERO.foto), verso: fotoSrc(HERO.verso), quente: !!HERO.quente, fantasma: true, rotulo: heroRotulo(p) });
    if (v) v.dica(); else b.innerHTML = heroSvg();
  }
  function escolhaHtml(p) {
    var promo = p.de && Number(p.de) > Number(p.preco);
    return "<span>" + esc(p.nome) + "</span><b>" + (promo ? "<s>" + money(p.de) + "</s>" : "") + money(p.preco) + "</b>";
  }
  function heroHtml() {
    var vs = variantes(); if (!vs.length) return "";
    if (!vs.some(function (p) { return p.id === HERO.v; })) HERO.v = vs[0].id;
    var p = heroProd(), s = specDe(p), wa = digits(L.whatsapp);
    var chips = ["Feliz Natal!", "Melhor mãe do mundo", "Café com amor"];
    return '<section class="hero" aria-labelledby="t-hero"><div class="hero-in"><div class="hero-tx"><h1 id="t-hero">Veja sua frase na caneca.</h1><p class="sub">Escolha o modelo, escreva a frase e, se quiser, envie fotos para a frente e o verso. Gire a caneca para ver como fica.</p></div>' +
      '<div class="palco' + (HERO.quente ? " quente" : "") + '" id="palco"><div class="mesa"></div><div class="palco-svg" id="h-svg">' + heroSvg() + "</div>" + giroHtml("h") + "</div>" +
      '<div class="ctrl"><div class="frase"><label for="h-frase">Sua frase na caneca</label><div class="cx"><input id="h-frase" maxlength="' + MAXFRASE + '" autocomplete="off" placeholder="Ex.: Para a melhor vovó" value="' + esc(HERO.t) + '"><span class="cnt" id="h-cnt">' + HERO.t.length + "/" + MAXFRASE + "</span></div>" +
      '<div class="chips">' + chips.map(function (c) { return '<button type="button" data-a="chip" data-t="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div></div>" +
      '<div class="fotolinha"><span class="lbl-f">Fotos na caneca <small>(opcional)</small></span><div id="h-fotobox">' + fotosBox("hero") + "</div></div>" +
      '<div class="modelos"><span id="t-mod">Modelo</span><div class="mod-l" role="group" aria-labelledby="t-mod">' + vs.map(function (v) { return '<button type="button" data-a="modelo" data-id="' + esc(v.id) + '" aria-pressed="' + (v.id === HERO.v) + '" aria-label="' + esc(v.nome) + '">' + mugSvg(specDe(v), { f: 1 }) + "</button>"; }).join("") + "</div></div>" +
      '<div class="escolha" id="h-esc" aria-live="polite">' + escolhaHtml(p) + "</div>" +
      '<button type="button" class="quente-b" id="h-q" data-a="quente" aria-pressed="' + !!HERO.quente + '"' + (s.magica ? "" : " hidden") + ">" + (HERO.quente ? "Esfriar a caneca" : "Colocar bebida quente") + "</button>" +
      '<button type="button" class="btn" id="h-add" data-a="pers-add">' + heroBtn(p) + "</button>" +
      '<button type="button" class="quente-b" data-a="hero-mais">Quantidade, recado e mais opções</button>' +
      "</div></div></section>";
  }
  var heroBtn = function (p) { return (HERO.n ? "Adicionar outra caneca · " : "Adicionar à sacola · ") + money(p.preco); };
  function heroAtualiza() {
    var p = heroProd(); if (!p || !$("h-svg")) return;
    var s = specDe(p);
    hero3D();
    $("palco").classList.toggle("quente", !!HERO.quente);
    $("h-esc").innerHTML = escolhaHtml(p);
    $("h-add").textContent = heroBtn(p);
    $("h-cnt").textContent = HERO.t.length + "/" + MAXFRASE;
    var fb = $("h-fotobox"); if (fb) { var nb = fotosBox("hero"); if (fb.dataset.s !== nb) { fb.innerHTML = nb; fb.dataset.s = nb; } }
    var ha = $("h-add"), esperando = enviando(HERO.foto) || enviando(HERO.verso); ha.disabled = !!esperando;
    if (esperando) ha.textContent = "Enviando a foto…";
    var q = $("h-q"); q.hidden = !s.magica; q.setAttribute("aria-pressed", String(!!HERO.quente)); q.textContent = HERO.quente ? "Esfriar a caneca" : "Colocar bebida quente";
    Array.prototype.forEach.call(document.querySelectorAll('[data-a="modelo"]'), function (b) { b.setAttribute("aria-pressed", String(b.dataset.id === HERO.v)); });
  }
  function heroAdd() {
    var p = heroProd(); if (!p) return;
    var f = HERO.foto, fv = HERO.verso;
    if ((f && f.st === "erro") || (fv && fv.st === "erro")) { brinde("Tente enviar a foto de novo"); return; }
    if (enviando(f) || enviando(fv)) { brinde("Aguarde o envio da foto"); return; }
    var t = HERO.t.trim().slice(0, MAXFRASE), tinha = qCaneca(p.id);
    adicionarPeca({ id: p.id, q: 1, f: t, r: "", foto: f, verso: fv });
    HERO.n++; heroAtualiza();
    brinde(tinha ? "Mais uma caneca na sacola" : "Caneca na sacola");
  }

  function nomeCurto() { return esc(NOME); }
  function cabHtml() {
    var wa = digits(L.whatsapp), ig = /^[A-Za-z0-9._]{1,30}$/.test(L.insta || "") ? L.insta : "";
    return '<header class="cab"><a class="marca" href="./" aria-label="' + nomeCurto() + '"><span class="logo">' + (imgOk(L.logo) ? '<img src="' + esc(L.logo) + '" alt="">' : IC.caneca) + "</span><b>" + nomeCurto() + '</b></a><div class="acoes">' +
      (wa ? '<a class="wa" href="' + esc(waLink("Olá! Vim pela loja online.")) + '" target="_blank" rel="noopener" aria-label="Falar pelo WhatsApp">' + IC.wa + "</a>" : "") +
      (ig ? '<a href="https://instagram.com/' + esc(ig) + '" target="_blank" rel="noopener" aria-label="Instagram da loja">' + IC.insta + "</a>" : "") +
      '<button data-a="compartilhar" aria-label="Compartilhar a loja">' + IC.envia + "</button></div></header>";
  }
  function fatosHtml() {
    var f = [], fato = function (ic, rot, val) { return "<li>" + ic + "<span><small>" + rot + "</small><b>" + val + "</b></span></li>"; };
    if (L.retirada) f.push(fato(IC.pino, "Retirada", L.endereco ? esc(L.endereco) : "Na loja"));
    if (L.entrega) f.push(fato(IC.moto, "Entrega", L.taxa > 0 ? money(L.taxa) : "Grátis"));
    f.push(fato(IC.cal, "Encomendas", L.antecedencia > 0 ? "Com " + L.antecedencia + (L.antecedencia === 1 ? " dia" : " dias") + " de antecedência" : "Também para hoje"));
    if (L.horario) f.push(fato(IC.hora, "Horário", esc(L.horario)));
    if (L.minimo > 0) f.push(fato(IC.sacola, "Pedido mínimo", money(L.minimo)));
    return '<ul class="fatos" aria-label="Como a loja atende">' + f.join("") + "</ul>";
  }
  function desenhar() {
    var ss = secoes(), cat = PRODS.length + COMBOS.length > 0;
    var h = cabHtml() + (cat ? heroHtml() : "") + (L.aviso ? '<div class="fita"><p>' + IC.sino + "<span>" + esc(L.aviso) + "</span></p></div>" : "") + fatosHtml();
    if (cat) {
      h += '<nav class="nav" aria-label="Seções da loja"><div class="wrap">' +
        (PRODS.length > 8 ? '<div class="busca">' + IC.busca + '<input type="search" id="busca" placeholder="Buscar na loja" value="' + esc(BUSCA) + '" aria-label="Buscar na loja" autocomplete="off" enterkeyhint="search" maxlength="60"></div>' : "") +
        (ss.length > 1 ? '<div class="abas" id="abas">' + ss.map(function (s, i) { return '<button data-a="ir" data-id="' + esc(s.id) + '" aria-current="' + (i === 0) + '">' + esc(s.l) + "</button>"; }).join("") + "</div>" : "") + "</div></nav>";
    }
    h += '<div id="conteudo">' + conteudo() + "</div>" + (cat ? '<div id="fimloja">' + comoHtml() + "</div>" : "") + contatoHtml();
    $("app").innerHTML = h;
    if (cat) hero3D();
    barra(); espiar();
  }
  /* fim da vitrine: como o pedido funciona e os dados da loja */
  function comoHtml() {
    var wa = digits(L.whatsapp);
    return '<section class="como" aria-labelledby="t-como"><div class="wrap"><h2 id="t-como">Como fazer seu pedido</h2><ol>' +
      "<li><b>Monte suas canecas</b><span>Escolha o modelo, escreva a frase e envie as fotos da frente e do verso. Cada caneca pode ser diferente.</span></li>" +
      "<li><b>Marque o dia</b><span>" + (L.retirada && L.entrega ? "Retirada na loja ou entrega, no dia que preferir." : L.entrega ? "Escolha o dia da entrega." : "Escolha o dia da retirada.") + "</span></li>" +
      "<li><b>Envie o pedido</b><span>" + nomeCurto() + " confirma" + (wa ? " pelo WhatsApp" : "") + " e combina o pagamento com você.</span></li></ol>" +
      (wa ? '<p class="arte">Ficou com alguma dúvida sobre a arte da sua caneca? <a href="' + esc(waLink("Olá! Tenho uma dúvida sobre a personalização da minha caneca.")) + '" target="_blank" rel="noopener">Fale com a loja pelo WhatsApp</a>.</p>' : "") + "</div></section>";
  }
  function contatoHtml() {
    var wa = digits(L.whatsapp), ig = /^[A-Za-z0-9._]{1,30}$/.test(L.insta || "") ? L.insta : "", dados = [];
    if (L.retirada) dados.push("<li>" + IC.pino + "<span>" + (L.endereco ? "Retirada em " + esc(L.endereco) : "Retirada na loja") + "</span></li>");
    if (L.entrega) dados.push("<li>" + IC.moto + "<span>Entrega" + (L.taxa > 0 ? " por " + money(L.taxa) : " grátis") + "</span></li>");
    if (L.horario) dados.push("<li>" + IC.hora + "<span>" + esc(L.horario) + "</span></li>");
    var links = (wa ? '<a class="btn wa" href="' + esc(waLink("Olá! Vim pela loja online.")) + '" target="_blank" rel="noopener">' + IC.wa + "Falar no WhatsApp</a>" : "") +
      (ig ? '<a class="btn linha" href="https://instagram.com/' + esc(ig) + '" target="_blank" rel="noopener">' + IC.insta + "@" + esc(ig) + "</a>" : "");
    return '<section class="contato" aria-labelledby="t-contato"><div class="wrap"><h2 id="t-contato">' + nomeCurto() + "</h2>" + (dados.length ? '<ul class="dados">' + dados.join("") + "</ul>" : "") + (links ? '<div class="links">' + links + "</div>" : "") + "</div></section>";
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
  function fechar() { ED = null; $("folha").innerHTML = ""; document.body.style.overflow = ""; if (ANTES && ANTES.focus && document.contains(ANTES)) ANTES.focus({ preventScroll: true }); ANTES = null; }
  function verItem(k, q) {
    var it = item(k); if (!it) return;
    QF = q == null ? (CARRO[k] || it.passo) : q;
    var o = it.o, foto = imgOk(o.foto), d = pct(o), s = specDe(o);
    var h = foto ? '<img class="grande" src="' + esc(o.foto) + '" alt="' + esc(it.nome) + '">' : '<div class="grande ph"><div class="gv" id="gv">' + ilustra(o, { grande: true }) + "</div></div>";
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
    abrir(h, it.nome, (foto ? "temfoto" : "temilu") + (s.caixa ? " kraftfundo" : ""));
  }
  /* ---------- personalizar a caneca: frase, foto, recado e quantas iguais ---------- */
  var TIPOS = ["sem", "frase", "foto", "ambos"];
  var usaFrase = function (t) { return t === "frase" || t === "ambos"; };
  var usaFoto = function (t) { return t === "foto" || t === "ambos"; };
  var tipoDe = function (e) { var ft = e.foto || e.verso; return e.f && ft ? "ambos" : ft ? "foto" : e.f ? "frase" : e.ln ? "sem" : "frase"; };
  var rotSem = function (o) { return imgOk(o.foto) ? "Como está no modelo" : "Só a caneca"; };
  function abrirEstudio(k, ln, pre) {
    var it = item(k); if (!it) return;
    var l = ln ? PECAS.find(function (x) { return x.i === ln; }) : null; if (ln && !l) return;
    pre = pre || {};
    ED = { k: k, ln: l ? l.i : "", q: l ? l.q : 1, f: l ? l.f : pre.f || "", r: l ? l.r : pre.r || "", foto: l ? l.foto : pre.foto || null, verso: l ? l.verso || null : pre.verso || null, n: 0, erro: "" };
    ED.tipo = tipoDe(ED);
    verEstudio();
  }
  function edIlustra() {
    var it = item(ED.k);
    return ilustra(it.o, { txt: usaFrase(ED.tipo) ? ED.f : "", foto: usaFoto(ED.tipo) && ED.foto ? fotoSrc(ED.foto) : "", grande: true });
  }
  /* topo da folha: a foto do produto (quando tem e nada foi personalizado) ou a caneca em 3D com a frase e as fotos do cliente */
  function edCabeca() {
    var it = item(ED.k), o = it.o;
    if (imgOk(o.foto) && ED.tipo === "sem") return '<img class="grande" src="' + esc(o.foto) + '" alt="' + esc(it.nome) + '">';
    if (TEM3D) return '<div class="grande ph tres"><div class="gv" id="gv"></div>' + giroHtml("e") + "</div>";
    return '<div class="grande ph"><div class="gv" id="gv">' + edIlustra() + "</div></div>";
  }
  function edCabecaAtualiza() {
    var eh = $("e-head"); if (!eh || !ED) return;
    var nh = edCabeca(); if (eh.dataset.s !== nh) { eh.innerHTML = nh; eh.dataset.s = nh; }
    var gv = $("gv"); if (!gv || !TEM3D) return;
    var it = item(ED.k), s = specDe(it.o), fo = usaFoto(ED.tipo);
    caneca3D(gv, { id: it.o.id, s: s, f: fDe(it.o, s), txt: usaFrase(ED.tipo) ? ED.f : "", frente: fo ? fotoSrc(ED.foto) : "", verso: fo ? fotoSrc(ED.verso) : "", quente: true,
      rotulo: "Prévia: " + it.nome + (usaFrase(ED.tipo) && ED.f.trim() ? ", com o texto " + ED.f.trim() : "") + (fo && ED.foto ? ", com foto na frente" : "") + (fo && ED.verso ? ", com foto no verso" : "") });
  }
  function edCampos() {
    var it = item(ED.k), t = ED.tipo, pronto = imgOk(it.o.foto), h = "";
    if (usaFrase(t)) {
      h += '<label class="campo fr">Sua frase<input data-e="f" maxlength="' + MAXFRASE + '" autocomplete="off" value="' + esc(ED.f) + '" placeholder="Ex.: Para a melhor vovó"></label>' +
        '<div class="chips ch2">' + ["Feliz Natal!", "Melhor mãe do mundo", "Café com amor"].map(function (c) { return '<button type="button" data-a="e-chip" data-t="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div>" +
        '<p class="nota">' + (pronto ? "Este modelo já vem com uma arte. Escreva a frase que você quer no lugar da original." : "Até " + MAXFRASE + " letras. A frase vai impressa na caneca.") + "</p>";
    }
    if (usaFoto(t)) h += '<span class="lbl">Suas fotos</span><div id="e-fotobox">' + fotosBox("ed") + '</div><p class="nota">Envie a foto da frente, a do verso ou as duas. Gire a caneca acima para ver como fica. Prefira fotos nítidas.</p>';
    if (t !== "sem") h += '<label class="campo">Algum detalhe ou ajuste? (opcional)<textarea data-e="r" rows="2" maxlength="' + MAXREC + '" placeholder="' + (pronto ? "Ex.: trocar o nome do modelo por Ana" : "Ex.: foto do casal à esquerda, frase embaixo") + '">' + esc(ED.r) + "</textarea></label>";
    return h;
  }
  function edBotao() {
    var it = item(ED.k), b = $("e-add"); if (!it || !b) return;
    var esp = usaFoto(ED.tipo) && (enviando(ED.foto) || enviando(ED.verso));
    b.disabled = !!esp;
    b.textContent = esp ? "Enviando a foto…" : (ED.ln ? "Salvar" : "Adicionar") + " · " + money(ED.q * it.preco);
  }
  function edAtualiza() {
    if (!ED || !$("e-add")) return;
    edCabecaAtualiza();
    var fb = $("e-fotobox"); if (fb) { var nb = fotosBox("ed"); if (fb.dataset.s !== nb) { fb.innerHTML = nb; fb.dataset.s = nb; } }
    var er = $("e-err"); if (er) er.innerHTML = ED.erro ? '<div class="aviso erro" role="alert">' + esc(ED.erro) + "</div>" : "";
    var q = $("e-q"); if (q) q.textContent = numTxt(ED.q);
    edBotao();
  }
  function verEstudio() {
    var it = item(ED.k), o = it.o, foto = imgOk(o.foto), d = pct(o), t = ED.tipo;
    var rot = { sem: rotSem(o), frase: "Com frase", foto: "Com foto", ambos: "Frase e foto" };
    var sub = { sem: foto ? "sem alterar" : "sem arte", frase: "texto na caneca", foto: "a sua imagem", ambos: "as duas coisas" };
    var h = '<div id="e-head">' + edCabeca() + "</div>";
    h += "<h2>" + esc(it.nome) + "</h2>" + precoHtml(o, it.un) +
      (d > 0 ? '<p style="margin-top:8px"><span class="econ">' + d + "% de desconto" + (o.ate ? " até " + dataBR(o.ate) : "") + "</span></p>" : "") +
      (o.pronta ? '<p><span class="pronta" style="font-size:14px;margin-top:8px">Pronta entrega</span></p>' : "") + (o.desc ? '<p class="desc">' + esc(o.desc) + "</p>" : "");
    if (ED.n) h += '<div class="aviso">' + numTxt(qCaneca(ED.k)) + " na sacola. Monte a próxima abaixo.</div>";
    h += '<span class="lbl" id="e-l">Como você quer sua caneca?</span><div class="tipos" role="group" aria-labelledby="e-l">' +
      TIPOS.map(function (x) { return '<button type="button" data-a="e-tipo" data-id="' + x + '" aria-pressed="' + (x === t) + '">' + rot[x] + "<small>" + sub[x] + "</small></button>"; }).join("") + "</div>" +
      '<div id="e-campos">' + edCampos() + "</div>" +
      '<span class="lbl">Quantas canecas assim?</span><div class="add"><div class="passo"><button type="button" data-a="e-menos" aria-label="Diminuir">−</button><output id="e-q">' + numTxt(ED.q) + '</output><button type="button" data-a="e-mais" aria-label="Aumentar">+</button></div>' +
      '<button type="button" class="btn" id="e-add" data-a="e-ok"></button></div><div id="e-err"></div>' +
      (ED.ln ? '<button type="button" class="btn linha cheio" style="margin-top:10px" data-a="e-tirar">Tirar da sacola</button>'
        : '<button type="button" class="btn linha cheio" style="margin-top:10px" data-a="e-outra">Adicionar e montar outra diferente</button><p class="nota">Quer uma frase ou foto diferente em cada caneca? Adicione esta e monte a próxima.</p>');
    abrir(h, it.nome, foto ? "temfoto" : "temilu");
    edAtualiza();
  }
  function edValida() {
    var t = ED.tipo, fs = [ED.foto, ED.verso].filter(Boolean);
    if (usaFrase(t) && !ED.f.trim()) return "Escreva a frase ou escolha “" + rotSem(item(ED.k).o) + "”.";
    if (usaFoto(t)) {
      if (!fs.length) return "Escolha pelo menos uma foto (frente ou verso) ou mude o tipo de personalização.";
      if (fs.some(function (x) { return x.st === "erro"; })) return "Uma foto não foi enviada. Tente de novo ou escolha outra.";
      if (fs.some(function (x) { return x.st !== "ok"; })) return "Aguarde o envio da foto.";
    }
    return "";
  }
  /* só vale o que o tipo escolhido usa: quem volta para "Só a caneca" não leva frase nem foto */
  function edLinha() {
    var t = ED.tipo;
    return { id: ED.k, q: ED.q, f: usaFrase(t) ? ED.f.trim().slice(0, MAXFRASE) : "", foto: usaFoto(t) ? ED.foto : null, verso: usaFoto(t) ? ED.verso : null, r: t === "sem" ? "" : ED.r.trim().slice(0, MAXREC) };
  }
  function edSalvar(outra) {
    var er = edValida(); if (er) { ED.erro = er; edAtualiza(); return; }
    var l = edLinha(), k = ED.k;
    if (ED.ln) {
      var x = PECAS.find(function (y) { return y.i === ED.ln; });
      if (x) {
        x.q = l.q; x.f = l.f; x.r = l.r; x.foto = l.foto; x.verso = l.verso;
        var dup = PECAS.find(function (y) { return y !== x && igual(y, x); });
        if (dup) { dup.q = Math.min(999, dup.q + x.q); PECAS = PECAS.filter(function (y) { return y !== x; }); }
      }
      guardar(); atualizaCtl(k); barra(); ED = null; verSacola(); return;
    }
    adicionarPeca(l);
    if (outra) {
      ED.n++; ED.f = ""; ED.r = ""; ED.foto = null; ED.verso = null; ED.q = 1; ED.tipo = "frase"; ED.erro = "";
      brinde("Caneca na sacola. Monte a próxima."); verEstudio();
      var fo = document.querySelector(".folha"); if (fo) fo.scrollTop = 0;
      return;
    }
    fechar(); brinde("Caneca na sacola");
  }
  function pecaHtml(x) {
    var it = item(x.id); if (!it) return "";
    var fa = x.foto || x.verso, mini = imgOk(it.o.foto) && !x.f && !fa ? visual(it.o) : ilustra(it.o, { vb: MINI, txt: x.f, foto: fa ? fa.th : "" });
    var fo = function (y, txt) { return y ? '<span class="fo"><img src="' + esc(y.th) + '" alt="">' + txt + "</span>" : ""; };
    var det = (x.f ? '<span class="fr">«' + esc(x.f) + "»</span>" : "") + fo(x.foto, x.verso ? "Foto da frente" : "Foto enviada") + fo(x.verso, "Foto do verso") + (x.r ? '<span class="re">' + esc(x.r) + "</span>" : "") + (!x.f && !fa && !x.r ? '<span class="sem">Sem personalização</span>' : "");
    return '<div class="item pc"><span class="mini">' + mini + '</span><div class="nm"><b>' + esc(it.nome) + "</b><small>" + money(r2(x.q * it.preco)) + "</small>" + det + '<button type="button" class="lk" data-a="e-editar" data-ln="' + esc(x.i) + '">Editar</button></div>' +
      '<div class="passo"><button data-a="p-menos" data-ln="' + esc(x.i) + '" aria-label="Diminuir">−</button><output>' + numTxt(x.q) + '</output><button data-a="p-mais" data-ln="' + esc(x.i) + '" aria-label="Aumentar">+</button></div></div>';
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
    var h = "<h2>Sua sacola</h2>" + PECAS.map(pecaHtml).join("") + c.itens.filter(function (x) { return !x.pecas; }).map(function (x) {
      var it = x.it;
      return '<div class="item"><span class="mini">' + visual(it.o) + '</span><div class="nm"><b>' + esc(it.nome) + "</b><small>" + money(r2(x.q * it.preco)) + (it.combo ? " · combo" : "") + '</small></div><div class="passo"><button data-a="s-menos" data-k="' + esc(it.k) + '" aria-label="Diminuir">−</button><output>' + numTxt(x.q) + '</output><button data-a="s-mais" data-k="' + esc(it.k) + '" aria-label="Aumentar">+</button></div></div>';
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
    var h = '<button class="volta" data-a="sacola">' + IC.volta + "Sacola</button><h2>Retirada e seus dados</h2>";
    if (L.retirada && L.entrega) h += '<span class="lbl">Como você quer receber</span><div class="seg"><button data-a="modo" data-id="retirada" aria-pressed="' + (FORM.modo === "retirada") + '">Retirar na loja</button><button data-a="modo" data-id="entrega" aria-pressed="' + (FORM.modo === "entrega") + '">Entrega' + (L.taxa > 0 ? " · " + money(L.taxa) : "") + "</button></div>";
    if (FORM.modo === "retirada" && L.endereco) h += '<p class="nota">Retirada em ' + esc(L.endereco) + "</p>";
    if (FORM.modo === "entrega") h += '<label class="' + cl("end") + '">Endereço de entrega<input data-f="end" autocomplete="street-address" maxlength="200" value="' + esc(FORM.end) + '" placeholder="Rua, número, bairro"></label>';
    h += '<span class="lbl">Para qual dia</span><div class="dias">' + dias.map(function (d) { return '<button data-a="dia" data-id="' + d + '" aria-pressed="' + (!fora && FORM.data === d) + '"><small>' + (d === L.hoje ? "hoje" : esc(diaSem(d))) + "</small>" + dataBR(d) + "</button>"; }).join("") +
      '<button class="outra" data-a="outra" aria-pressed="' + fora + '">Outra data</button></div>';
    h += '<div class="dupla">' + (fora ? '<label class="' + cl("data") + '">Dia<input type="date" data-f="data" min="' + min + '" max="' + somaDias(L.hoje, 120) + '" value="' + esc(FORM.data) + '"></label>' : "") + '<label class="campo">Horário (opcional)<input type="time" data-f="hora" value="' + esc(FORM.hora) + '"></label></div>';
    if (L.horario) h += '<p class="nota">Atendimento: ' + esc(L.horario) + "</p>";
    h += '<label class="' + cl("nome") + '">Seu nome<input data-f="nome" autocomplete="name" maxlength="80" value="' + esc(FORM.nome) + '"></label>' +
      '<label class="' + cl("fone") + '">Seu WhatsApp<input data-f="fone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" value="' + esc(FORM.fone) + '" placeholder="(47) 99999-0000"></label>' +
      '<label class="campo">Observação (opcional)<textarea data-f="obs" rows="2" maxlength="400" placeholder="Ex.: Vou buscar depois das 17h">' + esc(FORM.obs) + "</textarea></label>" +
      '<label class="isca" aria-hidden="true">Site<input data-f="site" tabindex="-1" autocomplete="off" value=""></label>' + linhasTotais(c, taxa);
    if (ERRO) h += '<div class="aviso erro" role="alert">' + esc(ERRO) + "</div>";
    h += '<button class="btn cheio" data-a="enviar" ' + (ENVIANDO ? "disabled" : "") + ">" + (ENVIANDO ? "Enviando…" : "Enviar pedido · " + money(c.total + taxa)) + "</button>" +
      '<p class="nota">' + nomeCurto() + ' confirma o pedido e combina o pagamento com você pelo WhatsApp.</p>' +
      '<p class="nota">Ao enviar, o seu nome, telefone' + (FORM.modo === "entrega" ? ", endereço" : "") + ' e as observações vão para ' + esc(NOME || "esta loja") +
      ', que usa esses dados só para preparar e entregar o pedido. Para o próximo pedido, eles ficam salvos neste aparelho. ' +
      '<a href="/privacidade/#loja" target="_blank" rel="noopener">Política de privacidade</a></p>';
    abrir(h, "Retirada e seus dados");
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
    else if (PECAS.some(function (x) { return (x.foto && x.foto.st !== "ok") || (x.verso && x.verso.st !== "ok"); })) { ERRO = "Uma foto ainda não foi enviada. Volte à sacola, toque em Editar e envie de novo."; }
    if (ERRO) { verDados(); return; }
    ENVIANDO = true; verDados();
    var obs = obsFinal(), pers = persPedido();
    var corpo = { nome: FORM.nome.trim(), fone: FORM.fone, modo: FORM.modo, end: FORM.end.trim(), data: FORM.data, hora: FORM.hora, obs: obs, site: FORM.site,
      itens: c.itens.map(function (x) { return x.it.combo ? { combo: x.it.o.id, q: x.q } : { id: x.it.o.id, q: x.q }; }) };
    if (pers.length) corpo.pers = pers;
    rpc("loja_pedido_pers", { p_slug: slug, p: corpo })
      .then(function (r) {
        ENVIANDO = false;
        if (!r || !r.ok) { ERRO = (r && typeof r.erro === "string" && r.erro) || "Não foi possível enviar. Tente de novo."; CAMPO = r && /^(nome|fone|end|data)$/.test(r.campo || "") ? r.campo : ""; if (CAMPO === "data") OUTRA = true; verDados(); return; }
        var num = parseInt(r.num, 10) || 0, hora = /^\d{2}:\d{2}$/.test(r.hora || "") ? r.hora : "";
        var quando = (r.modo === "entrega" ? "Entrega" : "Retirada") + " em " + dataBR(r.data) + (hora ? " às " + hora : "");
        var persTxt = typeof r.pers === "string" ? r.pers.slice(0, 3000) : "", persTela = persTxt.replace(/(foto(?: da frente| do verso)?) https:\/\/\S+/g, "$1 enviada");
        var msg = "Olá! Acabei de fazer o pedido #" + num + " pela loja online:\n" + r.resumo + (persTxt ? "\n\nPersonalização:\n" + persTxt : "") + "\n\nTotal: " + money(r.total) + "\n" + quando + (r.modo === "entrega" ? "\nEndereço: " + FORM.end.trim() : "") + (obs ? "\nObs.: " + obs : "") + "\nNome: " + FORM.nome.trim();
        CARRO = {}; PECAS = []; ED = null; HERO.foto = null; HERO.verso = null; FORM.obs = ""; FORM.hora = ""; guardar(); desenhar();
        abrir('<div class="ok"><div class="sel">' + IC.certo + "</div><h2>Pedido #" + num + ' enviado!</h2><p class="muted">' + nomeCurto() + " vai confirmar o pedido e combinar o pagamento com você.</p>" +
          '<div class="resumo">' + esc(r.resumo) + (persTela ? "\n\nPersonalização:\n" + esc(persTela) : "") + "\n\nTotal: " + esc(money(r.total)) + (Number(r.economia) > 0 ? "\nVocê economizou " + esc(money(r.economia)) : "") + "\n" + esc(quando) + (obs ? "\n" + esc(obs) : "") + "</div>" +
          (digits(L.whatsapp) ? '<a class="btn wa cheio" style="margin-top:0" href="' + esc(waLink(msg)) + '" target="_blank" rel="noopener">' + IC.wa + "Avisar a loja pelo WhatsApp</a>" : "") +
          '<button class="btn linha cheio" style="margin-top:10px" data-a="fechar">Voltar para a loja</button></div>', "Pedido enviado");
      })
      .catch(function () { ENVIANDO = false; ERRO = "Sem conexão. Verifique a internet e tente de novo."; verDados(); });
  }
  function compartilhar() {
    var url = location.origin + "/loja/" + slug, d = { title: NOME, text: "Faça seu pedido na loja online de " + NOME, url: url };
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
    if (a === "modelo") { if (item(id)) { HERO.v = id; HERO.quente = false; heroAtualiza(); } return; }
    if (a === "chip") { HERO.t = String(t.dataset.t || "").slice(0, MAXFRASE); var hf = $("h-frase"); if (hf) hf.value = HERO.t; heroAtualiza(); return; }
    if (a === "quente") { HERO.quente = !HERO.quente; heroAtualiza(); return; }
    if (a === "pers-add") { heroAdd(); return; }
    if (a === "hero-mais") { var hp = heroProd(); if (hp) abrirEstudio(hp.id, "", { f: HERO.t.trim().slice(0, MAXFRASE), foto: HERO.foto && HERO.foto.st === "ok" ? HERO.foto : null, verso: HERO.verso && HERO.verso.st === "ok" ? HERO.verso : null }); return; }
    if (a === "lado") { var vw = viewDe(t.dataset.v); if (vw) { vw.mexeu = true; vw.para(id === "v" ? Math.PI : 0); } return; }
    if (a === "foto-x") { if (ALVOS.indexOf(t.dataset.alvo) >= 0) { poeFoto(t.dataset.alvo, null); refresca(); } return; }
    if (a === "foto-de-novo") { if (ALVOS.indexOf(t.dataset.alvo) >= 0) fotoDeNovo(t.dataset.alvo); return; }
    if (a === "e-tipo" && ED && TIPOS.indexOf(id) >= 0) {
      ED.tipo = id; ED.erro = ""; $("e-campos").innerHTML = edCampos();
      Array.prototype.forEach.call(document.querySelectorAll('[data-a="e-tipo"]'), function (b) { b.setAttribute("aria-pressed", String(b.dataset.id === id)); });
      edAtualiza();
      var fi = document.querySelector('.folha [data-e="f"]'); if (fi && usaFrase(id) && !ED.f) fi.focus({ preventScroll: true });
      return;
    }
    if (a === "e-chip" && ED) { ED.f = String(t.dataset.t || "").slice(0, MAXFRASE); ED.erro = ""; var ef = document.querySelector('.folha [data-e="f"]'); if (ef) ef.value = ED.f; edAtualiza(); return; }
    if ((a === "e-mais" || a === "e-menos") && ED) { ED.q = Math.max(1, Math.min(999, ED.q + (a === "e-mais" ? 1 : -1))); edAtualiza(); return; }
    if (a === "e-ok" && ED) { edSalvar(false); return; }
    if (a === "e-outra" && ED) { edSalvar(true); return; }
    if (a === "e-tirar" && ED && ED.ln) { tirarPeca(ED.ln); ED = null; verSacola(); return; }
    if (a === "e-editar") { var pe = PECAS.find(function (x) { return x.i === t.dataset.ln; }); if (pe) abrirEstudio(pe.id, pe.i); return; }
    if ((a === "p-mais" || a === "p-menos")) {
      var pl = PECAS.find(function (x) { return x.i === t.dataset.ln; });
      if (pl) { pl.q += a === "p-mais" ? 1 : -1; if (pl.q > 999) pl.q = 999; if (pl.q < 1) tirarPeca(pl.i); else { guardar(); atualizaCtl(pl.id); barra(a === "p-mais"); } verSacola(); }
      return;
    }
    if (a === "ver" && it) { if (!it.combo && ehCaneca(it.o)) abrirEstudio(k); else verItem(k); return; }
    if (a === "add" && it) { if (!it.combo && ehCaneca(it.o)) { abrirEstudio(k); return; } var novo = !CARRO[k]; mudar(k, 1); if (novo) brinde("Adicionado à sacola"); return; }
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
    if (t.id === "h-frase") { HERO.t = t.value.slice(0, MAXFRASE); heroAtualiza(); return; }
    if (t.id === "busca") { BUSCA = t.value.slice(0, 60); $("conteudo").innerHTML = conteudo(); if ($("abas")) $("abas").hidden = !!BUSCA.trim(); if ($("fimloja")) $("fimloja").hidden = !!BUSCA.trim(); if (!BUSCA.trim()) espiar(); return; }
    var ek = t.dataset && t.dataset.e;
    if (ek && ED) {
      if (ek === "f") ED.f = t.value.slice(0, MAXFRASE); else if (ek === "r") ED.r = t.value.slice(0, MAXREC);
      if (ED.erro) { ED.erro = ""; var er = $("e-err"); if (er) er.innerHTML = ""; }
      if (ek === "f") edCabecaAtualiza();
      return;
    }
    var f = t.dataset && t.dataset.f; if (!f || !(f in FORM)) return;
    if (f === "fone") { var m2 = mascara(t.value); if (m2 !== t.value) t.value = m2; }
    FORM[f] = t.value;
    if (f === "nome" || f === "fone" || f === "end") guardar();
    if (f === CAMPO) { CAMPO = ""; var c = t.closest(".campo"); if (c) c.classList.remove("erro"); }
  });
  /* escolher a foto: o campo de arquivo fica dentro do botão */
  document.addEventListener("change", function (e) {
    var t = e.target, alvo = t && t.dataset && t.dataset.up; if (!alvo || ALVOS.indexOf(alvo) < 0) return;
    var arq = t.files && t.files[0]; t.value = "";
    if (arq) escolherFoto(arq, alvo);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("folha").innerHTML) fechar(); });
  carregar();
})();
