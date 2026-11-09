/* ---- brand.js ---- */
"use strict";
/* Marca Saus360: "S" hexagonal com uma caixa no centro (estoque, compras e fornecedores em volta).
   Usada no app, no painel e nos ícones do Android (scripts/make-icons.mjs).
   v = "claro" (fundo claro) | "escuro" (fundo escuro/azul-marinho) | "branco" (fundo azul) */
function marcaSaus(v, fundo, tam) {
  const T = {
    claro:  { a1: "#464B71", a2: "#118AB2", b1: "#118AB2", b2: "#7CD5C7", top: "#6A70A0", esq: "#464B71", dir: "#33385C", linha: "#FFFFFF", halo: "#FFFFFF" },
    escuro: { a1: "#2B9FCB", a2: "#47BEDD", b1: "#47BEDD", b2: "#7CD5C7", top: "#FFFFFF", esq: "#E4E7EF", dir: "#C3C9DA", linha: "#464B71", halo: "#464B71" },
    branco: { a1: "#FFFFFF", a2: "#F2F2ED", b1: "#F2F2ED", b2: "#C9F0EA", top: "#6A70A0", esq: "#464B71", dir: "#33385C", linha: "#FFFFFF", halo: "#118AB2" }
  };
  const c = T[v] || T.claro, h = fundo || c.halo, id = "ms" + (T[v] ? v : "claro"), s = tam ? ` width="${tam}" height="${tam}"` : "";
  // hexágono de raio 34 centrado em (50,50); faixa de 15; caixa isométrica no centro
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${s} aria-hidden="true">
<defs><linearGradient id="${id}a" gradientUnits="userSpaceOnUse" x1="30" y1="16" x2="62" y2="50"><stop offset="0" stop-color="${c.a1}"/><stop offset="1" stop-color="${c.a2}"/></linearGradient>
<linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="40" y2="84"><stop offset="0" stop-color="${c.b1}"/><stop offset="1" stop-color="${c.b2}"/></linearGradient></defs>
<g fill="none" stroke-width="15" stroke-linejoin="miter" stroke-miterlimit="4">
<path d="M71.2 28.24 L50 16 L20.56 33 L20.56 50 L52 50" stroke="url(#${id}a)"/>
<path d="M48 50 L79.44 50 L79.44 67 L50 84 L28.8 71.76" stroke="url(#${id}b)"/></g>
<path d="M50 33.5 L64.3 41.75 L64.3 58.25 L50 66.5 L35.7 58.25 L35.7 41.75 Z" style="fill:${h};stroke:${h}" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 36 L62.1 43 L50 50 L37.9 43 Z" fill="${c.top}"/><path d="M37.9 43 L50 50 L50 64 L37.9 57 Z" fill="${c.esq}"/><path d="M50 50 L62.1 43 L62.1 57 L50 64 Z" fill="${c.dir}"/>
<path d="M50 36 L62.1 43 L62.1 57 L50 64 L37.9 57 L37.9 43 Z M37.9 43 L50 50 L62.1 43 M50 50 L50 64" fill="none" stroke="${c.linha}" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M43.9 39.5 L56 46.5 L56 50.8" fill="none" stroke="${c.linha}" stroke-width="1.3" stroke-linejoin="round" opacity=".85"/>
</svg>`;
}
function marcaHtml(o) {
  o = o || {};
  const dark = o.escuro != null ? o.escuro : (typeof isDark === "function" && isDark());
  return `<div class="brand">${'<span class="logo">'}${marcaSaus(dark ? "escuro" : "claro", "var(--bg)")}</span><b>Saus<span>360</span>${o.sufixo ? ` <em>${o.sufixo}</em>` : ""}</b></div>`;
}

/* ---- core.js ---- */
"use strict";
/* ================= Utilidades ================= */
const APP = "Saus360";
/* Idioma do app: o build gera app.js (português) e app-es.js (espanhol); o index.html escolhe qual carregar
   pela preferência salva ou pelo idioma do celular, e marca o <html lang>. */
const IDIOMA = /^es/i.test(document.documentElement.lang || "") ? "es" : "pt";
const IDIOMA_LOC = IDIOMA === "es" ? "es-MX" : "pt-BR";
function setIdioma(l) { if (l === IDIOMA) return; try { localStorage.setItem("saus360-idioma", l); } catch (e) {} location.reload(); }
/* Textos fixos do index.html: ficam aqui para entrar na tradução */
function textosShell() {
  const q = s => document.querySelector(s);
  const h = q("#scanner .scan-hint"); if (h) h.textContent = "Aponte a câmera para o código de barras";
  const c = q("#scanner [data-a=scanStop]"); if (c) c.textContent = "Cancelar";
  const x = q("#sheet .shead [data-a=closeSheet]"); if (x) x.setAttribute("aria-label", "Fechar");
  const n = q("#tabbar"); if (n) n.setAttribute("aria-label", "Navegação");
}
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const isoD = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const isoT = d => isoD(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
const dayOff = (n, h = 12, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); d.setDate(d.getDate() + n); return d; };
const today = isoD(new Date());
const addDays = (s, n) => { const d = new Date(s.slice(0, 10) + "T12:00"); d.setDate(d.getDate() + n); return isoD(d); };
/* Números, moeda e datas seguem o país da empresa (PAISES, mais abaixo); sem empresa aberta, Brasil */
const fmt = n => (n || 0).toLocaleString(PC().loc, { style: "currency", currency: PC().moeda });
const fmt0 = n => (n || 0).toLocaleString(PC().loc, { style: "currency", currency: PC().moeda, maximumFractionDigits: 0 });
const num = n => (n || 0).toLocaleString(PC().loc);
const pct = n => (isFinite(n) ? (n * 100).toLocaleString(PC().loc, { maximumFractionDigits: 1 }) : "0") + "%";
const fd = s => { if (!s) return "—"; const p = s.slice(0, 10).split("-"); return PC().mdy ? p[1] + "/" + p[2] : p[2] + "/" + p[1]; };
const fdy = s => { if (!s) return "—"; const p = s.slice(0, 10).split("-"); return (PC().mdy ? p[1] + "/" + p[2] : p[2] + "/" + p[1]) + "/" + p[0].slice(2); };
const diffDays = (a, b) => Math.round((new Date(b.slice(0, 10) + "T12:00") - new Date(a.slice(0, 10) + "T12:00")) / 864e5);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = n => String(n || "?").replace(/[^A-Za-zÀ-ú ]/g, "").split(" ").filter(w => w.length > 1).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const r2 = n => Math.round((n || 0) * 100) / 100;
const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
const clone = o => JSON.parse(JSON.stringify(o));
const money = n => (n || 0).toFixed(2).replace(".", PC().dec);
const dec = n => String(n == null ? "" : n).replace(".", PC().dec); // número simples (ex.: 2.5 -> "2,5" no Brasil)
const parseMoney = v => {
  let s = String(v == null ? "" : v).replace(/\s|R\$|US\$|MX\$|\$/g, ""); if (!s) return NaN;
  if (PC().dec === ",") { if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); }
  else s = s.replace(/,/g, "");
  return parseFloat(s);
};
const digits = s => String(s || "").replace(/\D/g, "");
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const byTs = (a, b) => String(b.ts).localeCompare(String(a.ts));
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* ================= Domínio ================= */
/* ---- Categorias de produto: cada empresa tem as suas (S.emp.cats); sem lista salva, usa as do ramo ---- */
const RUBROS = {
  vinhos: { l: "Vinhos e bebidas", cats: [["tinto", "Tinto", "#6d1a2c"], ["branco", "Branco", "#d9b752"], ["rose", "Rosé", "#e48c9d"], ["espumante", "Espumante", "#cdb878"], ["sobremesa", "Sobremesa", "#b8702a"], ["fortificado", "Fortificado", "#5a2a1a"], ["outros", "Acessório/outros", "#8a7f7a"]] },
  semijoias: { l: "Semijoias e acessórios", cats: [["brincos", "Brincos", "#c9a227"], ["colares", "Colares", "#118ab2"], ["aneis", "Anéis", "#7b4fa0"], ["pulseiras", "Pulseiras", "#2a9d8f"], ["conjuntos", "Conjuntos", "#c2562f"], ["outros", "Outros", "#8a7f7a"]] },
  emporio: { l: "Empório e alimentos", cats: [["bebidas", "Bebidas", "#6d1a2c"], ["mercearia", "Mercearia", "#c2562f"], ["frios", "Frios e laticínios", "#d9b752"], ["doces", "Doces e chocolates", "#7a4a2a"], ["cafes", "Cafés e chás", "#3c6e47"], ["presentes", "Cestas e presentes", "#118ab2"], ["outros", "Outros", "#8a7f7a"]] },
  limpeza: { l: "Limpeza e utilidades do lar", cats: [["vassouras", "Vassouras e esfregões", "#3c6e47"], ["produtos_limpeza", "Produtos de limpeza", "#118ab2"], ["quimicos", "Químicos e desinfetantes", "#7b4fa0"], ["plasticos", "Plásticos e baldes", "#c2562f"], ["cordas", "Cordas e fibras", "#d9b752"], ["descartaveis", "Descartáveis", "#2a9d8f"], ["outros", "Outros", "#8a7f7a"]] },
  food_confeitaria: { l: "Food · Confeitaria e doceria", food: 1, cats: [["insumos", "Ingredientes", "#8a6a3a"], ["embalagens", "Embalagens", "#8a7f7a"], ["bolos", "Bolos e tortas", "#c2562f"], ["doces", "Doces e brigadeiros", "#7a4a2a"], ["sobremesas", "Sobremesas", "#e48c9d"], ["kits", "Kits e presentes", "#118ab2"], ["outros", "Outros", "#5f5e5a"]] },
  food_padaria: { l: "Food · Padaria e pastelaria", food: 1, cats: [["insumos", "Ingredientes", "#8a6a3a"], ["embalagens", "Embalagens", "#8a7f7a"], ["paes", "Pães", "#b8702a"], ["salgados", "Salgados", "#c2562f"], ["doces", "Doces e confeitaria", "#7a4a2a"], ["bebidas", "Bebidas", "#118ab2"], ["outros", "Outros", "#5f5e5a"]] },
  food_cafe: { l: "Food · Cafeteria", food: 1, cats: [["insumos", "Ingredientes", "#8a6a3a"], ["embalagens", "Embalagens", "#8a7f7a"], ["cafes", "Cafés", "#3c6e47"], ["bebidas", "Outras bebidas", "#118ab2"], ["salgados", "Salgados", "#c2562f"], ["doces", "Doces", "#7a4a2a"], ["outros", "Outros", "#5f5e5a"]] },
  food_rest: { l: "Food · Restaurante e dark kitchen", food: 1, cats: [["insumos", "Ingredientes", "#8a6a3a"], ["embalagens", "Embalagens", "#8a7f7a"], ["pratos", "Pratos", "#c2562f"], ["porcoes", "Porções e lanches", "#b8702a"], ["bebidas", "Bebidas", "#118ab2"], ["sobremesas", "Sobremesas", "#e48c9d"], ["outros", "Outros", "#5f5e5a"]] },
  outro: { l: "Outro ramo", cats: [["geral", "Geral", "#118ab2"], ["outros", "Outros", "#8a7f7a"]] }
};
const CAT_CORES = ["#6d1a2c", "#c2562f", "#d9b752", "#3c6e47", "#2a9d8f", "#118ab2", "#464b71", "#7b4fa0", "#e48c9d", "#7a4a2a", "#8a7f7a"];
const VINHO_IDS = ["tinto", "branco", "rose", "espumante", "sobremesa", "fortificado"];
const PLURAL_VINHO = { tinto: "Tintos", branco: "Brancos", rose: "Rosés", espumante: "Espumantes", sobremesa: "Sobremesa", fortificado: "Fortificados", outros: "Acessórios e outros" };
const rubro = () => (S.emp && RUBROS[S.emp.rubro]) ? S.emp.rubro : "vinhos";
const ehVinho = () => rubro() === "vinhos";
const ehFood = () => !!(RUBROS[rubro()] || {}).food;
/* Food: insumos e embalagens não aparecem na venda; unidade de controle do estoque */
const ehInsumo = p => !!p && (p.tipoItem === "insumo" || p.tipoItem === "embalagem");
const unDe = p => (p && p.un) || "un";
const r4 = n => Math.round((n || 0) * 10000) / 10000;
function catsPadrao(r) { return (RUBROS[r] || RUBROS.vinhos).cats.map(([id, l, c]) => ({ id, l, c, ncm: r === "vinhos" && temFiscal() ? NCM_SUG[id] || "" : "", min: r === "vinhos" && id !== "outros" ? 6 : 0 })); }
/* Lista na ordem da empresa; "outros" sempre existe e nunca é arquivada. todas=true inclui as arquivadas. */
function cats(todas) {
  const salvas = S.emp && Array.isArray(S.emp.cats) && S.emp.cats.length ? S.emp.cats : null;
  let l = (salvas || catsPadrao(rubro())).map(c => Object.assign({}, c));
  if (!l.some(c => c.id === "outros")) l.push(catsPadrao(rubro()).find(c => c.id === "outros") || { id: "outros", l: "Outros", c: "#8a7f7a", ncm: "", min: 0 });
  l.forEach(c => { if (c.id === "outros") c.arq = false; });
  return todas ? l : l.filter(c => !c.arq);
}
const catDe = id => { const l = cats(true); return l.find(c => c.id === id) || l.find(c => c.id === "outros"); };
const catLabel = id => catDe(id).l;
/* Produto vindo de XML de compra: a categoria cujo NCM padrão mais se parece com o da nota (8, 6 ou 4 dígitos) */
function tipoPorNcm(ncm) {
  const d = digits(ncm), l = cats().filter(c => c.ncm);
  if (d) for (const n of [8, 6, 4]) { const c = l.find(x => digits(x.ncm).slice(0, n) === d.slice(0, n)); if (c) return c.id; }
  return "outros";
}
const catPlural = id => { const c = catDe(id); return ehVinho() && PLURAL_VINHO[c.id] && c.l === (RUBROS.vinhos.cats.find(x => x[0] === c.id) || [])[1] ? PLURAL_VINHO[c.id] : c.l; };
const TABELAS = { varejo: "Varejo", atacado: "Atacado", restaurante: "Restaurante", consig: "Consignado" };
const PAPEIS = { admin: "Administrador", gerente: "Gerente", vendedor: "Vendedor", estoque: "Estoquista" };
const FORMAS = ["Pix", "Boleto", "Cartão", "Transferência", "Dinheiro"]; // dados de demonstração (Brasil); no app, use formas()
const CONDS = { "0": "À vista", "15": "15 dias", "30": "30 dias", "30-60": "30/60 dias", "30-60-90": "30/60/90 dias" };
const CLI_TIPOS = ["Restaurante", "Bar", "Hotel", "Empório", "Supermercado", "Pessoa física", "Outro"];
const BAIXAS = ["Quebra", "Degustação", "Uso interno", "Devolução ao fornecedor", "Vencido ou estragado"];
const DESP_CATS = ["Aluguel", "Energia e água", "Salários", "Impostos", "Frete", "Marketing", "Sistemas", "Outros"];
const PERMS = {
  admin: ["vendas", "clientes", "estoque", "ajuste", "custo", "compras", "fornecedores", "receber", "pagar", "relatorios", "equipe", "empresa", "cancelar", "atividade", "fiscal"],
  gerente: ["vendas", "clientes", "estoque", "ajuste", "custo", "compras", "fornecedores", "receber", "pagar", "relatorios", "cancelar", "atividade", "fiscal"],
  vendedor: ["vendas", "clientes", "estoque", "receber", "fiscal"],
  estoque: ["estoque", "ajuste", "custo", "compras", "fornecedores"]
};
const condDays = c => String(c || "0").split("-").map(Number);
function makeParcelas(total, cond, base) {
  const ds = condDays(cond), n = ds.length, part = r2(total / n);
  return ds.map((d, i) => ({ venc: addDays(base, d), valor: i === n - 1 ? r2(total - part * (n - 1)) : part }));
}

/* ---- Fiscal (sugestões; o contador confirma) ---- */
const CFOP_DEF = { venda: ["5102", "6102"], vendaST: ["5405", "6404"], remessa: ["5917", "6917"], vendaConsig: ["5114", "6114"], retorno: ["1918", "2918"] };
const NCM_SUG = { tinto: "22042100", branco: "22042100", rose: "22042100", sobremesa: "22042100", fortificado: "22042100", espumante: "22041090", outros: "" };
const ORIGENS = [["0", "0 · Nacional"], ["1", "1 · Estrangeira, importação direta"], ["2", "2 · Estrangeira, comprada no Brasil"], ["3", "3 · Nacional, conteúdo importado > 40%"], ["5", "5 · Nacional, conteúdo importado ≤ 40%"], ["8", "8 · Nacional, conteúdo importado > 70%"]];
const REGIMES = [["1", "Simples Nacional"], ["2", "Simples Nacional, excesso de sublimite"], ["3", "Regime normal (Lucro Presumido ou Real)"], ["4", "MEI"]];
const IND_IE = [["9", "Não contribuinte"], ["1", "Contribuinte de ICMS"], ["2", "Contribuinte isento"]];
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
/* ---- País da empresa: moeda, documentos, endereço, formas de pagamento e impostos ---- */
const MX_ESTADOS = ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"];
const US_ESTADOS = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const PAISES = {
  BR: { l: "Brasil", loc: "pt-BR", moeda: "BRL", sim: "R$", dec: ",", ddi: "55", nacional: 11, docEmp: "CNPJ", docCli: "CNPJ ou CPF", docForn: "CNPJ", bairro: "Bairro", cidade: "Município", uf: "UF", cep: "CEP", ufs: UFS, fone: "(47) 99999-0000", cidadePh: "Joinville, SC", formas: ["Pix", "Boleto", "Cartão", "Transferência", "Dinheiro"], fiscal: true, iva: 0 },
  MX: { l: "México", loc: "es-MX", moeda: "MXN", sim: "$", dec: ".", ddi: "52", nacional: 10, docEmp: "RFC", docCli: "RFC", docForn: "RFC", bairro: "Colonia", cidade: "Município ou alcaldía", uf: "Estado", cep: "Código postal", ufs: MX_ESTADOS, fone: "81 1234 5678", cidadePh: "Monterrey, NL", formas: ["Transferência SPEI", "Cartão", "Dinheiro", "OXXO", "Cheque"], fiscal: false, iva: 0.16 },
  US: { l: "Estados Unidos", loc: "en-US", moeda: "USD", sim: "US$", dec: ".", ddi: "1", nacional: 10, docEmp: "EIN", docCli: "EIN ou Tax ID", docForn: "EIN", bairro: "Complemento", cidade: "Cidade", uf: "Estado", cep: "ZIP code", ufs: US_ESTADOS, fone: "(512) 555-0100", cidadePh: "Austin, TX", formas: ["Cartão", "Transferência (ACH)", "Cheque", "Dinheiro"], fiscal: false, iva: 0, mdy: true }
};
const paisEmp = () => (S.emp && PAISES[S.emp.pais]) ? S.emp.pais : "BR";
const PC = () => PAISES[paisEmp()];
const temFiscal = () => PC().fiscal; // NF-e/NFC-e, NCM, XML de fornecedor: só no Brasil
const SIM = () => PC().sim;
const formas = () => PC().formas;
const ivaTaxa = () => PC().iva;                                    // México: 16%
const ivaPadrao = () => ivaTaxa() > 0 && S.emp.ivaSomar !== false;  // preços cadastrados sem IVA: soma no pedido
const ivaLabel = t => `IVA ${dec(r2((t || ivaTaxa()) * 100))}%`;
/* RFC mexicano: 3 letras (empresa) ou 4 (pessoa), data AAMMDD e 3 caracteres de homoclave */
const rfcValido = s => /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(String(s || "").toUpperCase().replace(/[\s-]/g, ""));
/* Documento como digitado: no Brasil fica como está; México e EUA em maiúsculas e sem espaços */
const docNorm = (v, pais) => { const x = String(v || "").trim(); return (pais || paisEmp()) === "BR" ? x : x.toUpperCase().replace(/\s+/g, ""); };
const IVA_OPTS = P => [["mais", `Preços sem IVA: somar ${String(P.iva * 100)}% no pedido`], ["incluido", "Preços já incluem IVA"]];
const NF_TIPOS = { nfe_venda: "NF-e de venda", nfce: "NFC-e (consumidor)", nfe_remessa: "NF-e de remessa em consignação", nfe_venda_consig: "NF-e de venda do consignado", nfe_retorno: "NF-e de retorno de consignação" };
const fiscalCfg = () => Object.assign({ regime: "1", csosn: "102", csosnST: "500", cst: "00", cstST: "60", pisCofins: "99", presenca: "1", natVenda: "Venda de mercadoria", info: "" }, (S.emp && S.emp.fiscal) || {});
const cfopDe = (k, inter) => { const f = fiscalCfg(), c = (f.cfop && f.cfop[k]) || CFOP_DEF[k]; return c[inter ? 1 : 0]; };
/* ================= Estado e armazenamento ================= */
let MODE = null;          // "demo" | "cloud" (artifact do Claude) | "supa" (app Android com Supabase)
let DB = null, USER = null, SB = null, UID = null, REAL_UID = null, EID = null, PROFILE = null, SESSION = null;
let CAN_WRITE = true;
let cloudState = "idle";  // idle | connecting | on | off
let loadState = "idle";   // idle | loading | ok | slow | erro | revogado
const S = { emp: null, prod: [], cli: [], forn: [], ped: [], comp: [], fin: [], mov: [], mem: [], nf: [] };
const COLS = ["prod", "cli", "forn", "ped", "comp", "fin", "mem", "mov", "nf", "rec"];
let unsubs = [], loadTimer = null, loadedCols = new Set();
const DEMO_KEY = "decanta-demo-v2";

const P = id => S.prod.find(x => x.id === id);
const Cl = id => id ? S.cli.find(x => x.id === id) : null;
const Fo = id => S.forn.find(x => x.id === id);
const Pe = id => S.ped.find(x => x.id === id);
const Co = id => S.comp.find(x => x.id === id);
const Fi = id => S.fin.find(x => x.id === id);
const Mb = id => S.mem.find(x => x.id === id);
const Nf = id => S.nf.find(x => x.id === id);
const ME = () => Mb(UID);
const can = p => { const m = ME(); return !!(m && PERMS[m.papel] && PERMS[m.papel].includes(p)); };
const nomeDe = uid => { const m = Mb(uid); return m ? m.nome : "Usuário removido"; };
const cliNome = o => { if (!o.cli) return o.consumidor && o.consumidor.nome ? o.consumidor.nome : "Consumidor final"; const c = Cl(o.cli); return c ? c.nome : "Cliente removido"; };

function resetState() { COLS.forEach(c => { S[c] = []; }); S.emp = null; }
function upsertLocal(c, id, doc) {
  const o = Object.assign({ id }, doc), i = S[c].findIndex(x => x.id === id);
  if (i >= 0) S[c][i] = o; else S[c].push(o);
  scheduleRender();
}
function saveDemo() { if (MODE !== "demo") return; try { localStorage.setItem(DEMO_KEY, JSON.stringify({ S, me: UID })); } catch (e) {} }
const localNext = serie => Math.max(serie === "comp" ? 500 : 1000, ...(S[serie] || []).map(x => x.num || 0)) + 1;
/* Cálculo local de estoque e custo médio (usado na tela e nos backends sem servidor) */
function stockDocs(changes) {
  return changes.map(ch => {
    const p = P(ch.id); if (!p) return null;
    const n = { estoque: (p.estoque || 0) + ch.delta };
    if (ch.custoEntrada > 0 && ch.delta > 0) { const base = Math.max(0, p.estoque || 0); n.custo = r4((base * (p.custo || 0) + ch.delta * ch.custoEntrada) / (base + ch.delta)); }
    n.estoque = r4(n.estoque);
    return Object.assign({}, p, n);
  }).filter(Boolean);
}
const BE = () => MODE === "supa" ? SupaBE : MODE === "cloud" ? ClaudeBE : DemoBE;
const Store = {
  async put(c, id, data) { const doc = clone(data); delete doc.id; upsertLocal(c, id, doc); return BE().put(c, id, doc); },
  async del(c, id) { S[c] = S[c].filter(x => x.id !== id); scheduleRender(); return BE().del(c, id); },
  async patch(c, id, partial) { const cur = S[c].find(x => x.id === id) || {}; const merged = Object.assign({}, cur, clone(partial)); delete merged.id; upsertLocal(c, id, merged); return BE().patch(c, id, clone(partial), merged); },
  async stock(changes) { const docs = stockDocs(changes); docs.forEach(d => upsertLocal("prod", d.id, Object.assign({}, d))); return BE().stock(changes, docs); },
  async appendPag(c, id, entry) { const cur = S[c].find(x => x.id === id); const merged = Object.assign({}, cur, { pag: clone(cur.pag || []).concat([entry]) }); delete merged.id; upsertLocal(c, id, merged); return BE().appendPag(c, id, entry, merged); },
  async nextNum(serie) { return BE().nextNum(serie, localNext(serie) - 1); },
  async putEmp(data) { const doc = clone(data); delete doc.id; S.emp = Object.assign({ id: EID }, doc); scheduleRender(); return BE().putEmp(doc); },
  async putMem(id, data) { const doc = clone(data); delete doc.id; upsertLocal("mem", id, doc); return BE().putMem(id, doc); },
  async delMem(id) { S.mem = S.mem.filter(x => x.id !== id); scheduleRender(); return BE().delMem(id); }
};
/* Versão do app e diagnóstico enviados ao painel do dono (só no app com Supabase) */
const VERSAO = (window.DECANTA_CONFIG && window.DECANTA_CONFIG.versao) || "dev";
function plataformaDesc() {
  const ua = navigator.userAgent || "", m = ua.match(/\(Linux; (Android [^;)]+); ([^;)]+?)(?: Build[^)]*)?\)/);
  const base = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? "App" : "Web";
  return (base + " · " + (m ? m[1] + " · " + m[2] : ua.slice(0, 80))).slice(0, 120);
}
const Erros = {
  vistos: new Map(),
  ignorar: /ResizeObserver loop|^Script error\.?$/i,
  enviar(tipo, msg, pilha, extra) {
    try {
      if (MODE !== "supa" || !SB || !SESSION) return;
      const m = String(msg || "").trim().slice(0, 500); if (!m || this.ignorar.test(m)) return;
      const k = tipo + "|" + m, agora = Date.now(); if ((this.vistos.get(k) || 0) > agora - 5 * 60e3) return; this.vistos.set(k, agora);
      const rota = String(ui.route || "") + (ui.sheet && ui.sheet.k ? "/" + ui.sheet.k : "");
      Promise.resolve(SB.rpc("registrar_erro", { p_empresa: EID || null, p_app: "cliente", p_versao: VERSAO, p_plataforma: plataformaDesc(), p_tipo: tipo,
        p_mensagem: m, p_pilha: String(pilha || "").slice(0, 4000), p_rota: rota, p_contexto: extra || {} })).catch(() => {});
    } catch (e) {}
  }
};
window.addEventListener("error", e => Erros.enviar("js", e.message, e.error && e.error.stack, { arquivo: String(e.filename || "").split("/").pop(), linha: e.lineno, coluna: e.colno }));
window.addEventListener("unhandledrejection", e => { const r = e.reason || {}; Erros.enviar("promessa", r.message || r.error_description || String(r), r.stack); });
const Acesso = {
  ult: 0, eid: null,
  marcar(forcar) {
    try {
      if (MODE !== "supa" || !SB || !EID) return;
      if (!forcar && this.eid === EID && Date.now() - this.ult < 30 * 60e3) return;
      this.ult = Date.now(); this.eid = EID;
      Promise.resolve(SB.rpc("marcar_acesso", { p_empresa: EID, p_versao: VERSAO, p_plataforma: plataformaDesc() })).catch(() => {});
    } catch (e) {}
  }
};

/* Trava de ação: enquanto um toque ainda está salvando, outros toques no mesmo botão são ignorados.
   Evita pedidos/clientes duplicados quando a conexão demora (ex.: logo depois de voltar ao app). */
const REDE = { pend: 0 };
function travarAcao(fn) {
  const emCurso = new Map();
  return async e => {
    const t = e.target.closest("[data-a]"); if (!t || t.disabled) return;
    const chave = t.dataset.a + "|" + (t.dataset.id || "");
    if (emCurso.has(chave)) { e.preventDefault(); if (REDE.pend) toast("Ainda salvando… aguarde a confirmação."); return; }
    const marca = {}; emCurso.set(chave, marca);
    const solta = () => { if (emCurso.get(chave) === marca) emCurso.delete(chave); document.querySelectorAll(".busy").forEach(b => { if (b === t) b.classList.remove("busy"); }); };
    const aviso = setTimeout(() => { if (REDE.pend && t.isConnected) { t.classList.add("busy"); toast("Salvando… aguarde a confirmação."); } }, 700);
    const limite = setTimeout(solta, 45000); // nunca deixa um botão travado para sempre
    try { await fn(e); } finally { clearTimeout(aviso); clearTimeout(limite); solta(); }
  };
}
async function commit(ps) {
  if (!CAN_WRITE) { toast("Você está em modo somente leitura."); return false; }
  try { await Promise.all(ps); renderAll(); return true; }
  catch (e) {
    const code = e && (e.code || (e.error && e.error.code)), msg = String((e && (e.message || e.details)) || "");
    if (code === "invalid_argument" || code === "42501" || /row-level security|permission/i.test(msg)) { toast(MODE === "supa" ? "Seu papel não permite esta ação, ou o plano da empresa está inativo." : "Sem permissão para salvar. Peça para ser convidado como Editor."); if (MODE === "cloud") CAN_WRITE = false; }
    else if (code === "quota_exceeded") toast("Limite de armazenamento atingido. Exporte e apague dados antigos.");
    else toast("Não foi possível salvar agora. Verifique a conexão e tente de novo.");
    Erros.enviar(/abort|fetch|network|conex/i.test(msg) ? "rede" : "salvar", msg || String(code || "erro ao salvar"), e && e.stack, { codigo: code || null });
    if (MODE === "supa") SupaBE.reload(); else scheduleRender();
    return false;
  }
}
function logMov(k, txt, extra) {
  return Store.put("mov", rid(), Object.assign({ ts: isoT(new Date()), k, txt, por: UID }, extra || {}));
}
/* Movimentos de estoque com quantidade, para o relatório de movimentos (tipo MB51 / kardex).
   mv = [{ p: produto, q: variação, de: saldo antes, c: contado }]. Chamar ANTES de Store.stock, que já muda o saldo local. */
function mvDe(changes) {
  const agg = {};
  (changes || []).forEach(c => { if (c && c.delta) agg[c.id] = (agg[c.id] || 0) + Number(c.delta); });
  return Object.entries(agg).filter(([id, q]) => q && P(id)).map(([id, q]) => ({ p: id, q, de: P(id).estoque }));
}
const TM = { // tipos de movimento: rótulo e sentido (1 entra, −1 sai, 0 ajuste/sem quantidade)
  venda: ["Venda", -1], consig: ["Saída em consignação", -1], dev_consig: ["Devolução de consignação", 1], est_venda: ["Venda cancelada (estorno)", 1], est_consig: ["Consignação cancelada (estorno)", 1],
  acerto: ["Acerto de consignação", 0], producao: ["Produção", 0], receb: ["Recebimento de compra", 1], entrada: ["Entrada manual", 1], baixa: ["Baixa", -1], contagem: ["Contagem individual", 0], inventario: ["Inventário geral", 0],
  import: ["Importação de planilha", 0], compra: ["Pedido de compra", 0], cadastro: ["Cadastro", 0], outro: ["Outro", 0]
};
function movTipo(e) {
  if (e.tm && TM[e.tm]) return e.tm;
  const t = String(e.txt || "");
  if (e.k === "venda") return /cancelad/i.test(t) ? "est_venda" : "venda";
  if (e.k === "consig") return /^Devolução/i.test(t) ? "dev_consig" : /^Acerto/i.test(t) ? "acerto" : /cancelad/i.test(t) ? "est_consig" : "consig";
  if (e.k === "estoque") return /^Entrada/i.test(t) ? "entrada" : /^Baixa/i.test(t) ? "baixa" : /^Contagem/i.test(t) ? "contagem" : /^Inventário/i.test(t) ? "inventario" : /^Mercadoria recebida/i.test(t) ? "receb" : /^Importação/i.test(t) ? "import" : "outro";
  if (e.k === "compra") return "compra";
  if (e.k === "cadastro") return "cadastro";
  return "outro";
}
/* Quantidade de um movimento para um produto: { q, de, c } ou null quando o registro não mexeu no estoque.
   Registros antigos (sem mv) são reconstruídos pelo texto e pelo pedido ou compra de referência. */
function movQtd(e, pid) {
  if (Array.isArray(e.mv)) { const x = e.mv.find(m => m.p === pid); return x ? { q: Number(x.q) || 0, de: x.de, c: x.c } : null; }
  const t = String(e.txt || ""), tm = movTipo(e), n = re => { const m = t.match(re); return m ? Number(m[1]) : null; };
  const doPed = sinal => { const o = S.ped.find(x => x.id === e.ref); if (!o) return null; const its = o.itens.filter(i => i.p === pid); return its.length ? { q: sinal * sum(its, i => i.q) } : null; };
  if (tm === "venda" || tm === "consig") return doPed(-1);
  if (tm === "est_venda") return doPed(1);
  if (tm === "est_consig") { const o = S.ped.find(x => x.id === e.ref); if (!o) return null; const its = o.itens.filter(i => i.p === pid); return its.length ? { q: sum(its, i => i.q - (i.dev || 0)) } : null; }
  if (tm === "dev_consig") { const v = n(/:\s*(\d+)\s*×/); return v != null ? { q: v } : null; }
  if (tm === "receb") { const c = S.comp.find(x => x.id === e.ref); if (!c) return null; const its = c.itens.filter(i => i.p === pid); return its.length ? { q: sum(its, i => i.q) } : null; }
  if (tm === "entrada") { const v = n(/\+(\d+)/); return v != null ? { q: v } : null; }
  if (tm === "baixa") { const v = n(/[−-](\d+)/); return v != null ? { q: -v } : null; }
  if (tm === "contagem") { const m = t.match(/sistema (\d+), contado (\d+)/); return m ? { q: Number(m[2]) - Number(m[1]), de: Number(m[1]), c: Number(m[2]) } : null; }
  return null;
}
/* Contagem geral em andamento: fica guardada no aparelho até finalizar, para não perder se o app fechar */
const INV_KEY = () => "saus360-inv-" + (EID || "x");
function invCarregar() { if (ui.invEid === EID) return; ui.invEid = EID; try { ui.inv = JSON.parse(localStorage.getItem(INV_KEY())) || {}; } catch (e) { ui.inv = {}; } }
function invGuardar() { try { if (Object.keys(ui.inv).length) localStorage.setItem(INV_KEY(), JSON.stringify(ui.inv)); else localStorage.removeItem(INV_KEY()); } catch (e) {} }
const invNum = v => ehFood() ? r4(parseMoney(v)) : parseInt(v, 10);
const invContado = pid => ui.inv[pid] != null && ui.inv[pid] !== "";
function unsubscribeAll() { unsubs.forEach(u => { try { u(); } catch (e) {} }); unsubs = []; clearTimeout(loadTimer); }
function startDemo() {
  MODE = "demo"; EID = "demo"; unsubscribeAll(); CAN_WRITE = true; loadState = "ok";
  let saved = null; try { saved = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch (e) {}
  const data = saved && saved.S && saved.S.prod ? saved.S : demoSeed();
  COLS.forEach(c => { S[c] = data[c] || []; }); S.emp = data.emp;
  UID = saved && saved.me && S.mem.some(m => m.id === saved.me) ? saved.me : "demo-admin";
  ui.route = "inicio"; ui.stack = []; closeSheet(); render(); window.scrollTo(0, 0);
}
function leaveCompany() {
  if (typeof SupaBE !== "undefined") SupaBE.cancelar(); // carga em andamento da empresa anterior para aqui
  unsubscribeAll(); MODE = null; EID = null; resetState(); closeSheet(); ui.route = "entrada"; ui.stack = [];
  UID = REAL_UID;
  if (PROFILE) { PROFILE.atual = null; savePrefs(); if (cloudState === "on" && DB) ClaudeBE.saveProfile(); }
  render(); window.scrollTo(0, 0);
}
function savePrefs() { try { if (PROFILE && MODE !== "cloud") localStorage.setItem("decanta-atual", PROFILE.atual || ""); } catch (e) {} }
/* ================= Cálculos ================= */
const soldQ = (o, i) => o.tipo === "consig" ? (i.vend || 0) : i.q;
function pedCalc(o) {
  const bruto = r2(sum(o.itens, i => soldQ(o, i) * i.preco));
  const desc = o.tipo === "consig" ? 0 : r2(o.desc || 0);
  const base = r2(Math.max(0, bruto - desc));
  const iva = o.iva > 0 ? r2(base * o.iva) : 0; // México: pedido com preços sem IVA (o.iva = 0.16)
  const total = r2(base + iva);
  const custo = r2(sum(o.itens, i => soldQ(o, i) * (i.custo || 0)));
  const pago = r2(sum(o.pag || [], p => p.valor));
  const ativo = o.status !== "cancelado" && o.tipo !== "orcamento";
  const aberto = ativo ? r2(Math.max(0, total - pago)) : 0;
  const comCliente = o.tipo === "consig" ? sum(o.itens, i => i.q - (i.vend || 0) - (i.dev || 0)) : 0;
  const parc = o.tipo === "consig" ? [{ venc: o.venc, valor: total }] : (o.parc && o.parc.length ? o.parc : [{ venc: o.data, valor: total }]);
  let rest = pago;
  const parcelas = parc.map(x => { const p = Math.min(rest, x.valor); rest = r2(rest - p); return { venc: x.venc, valor: x.valor, pago: p, aberto: ativo ? r2(x.valor - p) : 0 }; });
  const venc = parcelas.filter(x => x.aberto > 0.004 && x.venc < today);
  const vencido = r2(sum(venc, x => x.aberto));
  const atraso = venc.length ? Math.max(...venc.map(x => diffDays(x.venc, today))) : 0;
  let status;
  if (o.status === "cancelado") status = "cancelado";
  else if (o.tipo === "orcamento") status = o.status === "convertido" ? "convertido" : "orcamento";
  else if (aberto > 0.004) status = vencido > 0 ? "vencido" : "aberto";
  else if (comCliente > 0) status = "consignado";
  else status = "pago";
  const qtd = sum(o.itens, i => i.q);
  return { bruto, desc, base, iva, total, custo, pago, aberto, comCliente, parcelas, vencido, atraso, status, qtd, margem: base - custo };
}
function compCalc(c) {
  const total = r2(sum(c.itens, i => i.q * i.custo));
  const pago = r2(sum(c.pag || [], p => p.valor));
  const rec = c.status === "recebido";
  let rest = pago;
  const parcelas = (c.parc || []).map(x => { const p = Math.min(rest, x.valor); rest = r2(rest - p); return { venc: x.venc, valor: x.valor, pago: p, aberto: rec ? r2(x.valor - p) : 0 }; });
  const aberto = rec ? r2(Math.max(0, total - pago)) : 0;
  const vencido = r2(sum(parcelas.filter(x => x.aberto > 0.004 && x.venc < today), x => x.aberto));
  const status = c.status === "cancelado" ? "cancelado" : !rec ? "pedido" : aberto > 0.004 ? (vencido > 0 ? "vencido" : "apagar") : "pago";
  return { total, pago, aberto, parcelas, vencido, status, qtd: sum(c.itens, i => i.q) };
}
function finCalc(f) {
  const pago = r2(sum(f.pag || [], p => p.valor)), aberto = r2(Math.max(0, f.valor - pago));
  const status = aberto > 0.004 ? (f.venc < today ? "vencido" : "aberto") : "pago";
  return { pago, aberto, status, atraso: status === "vencido" ? diffDays(f.venc, today) : 0 };
}
function titulos(kind) {
  const out = [];
  if (kind === "receber") {
    S.ped.forEach(o => {
      if (o.tipo === "orcamento" || o.status === "cancelado") return;
      const c = pedCalc(o), n = c.parcelas.length;
      c.parcelas.forEach((p, ix) => { if (p.valor > 0.004) out.push({ src: "ped", id: o.id, venc: p.venc, valor: p.valor, aberto: p.aberto, quem: cliNome(o), desc: `Pedido #${o.num}${n > 1 ? ` · parcela ${ix + 1}/${n}` : ""}${o.tipo === "consig" ? " · consignação" : ""}` }); });
    });
  } else {
    S.comp.forEach(co => {
      if (co.status !== "recebido") return;
      const c = compCalc(co), fo = Fo(co.forn), n = c.parcelas.length;
      c.parcelas.forEach((p, ix) => out.push({ src: "comp", id: co.id, venc: p.venc, valor: p.valor, aberto: p.aberto, quem: fo ? fo.nome : "—", desc: `Compra #${co.num}${n > 1 ? ` · parcela ${ix + 1}/${n}` : ""}` }));
    });
  }
  S.fin.filter(f => f.tipo === kind).forEach(f => { const c = finCalc(f); out.push({ src: "fin", id: f.id, venc: f.venc, valor: f.valor, aberto: c.aberto, quem: f.cat || "", desc: f.desc }); });
  out.forEach(t => { t.status = t.aberto > 0.004 ? (t.venc < today ? "vencido" : "aberto") : "pago"; t.atraso = t.status === "vencido" ? diffDays(t.venc, today) : 0; });
  return out;
}
function cliStats(id) {
  const r = { aberto: 0, vencido: 0, consQ: 0, consV: 0, n: 0, ano: 0, ult: null, atraso: 0, total: 0 }, y = today.slice(0, 4);
  S.ped.forEach(o => {
    if (o.cli !== id || o.status === "cancelado" || o.tipo === "orcamento") return;
    const c = pedCalc(o);
    r.n++; r.total += c.total; r.aberto += c.aberto; r.vencido += c.vencido; r.atraso = Math.max(r.atraso, c.atraso);
    if (o.data.slice(0, 4) === y) r.ano += c.total;
    if (!r.ult || o.data > r.ult) r.ult = o.data;
    if (o.tipo === "consig") o.itens.forEach(i => { const l = i.q - (i.vend || 0) - (i.dev || 0); r.consQ += l; r.consV += l * i.preco; });
  });
  const cl = Cl(id);
  r.ticket = r.n ? r.total / r.n : 0;
  r.limite = cl && cl.limite ? cl.limite : 0;
  r.disp = r.limite ? r.limite - r.aberto - r.consV : null;
  return r;
}
const preco = (p, tab) => (p.precos && (p.precos[tab] || p.precos.varejo)) || 0;
const pstate = p => p.ativo === false ? { cls: "mute", t: "Inativo" } : p.estoque <= 0 ? { cls: "bad", t: "Sem estoque" } : p.estoque <= (p.min || 0) ? { cls: "warn", t: "Estoque baixo" } : { cls: "ok", t: "OK" };
const comClientes = pid => sum(S.ped.filter(o => o.tipo === "consig" && o.status !== "cancelado"), o => sum(o.itens.filter(i => i.p === pid), i => i.q - (i.vend || 0) - (i.dev || 0)));
function ultimaSaida(pid) { let u = null; S.ped.forEach(o => { if (o.tipo === "orcamento" || o.status === "cancelado") return; if (o.itens.some(i => i.p === pid) && (!u || o.data > u)) u = o.data; }); return u; }
const statusPed = c => ({
  pago: '<span class="pill ok">Pago</span>', aberto: '<span class="pill info">A receber</span>', vencido: `<span class="pill bad">Vencido · ${c.atraso}d</span>`,
  consignado: '<span class="pill warn">Consignação</span>', orcamento: '<span class="pill acc">Orçamento</span>', convertido: '<span class="pill mute">Convertido</span>', cancelado: '<span class="pill mute">Cancelado</span>'
}[c.status]);
const statusComp = c => ({ pedido: '<span class="pill info">Aguardando entrega</span>', apagar: '<span class="pill acc">A pagar</span>', vencido: '<span class="pill bad">Vencida</span>', pago: '<span class="pill ok">Paga</span>', cancelado: '<span class="pill mute">Cancelada</span>' }[c.status]);
const statusTit = t => t.status === "pago" ? '<span class="pill ok">Pago</span>' : t.status === "vencido" ? `<span class="pill bad">Vencido · ${t.atraso}d</span>` : `<span class="pill info">Vence ${fd(t.venc)}</span>`;

/* ---- Notas fiscais do pedido ---- */
const nfAtiva = n => n.status === "autorizado" || n.status === "processando";
const nfsPedido = oid => S.nf.filter(n => n.pedido === oid).sort((a, b) => String(b.emitida_em || "").localeCompare(String(a.emitida_em || "")));
function qtdNotada(oid, tipo) { const m = {}; nfsPedido(oid).filter(n => n.tipo === tipo && nfAtiva(n)).forEach(n => (n.itens || []).forEach(i => { m[i.ix] = (m[i.ix] || 0) + i.q; })); return m; }
const nfStatusPill = n => ({ autorizado: '<span class="pill ok">Autorizada</span>', processando: '<span class="pill info">Processando</span>', erro: '<span class="pill bad">Rejeitada</span>', cancelado: '<span class="pill mute">Cancelada</span>', denegado: '<span class="pill bad">Denegada</span>' }[n.status] || `<span class="pill mute">${esc(n.status)}</span>`);
/* ================= Dados de demonstração ================= */
function demoSeed() {
  let s = 11; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const D = n => isoD(dayOff(n)), T = (n, h, m) => isoT(dayOff(n, h, m));
  const pr = (id, nome, tipo, uva, regiao, pais, safra, vol, custo, pv, pa, prt, est, min, forn, ean, extra) => Object.assign({ id, nome, tipo, uva, regiao, pais, safra, vol, custo, precos: { varejo: pv, atacado: pa, restaurante: prt }, estoque: est, min, forn, ean, ativo: true, loc: "" }, extra || {});
  const prod = [
    pr("p1", "Vale Alto Reserva", "tinto", "Malbec", "Mendoza", "Argentina", "2021", 750, 52, 89, 74, 79, 48, 24, "f1", "7790001000011", { produtor: "Bodega Vale Alto", teor: "13,5%", temp: "16 a 18 °C", harmon: "Carnes vermelhas e churrasco", loc: "Rua A · prat. 1" }),
    pr("p2", "Serra Fria Chardonnay", "branco", "Chardonnay", "Serra Gaúcha", "Brasil", "2023", 750, 38, 72, 60, 64, 30, 12, "f2", "7890002000028", { produtor: "Vinícola Serra Fria", teor: "12,5%", temp: "8 a 10 °C", harmon: "Peixes e massas com molho branco", loc: "Rua B · prat. 2" }),
    pr("p3", "Encosta Norte Gran Reserva", "tinto", "Tempranillo", "Rioja", "Espanha", "2018", 750, 118, 189, 165, 172, 8, 12, "f3", "8410003000035", { produtor: "Bodegas Encosta Norte", teor: "14%", temp: "17 a 18 °C", harmon: "Cordeiro e queijos curados", loc: "Rua A · prat. 3" }),
    pr("p4", "Brisa do Sul Rosé", "rose", "Pinot Noir", "Campanha Gaúcha", "Brasil", "2024", 750, 33, 64, 52, 56, 0, 12, "f2", "7890004000042", { produtor: "Vinícola Brisa do Sul", teor: "12%", temp: "8 a 10 °C", harmon: "Saladas e frutos do mar" }),
    pr("p5", "Cuvée Pedra Branca Brut", "espumante", "Chardonnay e Pinot Noir", "Serra Gaúcha", "Brasil", "NV", 750, 54, 98, 82, 88, 36, 18, "f2", "7890005000059", { produtor: "Casa Pedra Branca", teor: "12%", temp: "6 a 8 °C", harmon: "Entradas e frituras", loc: "Câmara fria" }),
    pr("p6", "Terra Antiga Carménère", "tinto", "Carménère", "Colchagua", "Chile", "2022", 750, 41, 79, 65, 70, 60, 24, "f1", "7800006000066", { produtor: "Viña Terra Antiga", teor: "13,5%", temp: "16 a 18 °C", harmon: "Massas e carnes grelhadas" }),
    pr("p7", "Monte Douro Tinto", "tinto", "Touriga Nacional", "Douro", "Portugal", "2020", 750, 82, 135, 115, 122, 18, 12, "f3", "5600007000073", { produtor: "Quinta Monte Douro", teor: "14%", temp: "16 a 18 °C", harmon: "Bacalhau e carnes assadas" }),
    pr("p8", "Aurora Tardia", "sobremesa", "Moscato", "Serra Gaúcha", "Brasil", "2022", 500, 66, 115, 96, 104, 10, 6, "f2", "7890008000080", { produtor: "Vinícola Aurora Tardia", teor: "11%", temp: "6 a 8 °C", harmon: "Sobremesas e queijo azul" }),
    pr("p9", "Costa Atlântica Alvarinho", "branco", "Alvarinho", "Vinho Verde", "Portugal", "2023", 750, 55, 92, 78, 84, 11, 12, "f3", "5600009000097", { produtor: "Costa Atlântica", teor: "12,5%", temp: "8 a 10 °C", harmon: "Frutos do mar" }),
    pr("p10", "Quinta do Rio Tawny 10 anos", "fortificado", "Blend do Douro", "Porto", "Portugal", "NV", 750, 140, 229, 199, 210, 7, 4, "f3", "5600010000103", { produtor: "Quinta do Rio", teor: "20%", temp: "14 a 16 °C", harmon: "Chocolate e castanhas" }),
    pr("p11", "Colline Chianti Classico", "tinto", "Sangiovese", "Toscana", "Itália", "2021", 750, 78, 129, 110, 118, 22, 12, "f4", "8000011000110", { produtor: "Colline Toscane", teor: "13,5%", temp: "16 a 18 °C", harmon: "Massas ao sugo e pizza" }),
    pr("p12", "Saca-rolhas sommelier", "outros", "", "", "", "", 0, 18, 45, 32, 38, 25, 10, "f4", "7890012000127", {})
  ];
  prod.forEach(p => { p.ncm = NCM_SUG[p.tipo] || ""; p.origem = p.pais && p.pais !== "Brasil" ? "2" : "0"; p.cest = ""; p.st = false; });
  const forn = [
    { id: "f1", nome: "Importadora Andes Vinhos", doc: "11.111.111/0001-11", contato: "Ricardo", fone: "", email: "", prazo: 30, obs: "Argentina e Chile" },
    { id: "f2", nome: "Serra Gaúcha Distribuição", doc: "22.222.222/0001-22", contato: "Juliana", fone: "", email: "", prazo: 28, obs: "Vinhos e espumantes nacionais" },
    { id: "f3", nome: "Ibérica Importadora", doc: "33.333.333/0001-33", contato: "Paulo", fone: "", email: "", prazo: 45, obs: "Portugal e Espanha" },
    { id: "f4", nome: "Mondo Vino Importadora", doc: "44.444.444/0001-44", contato: "Giulia", fone: "", email: "", prazo: 30, obs: "Itália e acessórios" }
  ];
  const cli = [
    { id: "c1", nome: "Trattoria Bella Vista", razao: "Bella Vista Gastronomia Ltda", doc: "12.345.678/0001-90", tipo: "Restaurante", contato: "Giovanni", fone: "", email: "", cidade: "Joinville", tabela: "restaurante", limite: 6000, obs: "Entrega às terças" },
    { id: "c2", nome: "Bistrô Maré", razao: "Maré Bistrô ME", doc: "23.456.789/0001-01", tipo: "Restaurante", contato: "Helena", fone: "", email: "", cidade: "Joinville", tabela: "restaurante", limite: 4000, obs: "" },
    { id: "c3", nome: "Hotel Mirante da Serra", razao: "Mirante Hotelaria S.A.", doc: "34.567.890/0001-12", tipo: "Hotel", contato: "Sr. Augusto", fone: "", email: "", cidade: "São Bento do Sul", tabela: "atacado", limite: 10000, obs: "Pedido mínimo 24 garrafas" },
    { id: "c4", nome: "Bar do Porto", razao: "Porto Bar e Petiscaria Ltda", doc: "45.678.901/0001-23", tipo: "Bar", contato: "Léo", fone: "", email: "", cidade: "São Francisco do Sul", tabela: "restaurante", limite: 3000, obs: "" },
    { id: "c5", nome: "Empório Sabor & Cia", razao: "Sabor e Cia Comércio Ltda", doc: "56.789.012/0001-34", tipo: "Empório", contato: "Fernanda", fone: "", email: "", cidade: "Jaraguá do Sul", tabela: "atacado", limite: 8000, obs: "" },
    { id: "c6", nome: "Mariana Costa", razao: "", doc: "", tipo: "Pessoa física", contato: "", fone: "", email: "", cidade: "Joinville", tabela: "varejo", limite: 0, obs: "Cliente do clube de degustação" }
  ];
  const mem = [
    { id: "demo-admin", nome: "Paula Martins", papel: "admin", comissao: 0, entrou: T(-120, 9, 0) },
    { id: "demo-carla", nome: "Carla Souza", papel: "vendedor", comissao: 3, entrou: T(-110, 9, 0) },
    { id: "demo-marcos", nome: "Marcos Lima", papel: "estoque", comissao: 0, entrou: T(-100, 9, 0) }
  ];
  const vendedores = ["demo-admin", "demo-carla", "demo-carla"];
  const mov = [];
  const gen = [];
  for (let k = 0; k < 34; k++) {
    const ago = 1 + Math.floor(rnd() * 115), c = pick(cli.slice(0, 6)), tipo = k % 7 === 3 ? "consig" : "venda";
    const n = 1 + Math.floor(rnd() * 3), itens = [], used = new Set();
    for (let j = 0; j < n; j++) {
      const p = pick(prod.slice(0, 11)); if (used.has(p.id)) continue; used.add(p.id);
      const q = c.tipo === CLI_TIPOS[5] ? pick([1, 2, 3]) : pick([6, 6, 12, 12, 24]);
      const it = { p: p.id, q, preco: preco(p, c.tabela), custo: p.custo, vend: 0, dev: 0 };
      if (tipo === "consig") { it.vend = ago > 20 ? Math.floor(q * (0.4 + rnd() * 0.5)) : Math.floor(q * rnd() * 0.4); it.dev = ago > 40 ? q - it.vend : 0; }
      itens.push(it);
    }
    gen.push({ ago, c, tipo, itens, cond: c.tipo === CLI_TIPOS[5] ? "0" : pick(["0", "15", "30", "30", "30-60"]), vend: pick(vendedores), descPct: rnd() < 0.2 ? 0.05 : 0 });
  }
  gen.push({ ago: 12, c: cli[0], tipo: "consig", itens: [{ p: "p3", q: 6, preco: 172, custo: 118, vend: 2, dev: 0 }, { p: "p7", q: 6, preco: 122, custo: 82, vend: 1, dev: 0 }], cond: "0", vend: "demo-admin", descPct: 0 });
  gen.push({ ago: 25, c: cli[1], tipo: "venda", itens: [{ p: "p5", q: 12, preco: 88, custo: 54 }], cond: "15", vend: "demo-carla", descPct: 0, unpaid: true });
  gen.sort((a, b) => b.ago - a.ago);
  const ped = gen.map((g, ix) => {
    const data = D(-g.ago), id = "o" + (ix + 1), numero = 1001 + ix;
    const o = { id, num: numero, tipo: g.tipo, status: "aberto", cli: g.c.id, data, tabela: g.c.tabela, itens: g.itens, vendedor: g.vend, pag: [], obs: "", criadoEm: T(-g.ago, 10, 0) };
    if (g.tipo === "consig") { o.venc = addDays(data, 30); o.desc = 0; }
    else { const bruto = sum(g.itens, i => i.q * i.preco); o.desc = r2(bruto * g.descPct); o.cond = g.cond; o.parc = makeParcelas(r2(bruto - o.desc), g.cond, data); }
    const c = pedCalc(o);
    if (!g.unpaid) c.parcelas.forEach(p => { if (p.venc < addDays(today, -6) && rnd() < 0.82) o.pag.push({ data: addDays(p.venc, Math.floor(rnd() * 4)) + "T15:00:00", valor: p.valor, forma: pick(FORMAS), por: g.vend }); else if (p.venc <= today && g.cond === "0") o.pag.push({ data: data + "T16:00:00", valor: p.valor, forma: "Pix", por: g.vend }); });
    mov.push({ id: "m" + id, ts: data + "T" + pad(9 + ix % 8) + ":" + pad((ix * 7) % 60) + ":00", k: g.tipo === "consig" ? "consig" : "venda", txt: `${g.tipo === "consig" ? "Consignação" : "Venda"} #${numero} · ${g.c.nome} · ${fmt(g.tipo === "consig" ? sum(g.itens, i => i.q * i.preco) : c.total)}`, por: g.vend, ref: id, ps: g.itens.map(i => i.p) });
    o.pag.forEach((p, j) => mov.push({ id: "m" + id + "p" + j, ts: p.data, k: "fin", txt: `Recebimento ${fmt(p.valor)} · ${g.c.nome} · pedido #${numero} · ${p.forma}`, por: p.por, ref: id }));
    return o;
  });
  ped.push({ id: "o90", num: 1001 + ped.length, tipo: "orcamento", status: "orcamento", cli: "c5", data: D(-2), tabela: "atacado", itens: [{ p: "p10", q: 6, preco: 199, custo: 140 }, { p: "p11", q: 12, preco: 110, custo: 78 }], vendedor: "demo-carla", pag: [], desc: 0, cond: "30", obs: "Validade 7 dias", criadoEm: T(-2, 11, 0) });
  mov.push({ id: "mo90", ts: T(-2, 11, 0), k: "venda", txt: `Orçamento #${1001 + ped.length - 1} · Empório Sabor & Cia · ${fmt(6 * 199 + 12 * 110)}`, por: "demo-carla", ref: "o90" });
  const comp = [
    { id: "k1", num: 501, forn: "f4", data: D(-70), prev: D(-62), status: "recebido", recebidoEm: D(-63), cond: "30", itens: [{ p: "p11", q: 24, custo: 78 }, { p: "p12", q: 30, custo: 18 }], pag: [], obs: "" },
    { id: "k2", num: 502, forn: "f3", data: D(-52), prev: D(-45), status: "recebido", recebidoEm: D(-50), cond: "30-60", itens: [{ p: "p7", q: 24, custo: 82 }, { p: "p9", q: 24, custo: 55 }], pag: [], obs: "" },
    { id: "k3", num: 503, forn: "f1", data: D(-22), prev: D(-16), status: "recebido", recebidoEm: D(-18), cond: "30", itens: [{ p: "p1", q: 60, custo: 52 }], pag: [], obs: "NF 4821" },
    { id: "k4", num: 504, forn: "f2", data: D(-3), prev: D(4), status: "pedido", cond: "30", itens: [{ p: "p4", q: 36, custo: 33 }, { p: "p2", q: 24, custo: 38 }], pag: [], obs: "Reposição do rosé" }
  ];
  comp.forEach(c => {
    if (c.status === "recebido") c.parc = makeParcelas(r2(sum(c.itens, i => i.q * i.custo)), c.cond, c.recebidoEm);
    (c.parc || []).forEach(p => { if (p.venc < today) c.pag.push({ data: p.venc + "T10:00:00", valor: p.valor, forma: "Boleto", por: "demo-admin" }); });
    const fo = forn.find(f => f.id === c.forn);
    mov.push({ id: "mk" + c.id, ts: c.data + "T08:30:00", k: "compra", txt: `Pedido de compra #${c.num} · ${fo.nome} · ${fmt(sum(c.itens, i => i.q * i.custo))}`, por: "demo-marcos", ref: c.id });
    if (c.status === "recebido") mov.push({ id: "mr" + c.id, ts: c.recebidoEm + "T09:15:00", k: "estoque", txt: `Mercadoria recebida · compra #${c.num} · ${sum(c.itens, i => i.q)} un.`, por: "demo-marcos", ref: c.id, ps: c.itens.map(i => i.p) });
  });
  const fin = [
    { id: "d1", tipo: "pagar", desc: "Aluguel da loja", cat: "Aluguel", valor: 3500, venc: D(-26), data: D(-30), pag: [{ data: D(-27) + "T10:00:00", valor: 3500, forma: "Boleto", por: "demo-admin" }] },
    { id: "d2", tipo: "pagar", desc: "Aluguel da loja", cat: "Aluguel", valor: 3500, venc: D(4), data: D(-1), pag: [] },
    { id: "d3", tipo: "pagar", desc: "Conta de energia", cat: "Energia e água", valor: 480, venc: D(-3), data: D(-12), pag: [] },
    { id: "d4", tipo: "pagar", desc: "Folha de pagamento", cat: "Salários", valor: 6200, venc: D(5), data: D(-2), pag: [] },
    { id: "d5", tipo: "pagar", desc: "Anúncios Instagram", cat: "Marketing", valor: 300, venc: D(-12), data: D(-15), pag: [{ data: D(-12) + "T09:00:00", valor: 300, forma: "Cartão", por: "demo-admin" }] },
    { id: "d6", tipo: "receber", desc: "Degustação harmonizada (evento)", cat: "Eventos", valor: 1200, venc: D(6), data: D(-4), pag: [] }
  ];
  mov.push(
    { id: "ms1", ts: T(-3, 19, 5), k: "estoque", txt: "Baixa por quebra · Terra Antiga Carménère · −1", por: "demo-marcos", ps: ["p6"] },
    { id: "ms2", ts: T(-2, 16, 0), k: "estoque", txt: "Baixa por degustação · Cuvée Pedra Branca Brut · −1", por: "demo-carla", ps: ["p5"] },
    { id: "ms3", ts: T(-1, 18, 40), k: "estoque", txt: "Contagem · Costa Atlântica Alvarinho · sistema 12, contado 11", por: "demo-marcos", ps: ["p9"] }
  );
  cli.forEach((c, i) => Object.assign(c, { logradouro: ["Rua das Palmeiras", "Av. Beira Mar", "Rua do Mirante", "Rua do Porto", "Rua XV de Novembro", "Rua Blumenau"][i], numero: String(100 + i * 37), bairro: "Centro", cep: "89201000", uf: "SC", ie: c.tipo === CLI_TIPOS[5] ? "" : "", indIE: "9" }));
  const emp = { id: "demo", nome: "Adega Demonstração", cnpj: "00.000.000/0001-00", cidade: "Joinville, SC", fone: "", codigo: "DEMO24", criadoPor: "demo-admin", criadoEm: T(-120, 9, 0),
    fiscal: { razao: "Adega Demonstração Ltda", ie: "250000000", regime: "1", logradouro: "Rua Princesa Isabel", numero: "500", bairro: "Centro", municipio: "Joinville", uf: "SC", cep: "89201270", csosn: "102", csosnST: "500", cst: "00", cstST: "60", pisCofins: "99", presenca: "1", natVenda: "Venda de mercadoria", info: "" } };
  return { emp, prod, cli, forn, ped, comp, fin, mov, mem, nf: [] };
}

/* ================= Infra de interface ================= */
const ui = {
  route: "entrada", id: null, stack: [], sheet: null, draft: null, cdraft: null, inv: {}, invEid: null, invModo: "geral", invF: "todos", invQ: "", movP: "", movPer: "d90", movT: "todos", movRemoto: null,
  q: "", fTipo: "todos", vq: "", vFiltro: "todos", cq: "", cFiltro: "todos", kFiltro: "abertas",
  finTab: "receber", finFiltro: "abertos", relTab: "vendas", per: "mes", actF: "tudo", actU: "todos", impTipo: "prod", impTxt: ""
};
let rq = false, pendingRender = false;
function isTyping() { const a = document.activeElement; return !!a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName) && a.type !== "file" && a.type !== "checkbox"; }
function scheduleRender() {
  if (rq) return; rq = true;
  requestAnimationFrame(() => { rq = false; if (isTyping()) { pendingRender = true; return; } renderAll(); });
}
document.addEventListener("focusout", () => setTimeout(() => { if (pendingRender && !isTyping()) { pendingRender = false; renderAll(); } }, 60));
function renderAll() { render(); if (ui.sheet) renderSheet(); }
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2800); }

const I = {
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 9v6M10 9v6M13 9v6M17 9v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  receipt: '<path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  bottle: '<path d="M10 2h4v5c0 1.6 3 2.6 3 6.2V21a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-7.8C7 9.6 10 8.6 10 7z"/><path d="M7 15h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  box: '<path d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  order: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/>',
  wallet: '<path d="M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h5l3 3v3h-8"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  building: '<path d="M4 21V5l8-3v19M12 9h8v12M8 8v.01M8 12v.01M8 16v.01M16 13v.01M16 17v.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>', download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>', check: '<path d="M5 12l5 5 9-10"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>', clip: '<path d="M9 5h6M9 3h6v4H9zM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8 12h8M8 16h5"/>',
  wine: '<path d="M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v7M8 21h8"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', whats: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.2 4 4.4 4.6l1-1.1 1.8.8-.5 1.4c-3.4.3-6.8-3-6.6-6.4l1.4-.5.8 1.8z"/>'
};
const ico = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
function bottle(type) {
  const t = catDe(type), c = t.c;
  if (!ehVinho() || !(VINHO_IDS.includes(t.id) || t.id === "outros")) { const ini = esc((t.l || "?").trim().charAt(0).toUpperCase()); return `<svg viewBox="0 0 24 64" aria-hidden="true"><rect x="1" y="20" width="22" height="24" rx="7" fill="${c}"/><text x="12" y="36.5" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui,sans-serif" fill="#fff">${ini}</text></svg>`; }
  type = t.id;
  if (type === "outros") return `<svg viewBox="0 0 24 64" aria-hidden="true"><rect x="4" y="18" width="16" height="30" rx="4" fill="${c}" opacity=".85"/><rect x="10" y="8" width="4" height="12" rx="2" fill="${c}"/><circle cx="12" cy="33" r="4" fill="#fff" opacity=".85"/></svg>`;
  const top = type === "espumante" ? '<rect x="8.6" y="1" width="6.8" height="10" rx="1.2" fill="#b38d36"/>' : `<rect x="9" y="1" width="6" height="4" rx="1" fill="${c}" opacity=".65"/>`;
  return `<svg viewBox="0 0 24 64" aria-hidden="true"><path d="M9 4h6v14c0 4 5 6 5 12v30a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V30c0-6 5-8 5-12z" fill="${c}"/>${top}<rect x="6.5" y="37" width="11" height="13" rx="1.5" fill="#fff" opacity=".9"/><rect x="8.5" y="41" width="7" height="1.4" rx=".7" fill="${c}" opacity=".7"/></svg>`;
}
function empty(t, s, btn) { return `<div class="empty"><b>${t}</b>${s || ""}${btn ? `<div style="margin-top:12px">${btn}</div>` : ""}</div>`; }

/* ---- Formulários ---- */
function fieldHtml(f, vals, at = "f") {
  const v = vals[f.k] == null ? "" : vals[f.k];
  // valor salvo que não está na lista (ex.: cadastrado em outro idioma) continua como opção, para não ser trocado sem querer
  if (f.t === "select") return `<label class="field">${f.l}<select data-${at}="${f.k}">${(v !== "" && !f.opts.some(o => String(o[0]) === String(v)) ? [[v, v], ...f.opts] : f.opts).map(([val, lab]) => `<option value="${esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select></label>`;
  if (f.t === "textarea") return `<label class="field">${f.l}<textarea data-${at}="${f.k}" placeholder="${esc(f.ph || "")}">${esc(v)}</textarea></label>`;
  const attrs = { num: 'type="number" inputmode="numeric" min="0"', money: 'inputmode="decimal"', email: 'type="email" inputmode="email"', tel: 'type="tel" inputmode="tel"', date: 'type="date"', code: 'autocapitalize="characters" autocomplete="off"' }[f.t] || "";
  const scan = f.scan ? `<button class="btn ghost" type="button" data-a="scanField" data-id="${f.k}" aria-label="Ler código de barras">${ico("scan", 18)}</button>` : "";
  const input = `<input data-${at}="${f.k}" value="${esc(v)}" ${attrs} placeholder="${esc(f.ph || "")}">`;
  return scan ? `<div class="field">${f.l}<div class="inline-scan">${input}${scan}</div></div>` : `<label class="field">${f.l}${input}</label>`;
}
function formHtml(spec, vals, at = "f") {
  let h = "", half = [];
  const flush = () => { if (half.length) { h += `<div class="grid2">${half.join("")}</div>`; half = []; } };
  spec.forEach(f => { if (f.sec) { flush(); h += `<p class="sec">${f.sec}</p>`; return; } if (f.h) { half.push(fieldHtml(f, vals, at)); if (half.length === 2) flush(); } else { flush(); h += fieldHtml(f, vals, at); } });
  flush(); return h;
}

/* ---- Exportação ---- */
function csv(rows) { return "﻿" + rows.map(r => r.map(c => { const s = String(c == null ? "" : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";")).join("\n"); }
async function saveFile(filename, text) { return Platform.saveFile(filename, text); }
function parseCSV(txt) {
  let lines = txt.replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length && /^sep=.$/i.test(lines[0].trim())) lines = lines.slice(1); // linha "sep=;" do Excel
  if (!lines.length) return [];
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ";" : ",";
  const split = l => { const out = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0]).map(h => norm(h).replace(/[\s.-]+/g, "_").replace(/^_|_$/g, ""));
  return lines.slice(1).map(l => { const v = split(l), o = {}; head.forEach((h, i) => { o[h] = v[i] || ""; }); return o; });
}

/* ================= Tema claro/escuro ================= */
function temaAtual() { try { return localStorage.getItem("decanta-tema") || "auto"; } catch (e) { return "auto"; } }
function applyTheme() {
  const t = temaAtual(), root = document.documentElement;
  if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
  const dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", dark ? "#11131C" : "#F2F2ED");
  Platform.statusBar(dark);
}
function setTheme(t) { try { localStorage.setItem("decanta-tema", t); } catch (e) {} applyTheme(); renderAll(); }
const isDark = () => document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (temaAtual() === "auto") applyTheme(); });

/* ================= Plataforma (Android nativo ou navegador) ================= */
const Platform = {
  native: !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()),
  N: () => window.DecantaNative || {},
  init() {
    const N = this.N();
    if (this.native && N.App) N.App.addListener("backButton", () => {
      if (Scanner.active) { Scanner.stop(); return; }
      if (ui.sheet) { if (ui.sheet.back) { ui.sheet = ui.sheet.back; renderSheet(); } else closeSheet(); return; }
      if (ui.stack.length) { back(); return; }
      if (ui.route !== "inicio" && MODE) { goTab("inicio"); return; }
      N.App.exitApp();
    });
    if (this.native && N.App) N.App.addListener("resume", () => { this.statusBar(isDark()); if (MODE === "supa") SupaBE.reload(); });
    // A cor da barra de status aplicada antes da splash sumir pode se perder: reaplica depois
    if (this.native && N.SplashScreen) setTimeout(() => { Promise.resolve().then(() => N.SplashScreen.hide()).catch(() => {}).then(() => setTimeout(() => this.statusBar(isDark()), 250)); }, 300);
    else this.statusBar(isDark());
  },
  statusBar(dark) {
    const N = this.N(); if (!this.native || !N.StatusBar) return;
    const quiet = (f) => Promise.resolve().then(f).catch(() => {});
    const cor = dark ? "#11131C" : "#F2F2ED";
    quiet(() => N.StatusBar.setBackgroundColor({ color: cor })).then(() => quiet(() => N.StatusBar.setStyle({ style: dark ? "DARK" : "LIGHT" })));
    if (N.DecantaBars) quiet(() => N.DecantaBars.setNavigationBar({ color: cor, light: !dark }));
  },
  async openUrl(url) { const N = this.N(); if (this.native && N.Browser) { try { await N.Browser.open({ url }); return; } catch (e) {} } window.open(url, "_blank", "noopener"); },
  async saveFile(filename, text) {
    const N = this.N();
    if (this.native && N.Filesystem && N.Share) {
      try {
        const r = await N.Filesystem.writeFile({ path: filename, data: text, directory: "CACHE", encoding: "utf8" });
        await N.Share.share({ title: filename, files: [r.uri], dialogTitle: "Salvar ou enviar arquivo" }); return;
      } catch (e) { if (/cancel/i.test(String(e && e.message))) return; }
    }
    try {
      const cl = window.claude, dl = cl && cl.use ? await cl.use("downloads") : null;
      if (dl) { await dl.save({ filename, data: text }); return; }
    } catch (e) { if (e && /declin|cancel/i.test(String(e.code || e.message))) return; }
    try {
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      if (!window.claude) return;
    } catch (e) {}
    try { await navigator.clipboard.writeText(text.replace(/^\ufeff/, "")); toast("Arquivo copiado. Cole em uma planilha."); }
    catch (e) { toast("Não foi possível exportar neste aparelho."); }
  },
  // Arquivo binário (bin = string com um byte por caractere, ex.: PDF)
  async saveBytes(filename, bin, mime) {
    const N = this.N();
    if (this.native && N.Filesystem && N.Share) {
      try {
        const r = await N.Filesystem.writeFile({ path: filename, data: btoa(bin), directory: "CACHE" });
        await N.Share.share({ title: filename, files: [r.uri], dialogTitle: "Enviar arquivo" }); return true;
      } catch (e) { if (/cancel/i.test(String(e && e.message))) return true; }
    }
    const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 255;
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    try { const f = new File([blob], filename, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: filename }); return true; } } catch (e) { if (e && e.name === "AbortError") return true; }
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.__ultimoArquivo = { filename, size: bytes.length }; return true; }
    catch (e) { toast("Não foi possível gerar o arquivo neste aparelho."); return false; }
  },
  async share(text) {
    const N = this.N();
    if (this.native && N.Share) { try { await N.Share.share({ text }); return true; } catch (e) { return /cancel/i.test(String(e && e.message)); } }
    if (navigator.share) { try { await navigator.share({ text }); return true; } catch (e) { return true; } }
    return false;
  }
};

/* ================= Leitor de código de barras ================= */
const Scanner = {
  active: false, stream: null, loop: null,
  canCamera() { return (Platform.native && Platform.N().BarcodeScanner) || ("BarcodeDetector" in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); },
  async scan() {
    const N = Platform.N();
    if (Platform.native && N.BarcodeScanner) {
      const BS = N.BarcodeScanner;
      try {
        const { available } = await BS.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          toast("Instalando o leitor de códigos (só na primeira vez)…");
          await new Promise((res, rej) => {
            let h; const t = setTimeout(() => rej(new Error("tempo")), 60000);
            BS.addListener("googleBarcodeScannerModuleInstallProgress", ev => { if (ev.state === 4 || ev.state === "COMPLETED") { clearTimeout(t); if (h) h.remove(); res(); } if (ev.state === 5 || ev.state === 3 || ev.state === "FAILED" || ev.state === "CANCELED") { clearTimeout(t); rej(new Error("falha")); } }).then(x => { h = x; });
            BS.installGoogleBarcodeScannerModule().catch(rej);
          });
        }
        const r = await BS.scan();
        return r && r.barcodes && r.barcodes[0] ? String(r.barcodes[0].rawValue || r.barcodes[0].displayValue || "") : null;
      } catch (e) {
        if (/cancel/i.test(String(e && e.message))) return null;
        Erros.enviar("leitor", "nativo: " + String((e && e.message) || e), e && e.stack);
        toast("Não foi possível abrir o leitor. Digite o código."); return this.manual();
      }
    }
    if (!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { toast("Este aparelho não permite usar a câmera aqui. Digite o código ou use um leitor USB."); return this.manual(); }
    const motivo = await this.webSuportado();
    if (motivo) { toast(motivo); return this.manual(); }
    try { return await this.webScan(); }
    catch (e) {
      const n = String((e && (e.name || e.message)) || e);
      if (/NotAllowed|Permission|Security/i.test(n)) toast("Permita o acesso à câmera nas configurações do navegador para ler códigos.");
      else if (/NotFound|Overconstrained|NotReadable/i.test(n)) toast("Câmera não encontrada ou em uso por outro app. Digite o código.");
      else { toast("Não foi possível abrir a câmera. Digite o código."); Erros.enviar("leitor", "web: " + n, e && e.stack); }
      return this.manual();
    }
  },
  /* Navegador: só abre a câmera se ele souber ler os formatos de produto (iPhone/Safari e Firefox ainda não sabem) */
  async webSuportado() {
    const nao = "Este navegador não lê códigos pela câmera (iPhone e Firefox ainda não têm essa função). Digite o código ou use um leitor USB ou Bluetooth.";
    if (!("BarcodeDetector" in window)) return nao;
    try {
      const f = window.BarcodeDetector.getSupportedFormats ? await window.BarcodeDetector.getSupportedFormats() : null;
      if (f && !f.some(x => /ean_13|ean_8|upc_a|code_128/.test(x))) return nao;
      this._formatos = f ? ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"].filter(x => f.includes(x)) : null;
    } catch (e) {}
    return "";
  },
  webScan() {
    return new Promise(async (resolve, reject) => {
      let det; try { det = new window.BarcodeDetector({ formats: this._formatos && this._formatos.length ? this._formatos : ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"] }); } catch (e) { return reject(e); }
      let stream; try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); } catch (e) { return reject(e); }
      this.active = true; this.stream = stream;
      const ov = $("scanner"); ov.hidden = false; const v = $("scanVideo"); v.srcObject = stream; v.play().catch(() => {}); // não espera: em alguns aparelhos o play() demora e travaria o leitor
      this._resolve = resolve;
      const tick = async () => {
        if (!this.active) return;
        try { const r = await det.detect(v); if (r && r[0] && r[0].rawValue) { const code = r[0].rawValue; this._resolve = null; this.stop(); if (navigator.vibrate) navigator.vibrate(60); resolve(code); return; } /* stop() devolveria null antes do código */ } catch (e) {}
        this.loop = setTimeout(tick, 180);
      };
      tick();
    });
  },
  stop() {
    this.active = false; clearTimeout(this.loop);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null;
    const ov = $("scanner"); if (ov) ov.hidden = true;
    if (this._resolve) { const r = this._resolve; this._resolve = null; r(null); }
  },
  manual() { return new Promise(res => { openSheet({ k: "codigoManual", vals: {}, resolve: res }, true); }); }
};
/* Leitores USB/Bluetooth funcionam como teclado: caracteres rápidos (até 100 ms entre eles; os Bluetooth são mais lentos)
   seguidos de Enter ou Tab. Só conta como código se for quase todo número, para não confundir com alguém digitando rápido. */
const pareceCodigo = b => /^\d{6,}$/.test(b) || (/^[0-9A-Za-z-]{8,}$/.test(b) && b.replace(/\D/g, "").length >= b.length * 0.6);
(() => {
  let buf = "", last = 0;
  document.addEventListener("keydown", e => {
    const now = Date.now();
    if (now - last > 100) buf = "";
    last = now;
    if (e.key === "Enter" || e.key === "Tab") {
      if (pareceCodigo(buf)) { const code = buf; buf = ""; const a = document.activeElement; if (a && a.tagName === "INPUT" && a.value.endsWith(code)) a.value = a.value.slice(0, -code.length); e.preventDefault(); onScan(code, "teclado"); }
      buf = ""; return;
    }
    if (e.key && e.key.length === 1) buf += e.key;
  }, true);
})();
/* Código de barras: compara sem espaços e sem zeros à esquerda, para que UPC-A (12 dígitos) e EAN-13 (13 dígitos com 0 na frente)
   do mesmo produto se reconheçam; o leitor do celular costuma devolver um formato e o cadastro ter o outro */
const eanNorm = code => { const s = String(code || "").replace(/\s+/g, "").trim(); return /^\d+$/.test(s) ? s.replace(/^0+/, "") : s.toUpperCase(); };
const byEan = code => { const c = eanNorm(code); return c ? S.prod.find(p => p.ean && eanNorm(p.ean) === c) : null; };

/* ---- backends.js ---- */
/* ================= Backends ================= */
/* Demonstração: tudo fica no aparelho */
const DemoBE = {
  put: async () => saveDemo(), del: async () => saveDemo(), patch: async () => saveDemo(), stock: async () => saveDemo(),
  appendPag: async () => saveDemo(), nextNum: async (serie, cur) => cur + 1, putEmp: async () => saveDemo(), putMem: async () => saveDemo(), delMem: async () => saveDemo()
};

/* Piloto no claude.ai: banco do artifact (window.claude) */
const ClaudeBE = {
  path: (c, id) => `e/${EID}/${c}/${id}`,
  put(c, id, doc) { return DB.doc(this.path(c, id)).set(doc); },
  del(c, id) { return DB.doc(this.path(c, id)).delete(); },
  patch(c, id, partial, merged) { return DB.doc(this.path(c, id)).set(merged); },
  stock(changes, docs) { return Promise.all(docs.map(d => { const x = clone(d); delete x.id; return DB.doc(this.path("prod", d.id)).set(x); })); },
  appendPag(c, id, entry, merged) { return DB.doc(this.path(c, id)).set(merged); },
  async nextNum(serie, cur) { return cur + 1; },
  putEmp(doc) { return DB.doc(`e/${EID}`).set(doc); },
  putMem(id, doc) { return DB.doc(this.path("mem", id)).set(doc); },
  delMem(id) { return DB.doc(this.path("mem", id)).delete(); },
  subscribe() {
    unsubscribeAll(); loadedCols = new Set(); loadState = "loading";
    const done = (c, snap) => { if (!snap.metadata || !snap.metadata.fromCache) loadedCols.add(c); if (loadedCols.size >= COLS.length + 1) { loadState = "ok"; clearTimeout(loadTimer); } };
    const fail = e => { clearTimeout(loadTimer); loadState = e && e.code === "revoked" ? "revogado" : "erro"; scheduleRender(); };
    COLS.forEach(c => {
      let q = DB.collection(`e/${EID}/${c}`);
      if (c === "mov") q = q.orderBy("ts", "desc").limit(400);
      unsubs.push(q.onSnapshot(snap => { S[c] = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); done(c, snap); scheduleRender(); }, fail));
    });
    unsubs.push(DB.doc(`e/${EID}`).onSnapshot(d => { S.emp = d.exists ? Object.assign({ id: d.id }, d.data()) : null; done("emp", d); scheduleRender(); }, fail));
    loadTimer = setTimeout(() => { if (loadState === "loading") { loadState = "slow"; scheduleRender(); } }, 10000);
  },
  async loadProfile() {
    try { const d = await DB.doc(`data/users/${UID}/perfil`).get(); const p = d.exists ? clone(d.data()) : {}; p.empresas = p.empresas || []; return p; }
    catch (e) { return { empresas: [] }; }
  },
  async saveProfile() { try { await DB.doc(`data/users/${REAL_UID}/perfil`).set(clone(PROFILE)); } catch (e) {} },
  open(eid) {
    MODE = "cloud"; EID = eid; resetState(); closeSheet(); ui.route = "inicio"; ui.stack = [];
    this.subscribe(); render();
    if (PROFILE && PROFILE.atual !== eid) { PROFILE.atual = eid; this.saveProfile(); }
  },
  async create(v) {
    let code = genCode();
    try { for (let i = 0; i < 3; i++) { const d = await DB.doc(`cod/${code}`).get(); if (!d.exists) break; code = genCode(); } } catch (e) {}
    const eid = rid(), now = isoT(new Date());
    await DB.doc(`e/${eid}`).set({ nome: v.nome, cnpj: v.cnpj || "", cidade: v.cidade || "", fone: v.fone || "", codigo: code, criadoPor: UID, criadoEm: now, fiscal: {}, rubro: RUBROS[v.rubro] ? v.rubro : "vinhos", pais: PAISES[v.pais] ? v.pais : "BR", ivaSomar: v.ivaSomar !== false });
    await DB.doc(`cod/${code}`).set({ eid, nome: v.nome });
    await DB.doc(`e/${eid}/mem/${UID}`).set({ nome: v.seuNome, papel: "admin", comissao: 0, entrou: now });
    PROFILE.empresas = PROFILE.empresas.filter(x => x.eid !== eid).concat([{ eid, nome: v.nome }]); PROFILE.atual = eid;
    await this.saveProfile();
    this.open(eid);
    logMov("equipe", `${v.seuNome} criou a empresa ${v.nome}`);
  },
  async join(code, nome) {
    const d = await DB.doc(`cod/${code}`).get();
    if (!d.exists) return "Código não encontrado. Confira com o administrador da empresa.";
    const { eid, nome: empNome } = d.data();
    const m = await DB.doc(`e/${eid}/mem/${UID}`).get();
    const novo = !m.exists;
    if (novo) await DB.doc(`e/${eid}/mem/${UID}`).set({ nome, papel: "vendedor", comissao: 0, entrou: isoT(new Date()) });
    PROFILE.empresas = PROFILE.empresas.filter(x => x.eid !== eid).concat([{ eid, nome: empNome }]); PROFILE.atual = eid;
    await this.saveProfile();
    this.open(eid);
    if (novo) logMov("equipe", `${nome} entrou na empresa como Vendedor`);
    return null;
  }
};
function genCode() { const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

/* App Android: Supabase (Postgres + login + funções no servidor) */
const SupaBE = {
  ok(r) { if (r && r.error) throw r.error; return r ? r.data : null; },
  async put(c, id, doc) {
    const row = { empresa_id: EID, colecao: c, id, dados: doc };
    this.ok(c === "mov" ? await SB.from("registros").insert(row) : await SB.from("registros").upsert(row, { onConflict: "empresa_id,colecao,id" }));
  },
  async del(c, id) { this.ok(await SB.from("registros").delete().match({ empresa_id: EID, colecao: c, id })); },
  async patch(c, id, partial) { this.ok(await SB.rpc("mesclar_registro", { p_empresa: EID, p_colecao: c, p_id: id, p_patch: partial })); },
  async stock(changes) { this.ok(await SB.rpc("ajustar_estoque", { p_empresa: EID, p_itens: changes.map(c => ({ id: c.id, delta: c.delta, custo_entrada: c.custoEntrada > 0 ? c.custoEntrada : null })) })); },
  async appendPag(c, id, entry) { this.ok(await SB.rpc("anexar_pagamento", { p_empresa: EID, p_colecao: c, p_id: id, p_pagamento: entry })); },
  async nextNum(serie, cur) { return Number(this.ok(await SB.rpc("proximo_numero", { p_empresa: EID, p_serie: serie, p_minimo: cur }))); },
  async putEmp(doc) {
    const dados = clone(doc); ["nome", "codigo", "plano", "teste_ate", "criadoEm", "criadoPor"].forEach(k => delete dados[k]);
    this.ok(await SB.from("empresas").update({ nome: doc.nome, dados }).eq("id", EID));
  },
  async putMem(id, doc) { this.ok(await SB.from("membros").update({ nome: doc.nome, papel: doc.papel, comissao: doc.comissao }).match({ empresa_id: EID, user_id: id })); },
  async delMem(id) { this.ok(await SB.from("membros").delete().match({ empresa_id: EID, user_id: id })); },
  mapEmp(r) { return Object.assign({}, r.dados || {}, { id: r.id, nome: r.nome, codigo: r.codigo, plano: r.plano, teste_ate: r.teste_ate, criadoEm: r.criado_em }); },
  mapMem(r) { return { id: r.user_id, nome: r.nome, papel: r.papel, comissao: Number(r.comissao) || 0, entrou: r.entrou }; },
  /* Carrega a empresa inteira. Usa uma cópia do id e um número de geração: se a pessoa sair ou trocar de empresa
     no meio (ou outra carga começar), esta carga para sem erro e não mistura dados de duas empresas. */
  async loadAll() {
    const eid = EID, gen = this._gen = (this._gen || 0) + 1;
    const vivo = () => { if (gen !== this._gen || EID !== eid) { const e = new Error("carga cancelada"); e.cancelado = true; throw e; } };
    if (!eid) vivo();
    const N = {};
    const emp = this.ok(await SB.from("empresas").select("*").eq("id", eid).maybeSingle()); vivo();
    N.emp = emp ? this.mapEmp(emp) : null;
    N.mem = (this.ok(await SB.from("membros").select("*").eq("empresa_id", eid)) || []).map(r => this.mapMem(r)); vivo();
    for (const c of COLS) {
      if (c === "mem") continue;
      if (c === "mov") { const rows = this.ok(await SB.from("registros").select("id,dados").eq("empresa_id", eid).eq("colecao", "mov").order("atualizado_em", { ascending: false }).limit(400)); vivo(); N.mov = rows.map(r => Object.assign({ id: r.id }, r.dados)); continue; }
      const out = [];
      for (let from = 0; ; from += 1000) {
        const rows = this.ok(await SB.from("registros").select("id,dados").eq("empresa_id", eid).eq("colecao", c).range(from, from + 999)); vivo();
        rows.forEach(r => out.push(Object.assign({ id: r.id }, r.dados)));
        if (rows.length < 1000) break;
      }
      N[c] = out;
    }
    vivo(); Object.assign(S, N);
  },
  cancelar() { this._gen = (this._gen || 0) + 1; },
  /* Relatório de movimentos: busca no servidor além dos 400 registros carregados na abertura */
  async movs(pid, desde) {
    let q = SB.from("registros").select("id,dados").eq("empresa_id", EID).eq("colecao", "mov");
    if (pid) q = q.contains("dados", { ps: [pid] });
    if (desde) q = q.gte("dados->>ts", desde);
    const rows = this.ok(await q.order("atualizado_em", { ascending: false }).limit(pid ? 2000 : 3000));
    return rows.map(r => Object.assign({ id: r.id }, r.dados));
  },
  subscribe() {
    unsubscribeAll();
    const ch = SB.channel("emp-" + EID)
      .on("postgres_changes", { event: "*", schema: "public", table: "registros", filter: `empresa_id=eq.${EID}` }, p => {
        if (p.eventType === "DELETE") { const o = p.old || {}; if (S[o.colecao]) S[o.colecao] = S[o.colecao].filter(x => x.id !== o.id); }
        else { const r = p.new; if (S[r.colecao]) { const o = Object.assign({ id: r.id }, r.dados), i = S[r.colecao].findIndex(x => x.id === r.id); if (i >= 0) S[r.colecao][i] = o; else S[r.colecao].push(o); } }
        scheduleRender();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "membros", filter: `empresa_id=eq.${EID}` }, async () => { S.mem = (this.ok(await SB.from("membros").select("*").eq("empresa_id", EID)) || []).map(r => this.mapMem(r)); scheduleRender(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "empresas", filter: `id=eq.${EID}` }, p => { S.emp = this.mapEmp(p.new); scheduleRender(); })
      .subscribe();
    unsubs.push(() => SB.removeChannel(ch));
  },
  async open(eid) {
    MODE = "supa"; EID = eid; resetState(); closeSheet(); ui.route = "inicio"; ui.stack = []; loadState = "loading"; render();
    PROFILE.atual = eid; savePrefs();
    try { await this.loadAll(); loadState = "ok"; this.subscribe(); Acesso.marcar(true); }
    catch (e) { if (e && e.cancelado) return; loadState = "erro"; Erros.enviar("carregar", (e && e.message) || String(e), e && e.stack); }
    render();
  },
  reload() { clearTimeout(this._rl); this._rl = setTimeout(async () => { if (MODE !== "supa" || !EID) return; try { await this.loadAll(); loadState = "ok"; Acesso.marcar(); } catch (e) { if (e && e.cancelado) return; loadState = "erro"; Erros.enviar("carregar", (e && e.message) || String(e), e && e.stack); } scheduleRender(); }, 400); },
  async empresas() { const rows = this.ok(await SB.from("empresas").select("id,nome").order("nome")); PROFILE = PROFILE || {}; PROFILE.empresas = (rows || []).map(r => ({ eid: r.id, nome: r.nome })); },
  async create(v) {
    const r = this.ok(await SB.rpc("criar_empresa", { p_nome: v.nome, p_dados: { cnpj: v.cnpj || "", cidade: v.cidade || "", fone: v.fone || "", fiscal: {}, rubro: RUBROS[v.rubro] ? v.rubro : "vinhos", pais: PAISES[v.pais] ? v.pais : "BR", ivaSomar: v.ivaSomar !== false }, p_seu_nome: v.seuNome }));
    await this.empresas(); await this.open(r.id);
    logMov("equipe", `${v.seuNome} criou a empresa ${v.nome}`);
  },
  async join(code, nome) {
    const res = await SB.rpc("entrar_empresa", { p_codigo: code, p_nome: nome });
    if (res.error) return /codigo/i.test(res.error.message) ? "Código não encontrado. Confira com o administrador da empresa." : res.error.message;
    await this.empresas(); await this.open(res.data.id);
    if (res.data.novo) logMov("equipe", `${nome} entrou na empresa como Vendedor`);
    return null;
  },
  async fn(body) {
    const { data, error } = await SB.functions.invoke("api", { body: Object.assign({ empresa_id: EID }, body) });
    if (error) {
      let msg = error.message, j = null; try { j = await error.context.json(); msg = j.erro || j.error || msg; } catch (e) {}
      const er = new Error(msg); if (j && j.codigo) { er.codigo = j.codigo; er.dados = j; } else Erros.enviar("servidor", msg, null, { acao: body && body.acao }); // erro de negócio não vai para o log
      throw er;
    }
    if (data && data.erro) { const er = new Error(data.erro); er.codigo = data.codigo; throw er; }
    return data;
  }
};
function openCompany(eid) { if (SB) SupaBE.open(eid); else ClaudeBE.open(eid); }
async function createCompany(v) { if (SB) return SupaBE.create(v); return ClaudeBE.create(v); }
async function joinCompany(code, nome) { if (SB) return SupaBE.join(code, nome); return ClaudeBE.join(code, nome); }

/* ---- Inicialização ---- */
/* Links da página de apresentação: app/#demo abre a demonstração, #criar a criação de conta, #termos os termos */
const LINK_ENTRADA = (location.hash || "").slice(1);
if (LINK_ENTRADA && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
function entradaPorLink() {
  if (LINK_ENTRADA === "termos") { ui.route = "termos"; render(); return; }
  if (MODE !== null) return;
  if (LINK_ENTRADA === "demo") startDemo();
  else if (LINK_ENTRADA === "criar" && ui.route === "login") { render(); if (ui.login) { ui.login.modo = "criar"; render(); } }
}
async function boot() {
  applyTheme(); textosShell(); Platform.init(); render();
  const CFG = window.DECANTA_CONFIG || {};
  if (CFG.supabaseUrl && CFG.supabaseAnonKey && window.DecantaNative && window.DecantaNative.createClient) { await bootSupa(CFG); return; }
  const cl = window.claude;
  if (!cl || typeof cl.use !== "function") { cloudState = "off"; render(); entradaPorLink(); return; }
  cloudState = "connecting"; render();
  try {
    const [db, user] = await Promise.all([cl.use("db"), cl.use("user")]);
    if (!db || !user) { cloudState = "off"; render(); return; }
    DB = db; USER = user;
    UID = await user.id(); REAL_UID = UID;
    if (!UID) { cloudState = "off"; render(); return; }
    try { const w = await Promise.resolve(user.can ? user.can("data.write") : null); if (w === false) CAN_WRITE = false; } catch (e) {}
    PROFILE = await ClaudeBE.loadProfile();
    cloudState = "on";
    if (MODE === null && PROFILE.atual && PROFILE.empresas.some(x => x.eid === PROFILE.atual)) ClaudeBE.open(PROFILE.atual);
    else render();
  } catch (e) { cloudState = "off"; render(); }
}
/* Rede do app: prazo máximo por chamada (uma conexão travada vira aviso de erro em vez de tela parada).
   O supabase-js 2.1xx já coordena a renovação da sessão sem trava, então não passamos a opção "lock". */
function fetchComPrazo(url, opts) {
  opts = opts || {};
  const prazo = /\/functions\/v1\//.test(String(url)) ? 90000 : 25000, ctl = new AbortController(), ext = opts.signal;
  if (ext) { if (ext.aborted) ctl.abort(); else ext.addEventListener("abort", () => ctl.abort(), { once: true }); }
  const tm = setTimeout(() => ctl.abort(), prazo);
  REDE.pend++;
  return fetch(url, Object.assign({}, opts, { signal: ctl.signal })).finally(() => { clearTimeout(tm); REDE.pend = Math.max(0, REDE.pend - 1); });
}
async function bootSupa(CFG) {
  cloudState = "connecting"; render();
  try {
    SB = window.DecantaNative.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }, global: { fetch: fetchComPrazo } });
    SB.auth.onAuthStateChange((ev, s) => { SESSION = s; if (ev === "SIGNED_OUT") { unsubscribeAll(); MODE = null; EID = null; resetState(); UID = REAL_UID = null; PROFILE = null; ui.route = "login"; closeSheet(); render(); } });
    const { data } = await SB.auth.getSession();
    cloudState = "on";
    if (!data.session) { ui.route = "login"; render(); entradaPorLink(); return; }
    await afterLogin(data.session);
  } catch (e) { cloudState = "off"; render(); }
}
async function afterLogin(session) {
  SESSION = session; UID = REAL_UID = session.user.id;
  PROFILE = { empresas: [] };
  try { await SupaBE.empresas(); } catch (e) {}
  let atual = ""; try { atual = localStorage.getItem("decanta-atual") || ""; } catch (e) {}
  if (MODE === null && atual && PROFILE.empresas.some(x => x.eid === atual)) await SupaBE.open(atual);
  else { ui.route = "entrada"; render(); }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && MODE === "supa") SupaBE.reload(); });

/* ---- views.js ---- */
/* ================= Telas ================= */
function head(title, eyebrow, o = {}) {
  return `<header class="top">${o.back ? `<button class="iconbtn" data-a="back" aria-label="Voltar">${ico("back", 20)}</button>` : ""}<div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}<h1 class="${o.sm ? "sm" : ""}">${title}</h1></div>${o.action || ""}</header>`;
}
/* Computador (mesmo critério do CSS): barra lateral completa, tabelas e telas em colunas. No celular nada muda. */
const DESK_MQ = window.matchMedia ? window.matchMedia("(min-width:1000px) and (min-height:520px)") : null;
const DESK = () => !!(DESK_MQ && DESK_MQ.matches);
if (DESK_MQ && DESK_MQ.addEventListener) DESK_MQ.addEventListener("change", () => { if (typeof renderAll === "function") renderAll(); });
/* Tabela do computador: cada linha usa o mesmo data-a da linha do celular */
const td = (v, cls) => `<td class="${cls || ""}">${v}</td>`;
const dtr = (attrs, cells, cls) => `<tr ${attrs} tabindex="0" class="${cls || ""}">${cells.join("")}</tr>`;
function dtable(cols, rows, vazio, cls) {
  if (!rows.length) return vazio;
  return `<div class="dtable ${cls || ""}"><table><thead><tr>${cols.map(c => `<th class="${c[1] || ""}">${c[0]}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}
document.addEventListener("keydown", e => { const t = e.target; if (e.key === "Enter" && t && t.tagName === "TR" && t.dataset.a) { e.preventDefault(); t.click(); } });
/* Busca e filtros na mesma linha no computador */
const toolbar = s => DESK() ? `<div class="toolbar">${s}</div>` : s;
/* Duas colunas no computador (principal + lateral); no celular, uma depois da outra */
const colunas = (main, aside, cls) => DESK() ? `<div class="split ${cls || ""}"><div class="col-main">${main}</div><aside class="col-side">${aside}</aside></div>` : main + aside;
function banners() {
  let h = "";
  if (MODE === "demo") h += `<div class="banner warn">Modo demonstração: dados de exemplo salvos só neste aparelho.</div>`;
  if (MODE === "cloud" && !CAN_WRITE) h += `<div class="banner warn">Somente leitura. Para editar, o dono do app precisa convidar você como Editor.</div>`;
  if ((MODE === "cloud" || MODE === "supa") && loadState === "loading") h += `<div class="banner info">Carregando dados da empresa…</div>`;
  if (MODE === "supa" && loadState === "erro") h += `<div class="banner bad">Sem conexão com o servidor. Os dados podem estar desatualizados; tente de novo em instantes.</div>`;
  if (MODE === "supa" && S.emp) {
    const dias = S.emp.teste_ate ? diffDays(today, S.emp.teste_ate) : 99;
    if (S.emp.plano === "bloqueado") h += `<div class="banner bad">Empresa bloqueada. Fale com o suporte do ${APP} para reativar.</div>`;
    if (S.emp.plano === "cancelado") h += `<div class="banner bad">Assinatura cancelada: os dados ficam só para consulta. Fale com o suporte do ${APP} para reativar.</div>`;
    else if (S.emp.plano === "teste" && dias < 0) h += `<div class="banner bad">O período de teste terminou. Os dados continuam visíveis, mas para registrar novas operações é preciso ativar o plano.</div>`;
    else if (S.emp.plano === "teste" && dias <= 7) h += `<div class="banner warn">Seu teste grátis termina ${dias === 0 ? "hoje" : `em ${dias} ${dias === 1 ? "dia" : "dias"}`}.</div>`;
  }
  if (MODE === "cloud" && loadState === "slow") h += `<div class="banner warn">Os dados ainda não carregaram por completo. Verifique a conexão; o que aparece pode estar desatualizado.</div>`;
  if (MODE === "cloud" && loadState === "erro") h += `<div class="banner bad">Não foi possível ler os dados agora. Feche e abra o app novamente.</div>`;
  return h;
}
const noPerm = () => head("Sem acesso", "", { back: true }) + empty("Seu papel não tem acesso a esta área.", "Peça ao administrador da empresa para ajustar suas permissões.");
const firstName = n => String(n || "").split(" ")[0];
const tipoPed = t => ({ venda: "Venda", consig: "Consignação", orcamento: "Orçamento" }[t]);
function inRange(d, r) { return d >= r[0] && d <= r[1]; }
function periodo(k) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  if (k === "mes") return [isoD(new Date(y, m, 1)), today, "Este mês"];
  if (k === "mesAnt") return [isoD(new Date(y, m - 1, 1)), isoD(new Date(y, m, 0)), "Mês passado"];
  if (k === "d90") return [addDays(today, -89), today, "Últimos 90 dias"];
  return [isoD(new Date(y, 0, 1)), today, "Este ano"];
}
const vendasAtivas = r => S.ped.filter(o => o.tipo !== "orcamento" && o.status !== "cancelado" && (!r || inRange(o.data, r)));

/* Escolha de idioma (os nomes ficam no próprio idioma) */
const idiomaSeg = () => `<div class="seg idioma-seg">${[["pt", "Português"], ["es", "Español"]].map(([k, l]) => `<button data-a="idioma" data-id="${k}" aria-pressed="${IDIOMA === k}" lang="${k}">${l}</button>`).join("")}</div>`;
/* ---- Entrada ---- */
function vEntrada() {
  let h = `${marcaHtml()}
  <p class="lead">Sua gestão em 360°: estoque, compras, fornecedores, vendas e financeiro da sua empresa, direto do celular.</p>`;
  if (cloudState === "connecting" || cloudState === "idle") h += `<div class="note info">Conectando…</div>`;
  if (SB && SESSION) h += `<div class="row"><span class="avatar">${ico("user", 20)}</span><span class="wmain"><b>${esc(SESSION.user.email || "")}</b><small>Conta conectada</small></span><button class="btn sm line" data-a="logout">Sair</button></div>`;
  if (cloudState === "on") {
    if (PROFILE && PROFILE.empresas.length) h += `<p class="sec">Suas empresas</p><div class="list">${PROFILE.empresas.map(e => `<button class="row" data-a="openEmp" data-id="${esc(e.eid)}"><span class="avatar">${initials(e.nome)}</span><span class="wmain"><b>${esc(e.nome)}</b><small>Toque para entrar</small></span>${ico("chev", 18)}</button>`).join("")}</div>`;
    h += `<div class="btns"><button class="btn" data-a="sheet" data-k="criarEmp">Criar empresa</button><button class="btn ghost" data-a="sheet" data-k="entrarEmp">Entrar com código</button></div>`;
  }
  if (cloudState === "off") h += window.DECANTA_CONFIG && window.DECANTA_CONFIG.supabaseUrl ? `<div class="note warn">Não foi possível conectar ao servidor. Verifique a internet e abra o app de novo.</div>` : `<div class="note warn">Para usar com sua equipe e salvar na nuvem, use o app Android do ${APP} ou abra pelo link do claude.ai.</div>`;
  h += `<button class="btn line block" data-a="demo">Explorar a demonstração</button><p class="hint center">Com dados de exemplo, salvos só neste aparelho.</p>
  <div class="feat">
    <div><b>Vendas e orçamentos</b>Tabelas de preço, parcelas e desconto</div>
    <div><b>Consignação</b>O que está com cada cliente e o acerto</div>
    <div><b>Estoque</b>Entradas, baixas, contagem e inventário</div>
    <div><b>Financeiro</b>Contas a receber, a pagar e fluxo de caixa</div>
    <div><b>Compras</b>Pedidos a fornecedores e custo médio</div>
    <div><b>Relatórios</b>Curva ABC, margem, comissões e atrasos</div>
    <div><b>Nota fiscal</b>NF-e, NFC-e e notas de consignação</div>
    <div><b>Código de barras</b>Câmera do celular ou leitor USB</div>
  </div>
  <p class="hint center"><button class="lnk" data-a="go" data-r="termos" style="background:none;border:0;color:var(--accent);font-weight:700">Termos de uso e privacidade</button></p><div style="margin-top:14px">${idiomaSeg()}</div>`;
  return h;
}
/* ---- Login (app Android) ---- */
function vLogin() {
  const L = ui.login || (ui.login = { modo: "entrar", email: "", senha: "", nome: "", codigo: "", nova: "", err: "", msg: "", busy: false });
  const inp = (k, l, t, ph) => `<label class="field">${l}<input data-l="${k}" ${t} value="${esc(L[k] || "")}" placeholder="${esc(ph || "")}"></label>`;
  let h = `${marcaHtml()}<p class="lead">Sua gestão em 360°: estoque, compras, fornecedores, vendas, consignação e nota fiscal no celular.</p>`;
  if (L.modo === "entrar" || L.modo === "criar") h += `<div class="seg" style="margin-bottom:6px"><button data-a="loginModo" data-id="entrar" aria-pressed="${L.modo === "entrar"}">Entrar</button><button data-a="loginModo" data-id="criar" aria-pressed="${L.modo === "criar"}">Criar conta</button></div>`;
  if (L.modo === "entrar") h += inp("email", "E-mail", 'type="email" inputmode="email" autocomplete="email"', "voce@email.com") + inp("senha", "Senha", 'type="password" autocomplete="current-password"', "") + `<button class="btn block" data-a="doLogin" ${L.busy ? "disabled" : ""}>${L.busy ? "Entrando…" : "Entrar"}</button><p class="hint center"><button data-a="loginModo" data-id="recuperar" style="background:none;border:0;color:var(--accent);font-weight:700">Esqueci minha senha</button></p>`;
  if (L.modo === "criar") h += inp("nome", "Seu nome", 'autocomplete="name"', "Como a equipe vai ver você") + inp("email", "E-mail", 'type="email" inputmode="email" autocomplete="email"', "voce@email.com") + inp("senha", "Senha (mínimo 8 caracteres)", 'type="password" autocomplete="new-password"', "") + `<p class="hint">Ao criar a conta você aceita os <button data-a="go" data-r="termos" style="background:none;border:0;padding:0;color:var(--accent);font-weight:700">Termos de uso e a Política de privacidade</button>.</p><button class="btn block" data-a="doSignup" ${L.busy ? "disabled" : ""}>${L.busy ? "Criando…" : "Criar conta"}</button>`;
  if (L.modo === "confirmar") h += `<p>Enviamos um código para <b>${esc(L.email)}</b>. Digite-o abaixo, ou toque no link do e-mail e depois entre.</p>` + inp("codigo", "Código", 'inputmode="numeric" autocomplete="one-time-code"', "000000") + `<button class="btn block" data-a="doConfirm" ${L.busy ? "disabled" : ""}>Confirmar</button><div class="btns"><button class="btn line" data-a="loginModo" data-id="entrar">Já confirmei, entrar</button><button class="btn line" data-a="reenviar">Reenviar código</button></div>`;
  if (L.modo === "recuperar") h += `<p>Informe seu e-mail. Vamos enviar um código para você criar uma nova senha.</p>` + inp("email", "E-mail", 'type="email" inputmode="email"', "voce@email.com") + `<button class="btn block" data-a="doRecuperar" ${L.busy ? "disabled" : ""}>Enviar código</button><button class="btn line block" data-a="loginModo" data-id="entrar">Voltar</button>`;
  if (L.modo === "nova") h += `<p>Digite o código enviado para <b>${esc(L.email)}</b> e a nova senha.</p>` + inp("codigo", "Código", 'inputmode="numeric" autocomplete="one-time-code"', "000000") + inp("nova", "Nova senha", 'type="password" autocomplete="new-password"', "") + `<button class="btn block" data-a="doNovaSenha" ${L.busy ? "disabled" : ""}>Salvar nova senha</button><button class="btn line block" data-a="loginModo" data-id="entrar">Voltar</button>`;
  if (L.err) h += `<div class="note bad">${esc(L.err)}</div>`;
  if (L.msg) h += `<div class="note good">${esc(L.msg)}</div>`;
  h += `<button class="btn line block" data-a="demo">Explorar a demonstração</button><div style="margin-top:18px">${idiomaSeg()}</div>`;
  return h;
}

/* ---- Início ---- */
function vInicio() {
  const m = ME(); if (!m) return vSemAcesso();
  const hr = new Date().getHours(), hello = hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite";
  let h = head(`${hello}, ${esc(firstName(m.nome))}`, `${esc(S.emp ? S.emp.nome : "")}${MODE === "demo" ? '<span class="demo-tag">DEMO</span>' : ""}`,
    { action: `<div class="hdr-actions"><button class="iconbtn sm" data-a="toggleTheme" aria-label="Alternar tema claro e escuro">${ico(isDark() ? "sun" : "moon", 18)}</button><button class="me" data-a="tab" data-r="mais"><span class="avatar sm">${initials(m.nome)}</span>${PAPEIS[m.papel]}</button></div>` });
  h += banners();
  const D = DESK(); let hero = "", kpi = "", chart = "";
  const rMes = periodo("mes"), rAnt = periodo("mesAnt");
  if (can("vendas")) {
    const vm = vendasAtivas(rMes), tot = sum(vm, o => pedCalc(o).base);
    const antEnd = addDays(rAnt[0], diffDays(rMes[0], today));
    const antTot = sum(vendasAtivas([rAnt[0], antEnd < rAnt[1] ? antEnd : rAnt[1]]), o => pedCalc(o).base);
    const varTxt = antTot > 0 ? ` · ${tot >= antTot ? "+" : "−"}${pct(Math.abs(tot / antTot - 1))} vs mesmo período do mês passado` : "";
    const days = []; for (let i = 13; i >= 0; i--) { const d = addDays(today, -i); days.push(sum(vendasAtivas([d, d]), o => pedCalc(o).base)); }
    const mx = Math.max(1, ...days);
    hero = `<button class="hero" data-a="${can("relatorios") ? "go" : "tab"}" data-r="${can("relatorios") ? "relatorios" : "vendas"}"><span class="hl">Vendas do mês</span><span class="big">${fmt(tot)}</span>
      <span class="sub">${vm.length} ${vm.length === 1 ? "pedido" : "pedidos"} · ticket médio ${fmt0(vm.length ? tot / vm.length : 0)}${varTxt}</span>
      <span class="spark" aria-hidden="true">${days.map((v, i) => `<i class="${i === 13 ? "now" : ""}" style="height:${Math.round(v / mx * 100)}%"></i>`).join("")}</span></button>`;
    if (D) {
      kpi = `<button class="stat kpi-main" data-a="${can("relatorios") ? "go" : "tab"}" data-r="${can("relatorios") ? "relatorios" : "vendas"}"><span>Vendas do mês</span><b>${fmt(tot)}</b><small>${vm.length} ${vm.length === 1 ? "pedido" : "pedidos"} · ticket médio ${fmt0(vm.length ? tot / vm.length : 0)}</small>${antTot > 0 ? `<em class="${tot >= antTot ? "up" : "down"}">${tot >= antTot ? "+" : "−"}${pct(Math.abs(tot / antTot - 1))} vs mês passado</em>` : ""}</button>`;
      chart = `<section class="panel"><div class="ph"><h2>Vendas dos últimos 14 dias</h2><b>${fmt(sum(days, v => v))}</b></div><div class="bars">${days.map((v, i) => { const d = addDays(today, i - 13); return `<div class="bar ${i === 13 ? "now" : ""}" title="${fd(d)}: ${fmt(v)}"><i style="height:${Math.max(1, Math.round(v / mx * 100))}%"></i><small>${fd(d)}</small></div>`; }).join("")}</div></section>`;
    }
  } else {
    const val = sum(S.prod.filter(p => p.ativo !== false), p => p.estoque * (p.custo || 0));
    hero = `<button class="hero" data-a="tab" data-r="estoque"><span class="hl">Valor do estoque (custo)</span><span class="big">${fmt(val)}</span><span class="sub">${num(sum(S.prod, p => Math.max(0, p.estoque)))} unidades em ${S.prod.filter(p => p.ativo !== false).length} produtos</span></button>`;
    if (D) kpi = `<button class="stat kpi-main" data-a="tab" data-r="estoque"><span>Valor do estoque (custo)</span><b>${fmt(val)}</b><small>${num(sum(S.prod, p => Math.max(0, p.estoque)))} unidades em ${S.prod.filter(p => p.ativo !== false).length} produtos</small></button>`;
  }
  if (!D) h += hero;
  const rec = titulos("receber").filter(t => t.aberto > 0.004), pag = titulos("pagar").filter(t => t.aberto > 0.004);
  const st = [];
  if (can("receber")) {
    st.push(`<button class="stat" data-a="fin" data-id="receber"><span>A receber</span><b>${fmt0(sum(rec, t => t.aberto))}</b><small>${rec.length} ${rec.length === 1 ? "título" : "títulos"} em aberto</small></button>`);
    const v = rec.filter(t => t.status === "vencido");
    st.push(`<button class="stat ${v.length ? "bad" : "good"}" data-a="fin" data-id="receber"><span>Vencido</span><b>${fmt0(sum(v, t => t.aberto))}</b><small>${v.length ? new Set(v.map(t => t.quem)).size + " clientes em atraso" : "Nenhum atraso"}</small></button>`);
  }
  if (can("pagar")) {
    const p7 = pag.filter(t => t.venc <= addDays(today, 7));
    st.push(`<button class="stat ${p7.some(t => t.status === "vencido") ? "bad" : ""}" data-a="fin" data-id="pagar"><span>A pagar em 7 dias</span><b>${fmt0(sum(p7, t => t.aberto))}</b><small>${p7.length} ${p7.length === 1 ? "conta" : "contas"}${p7.some(t => t.status === "vencido") ? ", há vencidas" : ""}</small></button>`);
  }
  if (can("estoque")) {
    const low = S.prod.filter(p => p.ativo !== false && p.estoque <= (p.min || 0));
    st.push(`<button class="stat ${low.length ? "warn" : ""}" data-a="tab" data-r="estoque"><span>Abaixo do mínimo</span><b>${low.length}</b><small>${low.filter(p => p.estoque <= 0).length} sem estoque</small></button>`);
  }
  if (st.length && !D) h += `<div class="stats">${st.join("")}</div>`;
  const q = [];
  if (can("vendas")) q.push(`<button data-a="novoPedido">${ico("order")}Pedido</button>`, `<button data-a="novoPedido" data-id="orcamento">${ico("tag")}Orçamento</button>`);
  if (can("receber")) q.push(`<button data-a="sheet" data-k="payPickCli">${ico("cash")}Receber</button>`);
  if (can("compras")) q.push(`<button data-a="novaCompra">${ico("truck")}Compra</button>`);
  if (can("ajuste") && q.length < 4) q.push(`<button data-a="sheet" data-k="pickProdEntrada">${ico("box")}Entrada</button>`);
  if (can("pagar") && q.length < 4) q.push(`<button data-a="sheet" data-k="finForm" data-id="pagar">${ico("wallet")}Despesa</button>`);
  if (q.length && !D) h += `<div class="quick ${q.length === 3 ? "three" : q.length === 2 ? "two" : ""}">${q.slice(0, 4).join("")}</div>`;
  const att = [];
  if (can("receber")) {
    const porCli = {};
    rec.filter(t => t.status === "vencido" && t.src === "ped").forEach(t => { const o = Pe(t.id); const k = o.cli; porCli[k] = porCli[k] || { v: 0, a: 0 }; porCli[k].v += t.aberto; porCli[k].a = Math.max(porCli[k].a, t.atraso); });
    Object.entries(porCli).sort((a, b) => b[1].v - a[1].v).slice(0, 4).forEach(([cid, x]) => { const c = Cl(cid); if (c) att.push(`<button class="row" data-a="go" data-r="cliente" data-id="${cid}"><span class="dot bad">${SIM()}</span><span class="wmain"><b>${esc(c.nome)}</b><small class="bad">${fmt(x.v)} vencido há ${x.a} ${x.a === 1 ? "dia" : "dias"}</small></span>${ico("chev", 18)}</button>`); });
  }
  if (can("pagar")) pag.filter(t => t.venc <= addDays(today, 3)).sort((a, b) => a.venc.localeCompare(b.venc)).slice(0, 3).forEach(t => att.push(`<button class="row" data-a="titulo" data-src="${t.src}" data-id="${t.id}"><span class="dot ${t.status === "vencido" ? "bad" : "warn"}">−</span><span class="wmain"><b>${esc(t.desc)}</b><small class="${t.status === "vencido" ? "bad" : ""}">${t.status === "vencido" ? `Venceu há ${t.atraso} dias` : `Vence ${t.venc === today ? "hoje" : fd(t.venc)}`} · ${fmt(t.aberto)}</small></span>${ico("chev", 18)}</button>`));
  if (can("estoque")) S.prod.filter(p => p.ativo !== false && p.estoque <= (p.min || 0)).sort((a, b) => a.estoque - b.estoque).slice(0, 3).forEach(p => { const s = pstate(p); att.push(`<button class="row" data-a="prod" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.estoque} un. · mínimo ${p.min}</small></span><span class="pill ${s.cls}">${s.t}</span></button>`); });
  if (can("compras")) S.comp.filter(c => c.status === "pedido").forEach(c => { const f = Fo(c.forn); att.push(`<button class="row" data-a="go" data-r="compra" data-id="${c.id}"><span class="dot info">${ico("truck", 18)}</span><span class="wmain"><b>Compra #${c.num} · ${esc(f ? f.nome : "")}</b><small>${c.prev && c.prev < today ? `Atrasada desde ${fd(c.prev)}` : `Previsão ${fd(c.prev)}`} · ${compCalc(c).qtd} un.</small></span>${ico("chev", 18)}</button>`); });
  if (can("vendas")) {
    S.ped.filter(o => o.tipo === "consig" && o.status !== "cancelado" && pedCalc(o).comCliente > 0 && diffDays(o.data, today) > 30).slice(0, 3).forEach(o => { att.push(`<button class="row" data-a="go" data-r="pedido" data-id="${o.id}"><span class="dot warn">C</span><span class="wmain"><b>${esc(cliNome(o))}</b><small>Consignação #${o.num} há ${diffDays(o.data, today)} dias · ${pedCalc(o).comCliente} un. para acertar</small></span>${ico("chev", 18)}</button>`); });
    const orc = S.ped.filter(o => o.tipo === "orcamento" && o.status === "orcamento");
    if (orc.length) att.push(`<button class="row" data-a="vendasFiltro" data-id="orcamento"><span class="dot acc">${ico("tag", 18)}</span><span class="wmain"><b>${orc.length} ${orc.length === 1 ? "orçamento em aberto" : "orçamentos em aberto"}</b><small>${fmt(sum(orc, o => pedCalc(o).total))} para converter em pedido</small></span>${ico("chev", 18)}</button>`);
  }
  if (D) { // computador: indicadores numa linha e painéis em duas colunas
    const ult = can("vendas") ? S.ped.slice().sort((a, b) => (b.num || 0) - (a.num || 0)).slice(0, 8) : [];
    return h + `<div class="stats kpis">${kpi}${st.join("")}</div><div class="dash"><div class="dcol">${chart}
      ${can("vendas") ? `<section class="panel"><div class="ph"><h2>Últimos pedidos</h2><button class="lnk" data-a="tab" data-r="vendas">Ver todos</button></div>${pedTable(ult, true)}</section>` : ""}</div>
      <div class="dcol">${q.length ? `<section class="panel"><div class="ph"><h2>Atalhos</h2></div><div class="qlist">${q.join("")}</div></section>` : ""}
      <section class="panel"><div class="ph"><h2>Precisa de atenção <span class="count">${att.length}</span></h2></div><div class="list">${att.join("") || empty("Tudo em dia.", "")}</div></section></div></div>`;
  }
  h += `<p class="sec">Precisa de atenção <span class="count">${att.length}</span></p><div class="list">${att.join("") || empty("Tudo em dia.", "")}</div>`;
  if (can("vendas")) {
    const ult = S.ped.slice().sort((a, b) => (b.num || 0) - (a.num || 0)).slice(0, 5);
    h += `<p class="sec">Últimos pedidos <button class="lnk" data-a="tab" data-r="vendas">Ver todos</button></p><div class="list">${ult.map(pedRow).join("") || empty("Nenhum pedido ainda.", "Toque em + para registrar o primeiro.")}</div>`;
  }
  return h;
}
function vSemAcesso() {
  // Enquanto os dados da empresa chegam, a lista de membros ainda está vazia: não é falta de acesso
  if ((MODE === "cloud" || MODE === "supa") && (loadState === "loading" || loadState === "slow")) return `${marcaHtml()}<div class="empty"><b>Carregando os dados da empresa…</b>Isso leva alguns segundos na primeira vez.</div>`;
  if (MODE === "supa" && loadState === "erro") return `${marcaHtml()}${empty("Não foi possível carregar a empresa.", "Verifique a internet e tente de novo.", `<div class="btns"><button class="btn" data-a="recarregar">Tentar de novo</button><button class="btn line" data-a="sair">Voltar</button></div>`)}`;
  return `${marcaHtml()}${empty("Você não faz parte desta empresa.", "Seu acesso pode ter sido removido pelo administrador.", `<button class="btn" data-a="sair">Voltar</button>`)}`;
}
function pedRow(o) {
  const c = pedCalc(o), sym = { venda: "V", consig: "C", orcamento: "O" }[o.tipo], cls = { venda: "acc", consig: "warn", orcamento: "info" }[o.tipo];
  return `<button class="row ${o.status === "cancelado" ? "off" : ""}" data-a="go" data-r="pedido" data-id="${o.id}"><span class="dot ${cls}">${sym}</span>
    <span class="wmain"><b>#${o.num} · ${esc(cliNome(o))}</b><small>${fd(o.data)} · ${tipoPed(o.tipo)} · ${c.qtd} un. · ${esc(firstName(nomeDe(o.vendedor)))}</small></span>
    <span class="right"><b>${fmt(c.aberto > 0.004 ? c.aberto : c.total)}</b>${statusPed(c)}</span></button>`;
}

function pedTable(list, curta) { // curta: true = painel do início; "cli" = ficha do cliente
  const cls = { venda: "acc", consig: "warn", orcamento: "info" };
  const cols = curta === "cli" ? [["Pedido"], ["Data"], ["Tipo"], ["Total", "num"], ["Em aberto", "num"], ["Situação"]] : curta ? [["Pedido"], ["Cliente"], ["Data"], ["Total", "num"], ["Situação"]] : [["Pedido"], ["Cliente"], ["Data"], ["Tipo"], ["Vendedor"], ["Qtd.", "num"], ["Total", "num"], ["Em aberto", "num"], ["Situação"]];
  return dtable(cols, list.map(o => { const c = pedCalc(o); return dtr(`data-a="go" data-r="pedido" data-id="${o.id}"`, curta === "cli"
    ? [td(`<b>#${o.num}</b>`, "nowrap"), td(fd(o.data), "muted"), td(`<span class="pill ${cls[o.tipo]}">${tipoPed(o.tipo)}</span>`), td(fmt(c.total), "num"), td(c.aberto > 0.004 ? fmt(c.aberto) : "—", "num"), td(statusPed(c))]
    : curta ? [td(`<b>#${o.num}</b>`, "nowrap"), td(esc(cliNome(o)), "strong"), td(fd(o.data), "muted"), td(fmt(c.total), "num"), td(statusPed(c))]
    : [td(`<b>#${o.num}</b>`, "nowrap"), td(esc(cliNome(o)), "strong"), td(fd(o.data), "muted"), td(`<span class="pill ${cls[o.tipo]}">${tipoPed(o.tipo)}</span>`), td(esc(firstName(nomeDe(o.vendedor))), "muted"), td(c.qtd, "num"), td(fmt(c.total), "num"), td(c.aberto > 0.004 ? fmt(c.aberto) : "—", "num"), td(statusPed(c))], o.status === "cancelado" ? "off" : ""); }),
    empty(curta ? "Nenhum pedido ainda." : "Nada encontrado.", ""), curta ? "" : "t-ped");
}

/* ---- Vendas ---- */
function vVendas() {
  const f = ui.vFiltro, q = norm(ui.vq);
  const list = S.ped.filter(o => {
    const c = pedCalc(o);
    if (f === "orcamento" && o.tipo !== "orcamento") return false;
    if (f === "receber" && !(c.status === "aberto" || c.status === "vencido")) return false;
    if (f === "vencido" && c.status !== "vencido") return false;
    if (f === "consig" && !(o.tipo === "consig" && o.status !== "cancelado")) return false;
    if (f === "pago" && c.status !== "pago") return false;
    if (f === "cancelado" && o.status !== "cancelado") return false;
    if (q) { if (!norm(`${o.num} ${cliNome(o)} ${nomeDe(o.vendedor)}`).includes(q)) return false; }
    return true;
  }).sort((a, b) => (b.num || 0) - (a.num || 0));
  const chips = [["todos", "Todos"], ["orcamento", "Orçamentos"], ["receber", "A receber"], ["vencido", "Vencidos"], ["consig", "Consignação"], ["pago", "Pagos"], ["cancelado", "Cancelados"]];
  return head("Vendas", "Pedidos, orçamentos e consignações", { action: `<button class="btn sm" data-a="novoPedido">+ Novo</button>` }) + banners() +
    toolbar(`<label class="search">${ico("search", 18)}<input id="vq" type="search" placeholder="Número, cliente ou vendedor" value="${esc(ui.vq)}" aria-label="Buscar pedido"></label>
    <div class="chips">${chips.map(([k, l]) => `<button class="chip" data-a="vf" data-id="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>`) +
    `<div id="vlist"><p class="summary">${list.length} ${list.length === 1 ? "registro" : "registros"} · ${fmt(sum(list.filter(o => o.tipo !== "orcamento"), o => pedCalc(o).total))} faturado</p>${DESK() ? pedTable(list) : `<div class="list">${list.map(pedRow).join("") || empty("Nada encontrado.", "")}</div>`}</div>`;
}
function pedText(o) {
  const c = pedCalc(o), e = S.emp ? S.emp.nome : APP;
  let t = `*${tipoPed(o.tipo)} #${o.num} · ${e}*\nCliente: ${cliNome(o)}\nData: ${fdy(o.data)}\n\n`;
  o.itens.forEach(i => { const p = P(i.p); t += `${i.q}× ${p ? p.nome : "Produto"}${p && p.safra ? " " + p.safra : ""} · ${fmt(i.preco)} = ${fmt(i.q * i.preco)}\n`; });
  if (c.desc) t += `\nDesconto: −${fmt(c.desc)}`;
  if (o.iva > 0 && o.tipo !== "consig") t += `\n${ivaLabel(o.iva)}: ${fmt(c.iva)}`;
  t += `\n*Total: ${fmt(o.tipo === "consig" ? sum(o.itens, i => i.q * i.preco) : c.total)}*${o.iva > 0 && o.tipo === "consig" ? ` (+ ${ivaLabel(o.iva)} sobre o vendido)` : ""}\n`;
  if (o.tipo === "consig") t += `Consignação: acerto até ${fdy(o.venc)}. Cobramos apenas o que for vendido.\n`;
  else t += `Pagamento: ${CONDS[o.cond] || "À vista"}${c.parcelas.length ? " · vencimento " + c.parcelas.map(p => fd(p.venc)).join(", ") : ""}\n`;
  if (o.obs) t += `Obs.: ${o.obs}\n`;
  return t;
}
const waLink = (fone, txt) => { let d = digits(fone); if (d && d.length <= PC().nacional) d = PC().ddi + d; return `https://wa.me/${d}?text=${encodeURIComponent(txt)}`; }; // número nacional ganha o código do país
function itensTable(o, ativo) {
  const cons = o.tipo === "consig";
  return dtable(cons ? [["Produto"], ["Entregue", "num"], ["Vendido", "num"], ["Devolvido", "num"], ["Com o cliente", "num"], [""]] : [["Produto"], ["Qtd.", "num"], ["Preço", "num"], ["Total", "num"]],
    o.itens.map((i, ix) => {
      const p = P(i.p) || { nome: "Produto removido", tipo: "outros" }, l = i.q - (i.vend || 0) - (i.dev || 0), nome = td(`<span class="pcell"><span class="bt">${bottle(p.tipo)}</span><b>${esc(p.nome)}</b></span>`);
      if (!cons) return `<tr class="static">${nome}${td(i.q, "num")}${td(fmt(i.preco), "num")}${td(`<b>${fmt(i.q * i.preco)}</b>`, "num")}</tr>`;
      return `<tr class="static">${nome}${td(i.q, "num")}${td(i.vend || 0, "num")}${td(i.dev || 0, "num")}${td(`<b>${l}</b>`, "num")}${td(l > 0 && ativo && can("vendas") ? `<span class="mini"><button class="btn sm" data-a="consig" data-m="vend" data-id="${o.id}" data-x="${ix}">Vendeu</button><button class="btn sm ghost" data-a="consig" data-m="dev" data-id="${o.id}" data-x="${ix}">Devolveu</button></span>` : "", "nowrap")}</tr>`;
    }), "");
}
function vPedido() {
  const o = Pe(ui.id); if (!o) return head("Pedido", "", { back: true }) + empty("Carregando…", "");
  const c = pedCalc(o), cl = Cl(o.cli), ativo = o.status !== "cancelado";
  let h = head(`${tipoPed(o.tipo)} #${o.num}`, `${fdy(o.data)} · ${esc(nomeDe(o.vendedor))}`, { back: true, sm: true, action: statusPed(c) }) + banners();
  const i0 = h.length; // no computador: itens e notas à esquerda; totais, parcelas e ações à direita
  h += o.cli ? `<button class="row" data-a="go" data-r="cliente" data-id="${o.cli}"><span class="avatar">${initials(cliNome(o))}</span><span class="wmain"><b>${esc(cliNome(o))}</b><small>${esc(cl ? cl.tipo : "")} · tabela ${TABELAS[o.tabela] || "Varejo"}</small></span>${ico("chev", 18)}</button>`
    : `<div class="row"><span class="avatar">CF</span><span class="wmain"><b>Consumidor final</b><small>Venda de balcão${o.consumidor && o.consumidor.cpf ? " · CPF " + esc(o.consumidor.cpf) : ""}</small></span></div>`;
  h += `<p class="sec">Itens</p>${DESK() ? itensTable(o, ativo) : `<div class="list">${o.itens.map((i, ix) => {
    const p = P(i.p) || { nome: "Produto removido", tipo: "outros" }, l = i.q - (i.vend || 0) - (i.dev || 0);
    if (o.tipo !== "consig") return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${i.q} × ${fmt(i.preco)}</small></span><span class="right"><b>${fmt(i.q * i.preco)}</b></span></div>`;
    return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>Entregue ${i.q} · vendido ${i.vend || 0} · devolvido ${i.dev || 0}</small>
      ${l > 0 && ativo && can("vendas") ? `<span class="mini"><button class="btn sm" data-a="consig" data-m="vend" data-id="${o.id}" data-x="${ix}">Vendeu</button><button class="btn sm ghost" data-a="consig" data-m="dev" data-id="${o.id}" data-x="${ix}">Devolveu</button></span>` : ""}</span>
      <span class="right"><b>${l}</b><small>com o cliente</small></span></div>`;
  }).join("")}</div>`}`;
  const i1 = h.length;
  h += `<div class="card" style="margin-top:12px">${o.tipo === "consig" ? `<div class="tot muted"><span>Valor entregue</span><span>${fmt(sum(o.itens, i => i.q * i.preco))}</span></div>${c.iva ? `<div class="tot muted"><span>${ivaLabel(o.iva)} sobre o vendido</span><span>${fmt(c.iva)}</span></div>` : ""}<div class="tot"><span>Faturado (vendido)</span><span>${fmt(c.total)}</span></div>` :
    `<div class="tot muted"><span>Subtotal</span><span>${fmt(c.bruto)}</span></div>${c.desc ? `<div class="tot muted"><span>Desconto</span><span>−${fmt(c.desc)}</span></div>` : ""}${c.iva ? `<div class="tot muted"><span>${ivaLabel(o.iva)}</span><span>${fmt(c.iva)}</span></div>` : ""}<div class="tot"><span>Total</span><span>${fmt(c.total)}</span></div>`}
    ${o.tipo !== "orcamento" ? `<div class="tot"><span>Recebido</span><span>${fmt(c.pago)}</span></div><div class="tot big"><span>Em aberto</span><span>${fmt(c.aberto)}</span></div>` : ""}
    ${can("custo") && o.tipo !== "orcamento" ? `<div class="tot muted"><span>Margem bruta</span><span>${fmt(c.margem)} · ${pct(c.base ? c.margem / c.base : 0)}</span></div>` : ""}</div>`;
  if (o.tipo !== "orcamento" && ativo) h += `<p class="sec">${o.tipo === "consig" ? "Acerto" : "Parcelas"}</p><div class="list">${c.parcelas.map((p, ix) => `<div class="row"><span class="dot ${p.aberto <= 0.004 ? "good" : p.venc < today ? "bad" : "info"}">${ix + 1}</span><span class="wmain"><b>${fmt(p.valor)}</b><small>Vencimento ${fdy(p.venc)}</small></span><span class="right">${p.aberto <= 0.004 ? '<span class="pill ok">Pago</span>' : p.venc < today ? `<span class="pill bad">Vencido · ${diffDays(p.venc, today)}d</span>` : `<span class="pill info">${p.pago > 0 ? "Parcial" : "Aberto"}</span>`}</span></div>`).join("")}</div>`;
  const i2 = h.length;
  h += nfSection(o);
  if ((o.pag || []).length) h += `<p class="sec">Recebimentos</p><div class="list">${o.pag.map(p => `<div class="row"><span class="dot good">${SIM()}</span><span class="wmain"><b>${fmt(p.valor)}</b><small>${p.forma} · ${fdy(p.data)} · ${esc(nomeDe(p.por))}</small></span></div>`).join("")}</div>`;
  if (o.obs) h += `<p class="sec">Observações</p><div class="card">${esc(o.obs)}</div>`;
  const i3 = h.length;
  const txt = pedText(o), b = [];
  if (o.tipo === "orcamento" && o.status === "orcamento" && can("vendas")) b.push(`<button class="btn block" data-a="converter" data-id="${o.id}">Converter em pedido</button>`);
  if (c.aberto > 0.004 && can("receber")) b.push(`<button class="btn block" data-a="pay" data-src="ped" data-id="${o.id}">Registrar recebimento</button>`);
  h += b.join("");
  h += `<div class="btns"><a class="btn ghost" href="${waLink(cl && cl.fone, txt)}" target="_blank" rel="noopener">${ico("whats", 18)}WhatsApp</a><button class="btn ghost" data-a="copyTxt" data-id="${o.id}">${ico("copy", 18)}Copiar texto</button></div>`;
  const b2 = [];
  if (can("vendas") && o.tipo !== "orcamento") b2.push(`<button class="btn line" data-a="repetir" data-id="${o.id}">Repetir pedido</button>`);
  if (ativo && o.status !== "convertido" && can("cancelar")) b2.push(`<button class="btn danger" data-a="sheet" data-k="cancelPed" data-id="${o.id}">Cancelar</button>`);
  if (b2.length) h += `<div class="btns">${b2.join("")}</div>`;
  if (DESK()) return h.slice(0, i0) + colunas(h.slice(i0, i1) + h.slice(i2, i3), h.slice(i1, i2) + h.slice(i3), "pedido");
  return h;
}

/* ---- Novo pedido ---- */
function draftCalc() {
  const d = ui.draft; let n = 0, bruto = 0;
  Object.entries(d.qty).forEach(([id, q]) => { const p = P(id); if (q > 0 && p && p.ativo !== false) { n += q; bruto += q * precoDraft(p); } });
  bruto = r2(bruto);
  let desc = 0; const s = String(d.desc || "").trim();
  if (s && d.tipo !== "consig") { desc = s.endsWith("%") ? bruto * (parseMoney(s.slice(0, -1)) || 0) / 100 : parseMoney(s) || 0; desc = r2(Math.min(Math.max(desc, 0), bruto)); }
  const base = r2(bruto - desc), iva = d.iva && ivaTaxa() ? r2((d.tipo === "consig" ? bruto : base) * ivaTaxa()) : 0;
  return { n, bruto, desc, base, iva, total: r2(base + iva) };
}
function draftCredit() {
  const d = ui.draft; if (!d.cli) return "";
  if (d.cli === "CF") return temFiscal() ? `<div class="note info">Venda de balcão para consumidor final. Depois de confirmar, emita a NFC-e.</div><label class="field">CPF na nota (opcional)<input data-d="cpf" inputmode="numeric" value="${esc(d.cpf || "")}" placeholder="000.000.000-00"></label>` : `<div class="note info">Venda de balcão para consumidor final, com pagamento na hora.</div>`;
  const s = cliStats(d.cli), t = draftCalc(), out = [];
  if (s.vencido > 0) out.push(`<div class="note bad"><b>${fmt(s.vencido)} vencido</b> há ${s.atraso} dias. Saldo em aberto ${fmt(s.aberto)}.</div>`);
  else if (s.aberto > 0) out.push(`<div class="note warn">Saldo em aberto ${fmt(s.aberto)}, sem atrasos.</div>`);
  else out.push(`<div class="note good">Cliente em dia.</div>`);
  if (s.limite && d.tipo !== "orcamento") { const exp = s.aberto + s.consV + (d.tipo === "consig" ? t.bruto : t.total); if (exp > s.limite) out.push(`<div class="note bad">Este pedido passa o limite de crédito de ${fmt(s.limite)} (exposição total ${fmt(exp)}).</div>`); }
  if (s.consQ) out.push(`<div class="note info">${s.consQ} un. em consignação com o cliente (${fmt(s.consV)}).</div>`);
  const ccl = Cl(d.cli); if (temCondicoes(ccl)) out.push(`<div class="note info">Condições especiais aplicadas${Number(ccl.descPct) > 0 ? `: ${dec(ccl.descPct)}% de desconto` : ""}${Object.keys(ccl.precos || {}).length ? `${Number(ccl.descPct) > 0 ? " e" : ":"} preço especial em ${(n => n === 1 ? "1 produto" : n + " produtos")(Object.keys(ccl.precos).filter(k => Number(ccl.precos[k]) > 0).length)}` : ""}.</div>`);
  return out.join("");
}
function draftList() {
  const d = ui.draft, q = norm(d.q);
  const list = S.prod.filter(p => p.ativo !== false && !ehInsumo(p) && (!q || norm([p.nome, p.uva, p.regiao, p.pais, p.ean].join(" ")).includes(q)));
  return list.map(p => {
    const n = d.qty[p.id] || 0, after = p.estoque - n, pr = precoDraft(p), orc = d.tipo === "orcamento", dcl = d.cli && d.cli !== "CF" ? Cl(d.cli) : null, esp = temEspecial(p, dcl) ? " · especial" : "";
    let cls = "", t = `${p.estoque} disp. · ${fmt(pr)}${esp}`;
    if (p.estoque <= 0 && !orc) { cls = "bad"; t = "Sem estoque"; }
    else if (n > 0 && !orc && after <= (p.min || 0)) { cls = "warn"; t = `${n} × ${fmt(pr)} · restam ${after}, abaixo do mínimo`; }
    else if (n > 0) { cls = "good"; t = `${n} × ${fmt(pr)}${esp} = ${fmt(n * pr)}${orc ? "" : ` · restam ${after}`}`; }
    const max = orc ? 9999 : p.estoque;
    return `<div class="row ${n ? "on" : ""} ${p.estoque <= 0 && !orc ? "off" : ""}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}${p.safra && p.safra !== "NV" ? " " + esc(p.safra) : ""}</b><small class="${cls}">${t}</small></span>
      <div class="stepper"><button data-a="dstep" data-id="${p.id}" data-d="-1" aria-label="Diminuir" ${n <= 0 ? "disabled" : ""}>−</button><output>${n}</output><button data-a="dstep" data-id="${p.id}" data-d="1" aria-label="Aumentar" ${n >= max ? "disabled" : ""}>+</button></div></div>`;
  }).join("") || empty("Nenhum produto encontrado.", "");
}
function draftFoot() {
  const d = ui.draft, t = draftCalc();
  const label = !d.cli ? "Escolha o cliente" : d.tipo === "orcamento" ? "Salvar orçamento" : "Confirmar";
  return `<div><small>${t.n} un. · ${tipoPed(d.tipo).toLowerCase()}${t.desc ? ` · desconto ${fmt(t.desc)}` : ""}${t.iva ? ` · ${d.tipo === "consig" ? "+ IVA no acerto" : "IVA " + fmt(t.iva)}` : ""}</small><b>${fmt(d.tipo === "consig" ? t.bruto : t.total)}</b></div>
  <button class="btn" data-a="confirmPedido" ${!d.cli || !t.n ? "disabled" : ""}>${label}</button>`;
}
function updateDraft() { const a = $("dlist"), b = $("dfoot"), c = $("dcredit"); if (a) a.innerHTML = draftList(); if (b) b.innerHTML = draftFoot(); if (c) c.innerHTML = draftCredit(); }
function vNovoPedido() {
  if (!ui.draft) newDraft("venda");
  const d = ui.draft, cl = d.cli ? Cl(d.cli) : null;
  let h = head(d.tipo === "orcamento" ? "Novo orçamento" : "Novo pedido", "Venda, consignação ou orçamento", { back: true, action: Object.values(d.qty).some(v => v) ? `<button class="btn sm ghost" data-a="limparDraft">Limpar</button>` : "" }) + banners();
  const i0 = h.length; // no computador: produtos à esquerda; cliente, condições e desconto à direita
  h += `<section class="card"><span class="lbl">Cliente</span><button class="picker" data-a="sheet" data-k="pickCli">${d.cli === "CF" ? `<span class="avatar">CF</span><span class="wmain"><b>Consumidor final</b><small>Balcão · pagamento na hora</small></span>` : cl ? `<span class="avatar">${initials(cl.nome)}</span><span class="wmain"><b>${esc(cl.nome)}</b><small>${esc(cl.tipo)} · tabela ${TABELAS[cl.tabela] || "Varejo"}</small></span>` : `<span class="wmain"><b>Escolher cliente</b><small>Restaurante, bar, hotel, empório ou pessoa física</small></span>`}${ico("chev", 18)}</button><div id="dcredit">${draftCredit()}</div></section>`;
  h += `<section class="card"><span class="lbl">Tipo</span><div class="seg">${[["venda", "Venda"], ["consig", "Consignação"], ["orcamento", "Orçamento"]].filter(x => !(d.cli === "CF" && x[0] === "consig")).map(([k, l]) => `<button data-a="dtipo" data-id="${k}" aria-pressed="${d.tipo === k}">${l}</button>`).join("")}</div>
    <p class="hint">${{ venda: "O estoque baixa agora e as parcelas entram no contas a receber.", consig: "Os produtos saem hoje. O cliente paga só o que vender e devolve o resto no acerto.", orcamento: "Não mexe no estoque. Você pode converter em pedido depois." }[d.tipo]}</p>
    <span class="lbl" style="margin-top:14px">Tabela de preço</span><div class="chips wrap tight">${Object.entries(TABELAS).map(([k, l]) => `<button class="chip" data-a="dtab" data-id="${k}" aria-pressed="${d.tabela === k}">${l}</button>`).join("")}</div>
    ${d.tipo === "consig" ? `<span class="lbl" style="margin-top:14px">Acerto em</span><div class="chips wrap tight">${[15, 30, 45, 60].map(t => `<button class="chip" data-a="dprazo" data-id="${t}" aria-pressed="${d.prazo == t}">${t} dias</button>`).join("")}</div>`
    : `<span class="lbl" style="margin-top:14px">Condição de pagamento</span><div class="chips wrap tight">${Object.entries(CONDS).map(([k, l]) => `<button class="chip" data-a="dcond" data-id="${k}" aria-pressed="${d.cond === k}">${l}</button>`).join("")}</div>`}
    ${d.tipo !== "consig" ? `<label class="field" style="margin-top:14px">Desconto para o cliente (${SIM()} ou %)<input data-d="desc" inputmode="decimal" value="${esc(d.desc)}" placeholder="Ex: ${money(50)} ou 5%"></label><div class="chips tight" style="margin-top:8px">${[5, 10, 15].map(x => `<button class="chip" data-a="ddesc" data-id="${x}%" aria-pressed="${String(d.desc).trim() === x + "%"}">${x}%</button>`).join("")}${d.desc ? `<button class="chip" data-a="ddesc" data-id="">Sem desconto</button>` : ""}</div>` : ""}
    ${d.tipo === "venda" && d.cond === "0" && can("receber") ? `<label class="toggle">Já recebido agora<input type="checkbox" data-a="dpago" ${d.pagoAgora ? "checked" : ""}></label>${d.pagoAgora ? `<div class="chips wrap tight" style="margin-top:8px">${FORMAS.map(f => `<button class="chip" data-a="dforma" data-id="${f}" aria-pressed="${d.forma === f}">${f}</button>`).join("")}</div>` : ""}` : ""}
  </section>`;
  const i1 = h.length;
  h += `<span class="lbl" style="margin:18px 2px 8px">Produtos</span><label class="search">${ico("search", 18)}<input id="dq" type="search" placeholder="Buscar por nome, uva, país ou código" value="${esc(d.q)}" aria-label="Buscar produto"><button class="scanbtn" data-a="scan" aria-label="Ler código de barras">${ico("scan", 18)}</button></label>
    <div class="list" id="dlist" style="margin-top:10px">${draftList()}</div>`;
  const i2 = h.length;
  h += `<section class="card" style="margin-top:14px">${d.tipo !== "consig" ? `${ivaTaxa() ? `<label class="toggle">Somar ${ivaLabel()} ao total<input type="checkbox" data-a="diva" ${d.iva ? "checked" : ""}></label><p class="hint" style="margin-top:4px">${d.iva ? "Os preços da tabela estão sem IVA; o imposto entra no total e nas parcelas." : "Os preços da tabela já incluem o IVA."}</p>` : ""}` : ""}
    <label class="field">Observações<input data-d="obs" value="${esc(d.obs)}" placeholder="Ex: entregar na terça"></label></section>`;
  const i3 = h.length;
  h += `<div class="ofoot" id="dfoot">${draftFoot()}</div>`;
  if (DESK()) return h.slice(0, i0) + colunas(h.slice(i1, i2), h.slice(i0, i1) + h.slice(i2, i3), "novo") + h.slice(i3);
  return h;
}
function newDraft(tipo, base) {
  ui.draft = { tipo: tipo || "venda", cli: null, tabela: "varejo", cond: "30", prazo: 30, qty: {}, desc: "", obs: "", q: "", pagoAgora: false, forma: formas()[0], fromOrc: null, cpf: "", iva: ivaPadrao() };
  if (base) Object.assign(ui.draft, base);
}

/* ---- Estoque ---- */
const FILTROS_EST = ["todos", "baixo", "zero", "inativos"];
/* Linha de detalhe do produto na lista: vinho mostra uva e país; outros ramos, marca/referência/medida */
const prodSub = p => ehFood() ? [p.tipoItem === "insumo" ? "Ingrediente" : p.tipoItem === "embalagem" ? "Embalagem" : "", `${dec(r4(p.estoque || 0))} ${unDe(p)}`, p.marca].filter(Boolean).join(" · ") : (ehVinho() ? [p.uva, p.pais] : [p.marca, p.ref, p.material, p.medida]).filter(Boolean).join(" · ") || catLabel(p.tipo);
function prodMatch(p) {
  const f = ui.fTipo, q = norm(ui.q);
  if (f === "inativos") { if (p.ativo !== false) return false; } else if (p.ativo === false) return false;
  if (f === "baixo" && p.estoque > (p.min || 0)) return false;
  if (f === "zero" && p.estoque > 0) return false;
  if (f && !FILTROS_EST.includes(f) && catDe(p.tipo).id !== f) return false;
  return !q || norm([p.nome, p.produtor, p.uva, p.regiao, p.pais, p.safra, p.ean, p.loc, p.marca, p.ref, p.material, p.medida, catLabel(p.tipo)].join(" ")).includes(q);
}
function prodList() {
  const list = S.prod.filter(prodMatch).sort((a, b) => a.nome.localeCompare(b.nome)), cst = can("custo");
  const resumo = `<p class="summary">${list.length} produtos · ${num(sum(list, p => Math.max(0, p.estoque)))} un. · ${fmt0(sum(list, p => Math.max(0, p.estoque) * (cst ? p.custo || 0 : preco(p, "varejo"))))} ${cst ? "a custo" : "a preço de venda"}</p>`;
  if (DESK()) return resumo + dtable([["Produto"], ["Categoria"], ["Local"], ["Preço", "num"], ...(cst ? [["Custo", "num"]] : []), ["Estoque", "num"], ["Situação"]],
    list.map(p => { const s = pstate(p), ct = catDe(p.tipo); return dtr(`data-a="prod" data-id="${p.id}"`, [
      td(`<span class="pcell"><span class="bt">${bottle(p.tipo)}</span><span><b>${esc(p.nome)}${p.safra && p.safra !== "NV" ? " " + esc(p.safra) : ""}</b><small>${esc(prodSub(p))}</small></span></span>`),
      td(`<span class="cat"><i style="background:${esc(ct.c)}"></i>${esc(catLabel(p.tipo))}</span>`, "muted"), td(esc(p.loc || "—"), "muted"), td(fmt(preco(p, "varejo")), "num"),
      ...(cst ? [td(fmt(p.custo || 0), "num muted")] : []), td(`<b>${p.estoque}</b> un.${ehVinho() ? `<small>${Math.floor(p.estoque / 6)} cx</small>` : ""}`, "num"),
      td(`<span class="pill ${s.cls}">${s.cls === "ok" ? "Em estoque" : s.t}</span>`)]); }),
    empty("Nenhum produto encontrado.", can("ajuste") ? "Cadastre um produto ou importe sua planilha." : ""), "t-prod");
  return `${resumo}
  <div class="list">${list.map(p => { const s = pstate(p); return `<button class="row" data-a="prod" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span>
    <span class="wmain"><b>${esc(p.nome)}${p.safra && p.safra !== "NV" ? " " + esc(p.safra) : ""}</b><small>${esc(prodSub(p))}</small><small>${fmt(preco(p, "varejo"))}${p.loc ? " · " + esc(p.loc) : ""}</small></span>
    <span class="right"><b>${p.estoque} un.</b>${s.cls !== "ok" ? `<span class="pill ${s.cls}">${s.t}</span>` : (ehVinho() ? `<small>${Math.floor(p.estoque / 6)} cx</small>` : "")}</span></button>`; }).join("") || empty("Nenhum produto encontrado.", can("ajuste") ? "Cadastre um produto ou importe sua planilha." : "")}</div>`;
}
function vEstoque() {
  if (ui.fTipo && !FILTROS_EST.includes(ui.fTipo) && !cats().some(c => c.id === ui.fTipo)) ui.fTipo = "todos";
  const f = [["todos", "Todos"], ...cats().map(c => [c.id, c.l]), ["baixo", "Estoque baixo"], ["zero", "Sem estoque"], ["inativos", "Inativos"]];
  const qk = (can("ajuste") ? [`<button data-a="go" data-r="inventario">${ico("clip")}Inventário</button>`, `<button data-a="go" data-r="movimentos">${ico("list")}Movimentos</button>`, ...(ehFood() ? [`<button data-a="go" data-r="receitas">${ico("clip")}Receitas</button>`] : []), `<button data-a="go" data-r="importar">${ico("upload")}Importar</button>`, `<button data-a="exportProd">${ico("download")}Exportar</button>`] : []).concat(can("vendas") ? [`<button data-a="abrirCatalogo">${ico("file")}Catálogo</button>`] : []);
  const novo = can("ajuste") ? `<button class="btn sm" data-a="sheet" data-k="prodForm">+ Produto</button>` : "";
  let h = head("Estoque", ehVinho() ? "Produtos e garrafas" : "Produtos", { action: DESK() ? `<div class="hdr-actions">${qk.map(b => b.replace("<button ", '<button class="btn sm line" ')).join("")}${novo}</div>` : novo }) + banners();
  if (qk.length && !DESK()) h += `<div class="quick ${qk.length >= 5 ? "five" : qk.length === 4 ? "" : qk.length === 3 ? "three" : qk.length === 2 ? "two" : "one"}">${qk.join("")}</div>`;
  h += toolbar(`<label class="search" style="margin-top:10px">${ico("search", 18)}<input id="eq" type="search" placeholder="${ehVinho() ? "Nome, uva, país, código ou local" : "Nome, marca, referência, código ou local"}" value="${esc(ui.q)}" aria-label="Buscar produto"><button class="scanbtn" data-a="scan" aria-label="Ler código de barras">${ico("scan", 18)}</button></label>
  <div class="chips">${f.map(([k, l]) => `<button class="chip" data-a="ef" data-id="${k}" aria-pressed="${ui.fTipo === k}">${FILTROS_EST.includes(k) ? "" : `<i style="background:${esc(catDe(k).c)}"></i>`}${esc(l)}</button>`).join("")}</div>`) + `
  <div id="elist">${prodList()}</div>`;
  return h;
}
function invLista() { return S.prod.filter(p => p.ativo !== false).sort((a, b) => (a.loc || "").localeCompare(b.loc || "") || a.nome.localeCompare(b.nome)); }
function vInventario() {
  invCarregar();
  const todos = invLista(), feitos = todos.filter(p => invContado(p.id)).length, falta = todos.length - feitos, q = norm(ui.invQ);
  let h = head("Inventário", ui.invModo === "geral" ? "Contagem geral do estoque" : "Contagem de um produto", { back: true, action: `<button class="btn sm line" data-a="go" data-r="movimentos">${ico("list", 16)}Movimentos</button>` }) + banners();
  h += `<div class="seg" style="margin-bottom:12px">${[["geral", "Contagem geral"], ["individual", "Contagem individual"]].map(([k, l]) => `<button data-a="invModo" data-id="${k}" aria-pressed="${ui.invModo === k}">${l}</button>`).join("")}</div>`;
  const busca = `<label class="search" style="margin-bottom:10px">${ico("search", 18)}<input id="invQ" type="search" placeholder="Buscar produto, código ou local" value="${esc(ui.invQ)}" aria-label="Buscar produto"><button class="scanbtn" data-a="scan" aria-label="Ler código de barras">${ico("scan", 18)}</button></label>`;
  const filtra = p => !q || norm([p.nome, p.ean, p.loc, p.ref, p.marca, p.produtor].filter(Boolean).join(" ")).includes(q);
  if (ui.invModo === "individual") {
    h += `<p class="hint" style="margin:0 2px 12px">Escolha o produto, conte na prateleira e salve. A diferença vira um ajuste no histórico na hora, sem esperar o resto.</p>` + busca;
    h += `<div class="list" id="invlist">${todos.filter(filtra).map(p => `<button class="row" data-a="sheet" data-k="contagem" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.loc ? esc(p.loc) + " · " : ""}sistema ${p.estoque} un.</small></span>${ico("chev", 18)}</button>`).join("") || empty("Nenhum produto encontrado.", "")}</div>`;
    return h;
  }
  const pc = todos.length ? Math.round(feitos / todos.length * 100) : 0;
  h += `<div class="invprog"><div><b>${feitos} de ${todos.length}</b> contados${falta ? ` · faltam ${falta}` : " · tudo contado"}</div><div class="bar"><i style="width:${pc}%"></i></div></div>`;
  h += `<p class="hint" style="margin:0 2px 10px">Digite o total de cada produto, toque em ${ico("check", 14)} se bater com o sistema, ou bipe os códigos (cada leitura soma 1). <b class="invleg pend">Cinza</b> falta contar, <b class="invleg ok">verde</b> já contado. Só dá para finalizar com todos contados. A contagem fica salva neste aparelho até você finalizar.</p>`;
  h += busca + `<div class="chips tight">${[["todos", `Todos (${todos.length})`], ["faltam", `Faltam (${falta})`], ["contados", `Contados (${feitos})`]].map(([k, l]) => `<button class="chip" data-a="invF" data-id="${k}" aria-pressed="${ui.invF === k}">${l}</button>`).join("")}</div>`;
  const vis = todos.filter(filtra).filter(p => ui.invF === "todos" || (ui.invF === "faltam" ? !invContado(p.id) : invContado(p.id)));
  h += `<div class="list" id="invlist" style="margin-top:10px">${vis.map(invRow).join("") || empty(ui.invF === "faltam" ? "Nenhum produto falta contar." : "Nenhum produto aqui.", "")}</div>`;
  if (feitos) h += `<button class="btn line block" style="margin-top:14px" data-a="invDescartar">Recomeçar a contagem</button>`;
  h += `<div class="ofoot" id="ifoot">${invFoot()}</div>`;
  return h;
}
function invRow(p) {
  const ok = invContado(p.id), v = ok ? ui.inv[p.id] : "", d = ok ? r4(invNum(v) - p.estoque) : 0;
  return `<div class="irow ${ok ? "ok" : "pend"}" data-row="${p.id}"><span class="ist" aria-hidden="true">${ok ? ico("check", 16) : ""}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.loc ? esc(p.loc) + " · " : ""}sistema ${p.estoque}${ok ? (d ? ` · <span class="idf">diferença ${d > 0 ? "+" : "−"}${Math.abs(d)}</span>` : " · confere") : " · falta contar"}</small></span><button class="iok" data-a="invOk" data-id="${p.id}" aria-label="Confere com o sistema: ${p.estoque}" title="Confere com o sistema">${ico("check", 18)}</button><input type="number" inputmode="numeric" min="0" data-inv="${p.id}" value="${esc(v)}" placeholder="Qtd." aria-label="Contado de ${esc(p.nome)}"></div>`;
}
function invFoot() {
  const list = invLista(), feitos = list.filter(p => invContado(p.id)), falta = list.length - feitos.length, diffs = feitos.filter(p => invNum(ui.inv[p.id]) !== p.estoque);
  return `<div><small>${falta ? `faltam ${falta} · ` : ""}${diffs.length} ${diffs.length === 1 ? "diferença" : "diferenças"}</small><b>${feitos.length}/${list.length}</b></div><button class="btn" data-a="finInv" ${falta || !list.length ? "disabled" : ""}>${falta ? `Faltam ${falta}` : "Finalizar inventário"}</button>`;
}

/* ---- Mais ---- */
function vMais() {
  const m = ME(); if (!m) return vSemAcesso();
  const it = (r, icon, t, s, perm) => perm === false ? "" : `<button data-a="go" data-r="${r}">${ico(icon)}<span class="wmain"><b>${t}</b><small>${s}</small></span>${ico("chev", 18)}</button>`;
  const D = DESK(); // no computador cadastros e gestão já estão na barra lateral
  let h = head(D ? "Conta e ajustes" : "Mais", esc(S.emp ? S.emp.nome : "")) + banners();
  h += `<div class="row"><span class="avatar">${initials(m.nome)}</span><span class="wmain"><b>${esc(m.nome)}</b><small>${PAPEIS[m.papel]}${m.comissao ? ` · comissão ${m.comissao}%` : ""}</small></span></div>`;
  if (MODE === "demo") h += `<p class="sec">Ver o app como</p><div class="chips wrap tight">${S.mem.map(x => `<button class="chip" data-a="verComo" data-id="${x.id}" aria-pressed="${x.id === UID}">${esc(firstName(x.nome))} · ${PAPEIS[x.papel]}</button>`).join("")}</div><p class="hint">Na demonstração você pode trocar de usuário para ver o que cada papel enxerga.</p>`;
  if (!D) h += `<p class="sec">Cadastros</p><div class="menu">${it("clientes", "users", "Clientes", "Ficha, crédito, histórico e consignação", can("clientes"))}${it("fornecedores", "truck", "Fornecedores", "Contatos, compras e contas a pagar", can("fornecedores"))}${it("estoque", "bottle", "Produtos", ehVinho() ? "Ficha do vinho, preços e estoque" : "Ficha, preços e estoque", can("estoque"))}</div>`;
  const op = it("compras", "cart", "Compras", "Pedidos a fornecedores e recebimento", can("compras")) + it("financeiro", "wallet", "Financeiro", "Contas a receber, a pagar e fluxo de caixa", can("receber") || can("pagar")) + it("relatorios", "chart", "Relatórios", "Vendas, curva ABC, margem, comissões e atrasos", can("relatorios")) + it("movimentos", "list", "Movimentos de estoque", "Tudo o que aconteceu com cada produto", can("estoque")) + (ehFood() ? it("receitas", "clip", "Receitas e produção", "Fichas técnicas, custo real e produção", can("estoque")) : "");
  const fis = temFiscal() ? it("notas", "receipt", "Notas fiscais", "NF-e, NFC-e e consignação emitidas", can("fiscal")) + it("fiscal", "shield", "Configuração fiscal", "Dados do emitente, tributação e credenciais", can("empresa")) : ""; // nota fiscal brasileira
  const cat = can("vendas") ? `<button data-a="abrirCatalogo">${ico("file")}<span class="wmain"><b>Catálogo de produtos</b><small>PDF com o estoque e os preços do cliente</small></span>${ico("chev", 18)}</button>` : "";
  if ((op || cat) && !D) h += `<p class="sec">Gestão</p><div class="menu">${cat}${op}</div>`;
  if (fis) h += `<p class="sec">Fiscal</p><div class="menu">${fis}</div>`;
  h += `<p class="sec">Aparência</p><div class="seg theme-seg">${[["light", "Claro"], ["dark", "Escuro"], ["auto", "Automático"]].map(([k, l]) => `<button data-a="tema" data-id="${k}" aria-pressed="${temaAtual() === k}">${l}</button>`).join("")}</div>`;
  h += `<p class="sec">Idioma</p>${idiomaSeg()}`;
  h += `<p class="sec">Empresa</p><div class="menu">${it("equipe", "users", "Equipe e permissões", "Usuários, papéis e código de acesso", true)}${it("empresa", "building", "Dados da empresa", "Cadastro, backup e integrações", can("empresa"))}${it("atividade", "list", "Atividade", "Quem fez o quê e quando", can("atividade"))}${it("importar", "upload", "Importar planilha", "Produtos e clientes a partir de CSV", can("ajuste") || can("clientes"))}</div>`;
  h += `<p class="sec">Conta</p><div class="menu">${MODE === "supa" ? it("conta", "user", "Minha conta", "E-mail, sair e exclusão da conta", true) : ""}${it("termos", "file", "Termos e privacidade", "Como tratamos seus dados (LGPD)", true)}</div>`;
  h += `<div class="menu" style="margin-top:16px"><button data-a="sair">${ico("logout")}<span class="wmain"><b>${MODE === "demo" ? "Sair da demonstração" : "Trocar de empresa"}</b><small>${MODE === "demo" ? "Volta para a tela inicial" : "Ver suas empresas ou entrar em outra"}</small></span></button>${MODE === "demo" ? `<button data-a="resetDemo">${ico("upload")}<span class="wmain"><b>Restaurar dados de exemplo</b><small>Desfaz tudo o que foi alterado na demonstração</small></span></button>` : ""}</div>`;
  return h;
}

/* ---- Clientes ---- */
function vClientes() {
  const f = ui.cFiltro, q = norm(ui.cq);
  const list = S.cli.filter(c => c.ativo !== false).map(c => ({ c, s: cliStats(c.id) })).filter(({ c, s }) => {
    if (f === "vencido" && !(s.vencido > 0)) return false;
    if (f === "consig" && !(s.consQ > 0)) return false;
    if (f === "limite" && !(s.disp != null && s.disp < 0)) return false;
    return !q || norm([c.nome, c.razao, c.doc, c.cidade, c.contato].join(" ")).includes(q);
  }).sort((a, b) => b.s.vencido - a.s.vencido || b.s.aberto - a.s.aberto || a.c.nome.localeCompare(b.c.nome));
  return head("Clientes", "Pessoa jurídica e física", { back: ui.stack.length > 0, action: `<button class="btn sm" data-a="sheet" data-k="cliForm">+ Cliente</button>` }) + banners() +
    toolbar(`<label class="search">${ico("search", 18)}<input id="cq" type="search" placeholder="Nome, ${PC().docCli.split(" ")[0]}, cidade ou contato" value="${esc(ui.cq)}" aria-label="Buscar cliente"></label>
    <div class="chips">${[["todos", "Todos"], ["vencido", "Com vencido"], ["consig", "Em consignação"], ["limite", "Acima do limite"]].map(([k, l]) => `<button class="chip" data-a="cf" data-id="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>`) +
    (DESK() ? `<div id="clist"><p class="summary">${list.length} ${list.length === 1 ? "cliente" : "clientes"} · ${fmt(sum(list, x => x.s.aberto))} em aberto</p>${dtable([["Cliente"], ["Tipo"], ["Cidade"], ["Pedidos", "num"], ["Consignado", "num"], ["Em aberto", "num"], ["Situação"]],
      list.map(({ c, s }) => dtr(`data-a="go" data-r="cliente" data-id="${c.id}"`, [td(`<span class="pcell"><span class="avatar sm">${initials(c.nome)}</span><b>${esc(c.nome)}</b></span>`), td(esc(c.tipo), "muted"), td(esc(c.cidade || "—"), "muted"),
        td(s.n, "num"), td(s.consQ ? `${s.consQ} un.` : "—", "num"), td(fmt(s.aberto), "num"), td(s.vencido > 0 ? '<span class="pill bad">Vencido</span>' : s.aberto > 0 ? '<span class="pill info">Em aberto</span>' : '<span class="pill ok">Em dia</span>')])),
      empty("Nenhum cliente encontrado.", ""))}</div>` : "") + (DESK() ? "" : `
    <div class="list" id="clist">${list.map(({ c, s }) => `<button class="row" data-a="go" data-r="cliente" data-id="${c.id}"><span class="avatar">${initials(c.nome)}</span>
      <span class="wmain"><b>${esc(c.nome)}</b><small>${esc(c.tipo)}${c.cidade ? " · " + esc(c.cidade) : ""} · ${s.n} ${s.n === 1 ? "pedido" : "pedidos"}${s.consQ ? ` · ${s.consQ} un. consignadas` : ""}</small></span>
      <span class="right"><b>${fmt(s.aberto)}</b>${s.vencido > 0 ? '<span class="pill bad">Vencido</span>' : s.aberto > 0 ? '<span class="pill info">Em aberto</span>' : '<span class="pill ok">Em dia</span>'}</span></button>`).join("") || empty("Nenhum cliente encontrado.", "")}</div>`);
}
function catalogText(cl) {
  const tab = cl ? cl.tabela : "varejo";
  let t = `*${ehVinho() ? "Carta de vinhos" : "Catálogo"} · ${S.emp ? S.emp.nome : APP}*\nPreços ${TABELAS[tab] || "Varejo"} · ${fdy(today)}\n`;
  cats(true).forEach(ty => { const ps = S.prod.filter(p => p.ativo !== false && catDe(p.tipo).id === ty.id && p.estoque > 0); if (!ps.length) return; t += `\n*${catPlural(ty.id)}*\n`; ps.forEach(p => { t += `• ${p.nome}${p.safra && p.safra !== "NV" ? " " + p.safra : ""}${p.uva ? " (" + p.uva + ")" : ""} · ${fmt(preco(p, tab))}\n`; }); });
  return t;
}
function vCliente() {
  const c = Cl(ui.id); if (!c) return head("Cliente", "", { back: true }) + empty("Carregando…", "");
  const s = cliStats(c.id), peds = S.ped.filter(o => o.cli === c.id).sort((a, b) => (b.num || 0) - (a.num || 0));
  const cons = []; peds.filter(o => o.tipo === "consig" && o.status !== "cancelado").forEach(o => o.itens.forEach((i, ix) => { const l = i.q - (i.vend || 0) - (i.dev || 0); if (l > 0) cons.push({ o, i, ix, l }); }));
  let h = head(esc(c.nome), `${esc(c.tipo)}${c.doc ? " · " + esc(c.doc) : ""}`, { back: true, sm: true, action: `<button class="iconbtn" data-a="sheet" data-k="cliForm" data-id="${c.id}" aria-label="Editar cliente">${ico("edit", 18)}</button>` }) + banners();
  const i0 = h.length; // no computador: indicadores numa linha; pedidos à esquerda; ações e dados à direita
  h += `<div class="hero"><span class="hl">Saldo em aberto</span><span class="big">${fmt(s.aberto)}</span><span class="sub">${s.vencido > 0 ? `<b>${fmt(s.vencido)} vencido</b> há ${s.atraso} dias` : "Nenhum valor vencido"}</span></div>`;
  h += `<div class="stats"><div class="stat ${s.disp != null && s.disp < 0 ? "bad" : ""}"><span>Crédito disponível</span><b>${s.disp == null ? "Sem limite" : fmt0(s.disp)}</b><small>${s.limite ? "limite " + fmt0(s.limite) : "defina na ficha"}</small></div>
    <div class="stat"><span>Comprou no ano</span><b>${fmt0(s.ano)}</b><small>ticket médio ${fmt0(s.ticket)}</small></div>
    <div class="stat"><span>Em consignação</span><b>${s.consQ} un.</b><small>${fmt0(s.consV)} em produtos</small></div>
    <div class="stat"><span>Último pedido</span><b>${s.ult ? fd(s.ult) : "—"}</b><small>${s.ult ? `há ${diffDays(s.ult, today)} dias` : "nenhum ainda"}</small></div></div>`;
  const i1 = h.length;
  h += `<div class="quick">${can("vendas") ? `<button data-a="novoPedido" data-cli="${c.id}">${ico("order")}Pedido</button>` : ""}<button data-a="sheet" data-k="payPick" data-id="${c.id}" ${s.aberto > 0.004 && can("receber") ? "" : "disabled"}>${ico("cash")}Receber</button>
    <a href="${waLink(c.fone, `Olá${c.contato ? " " + c.contato : ""}! `)}" target="_blank" rel="noopener">${ico("whats")}WhatsApp</a>${can("vendas") ? `<button data-a="abrirCatalogo" data-id="${c.id}">${ico("file")}Catálogo</button>` : ""}</div>`;
  const i2 = h.length;
  h += condicoesHtml(c);
  if (cons.length) h += `<p class="sec">Em consignação <span class="count">${s.consQ} un.</span></p><div class="list">${cons.map(x => { const p = P(x.i.p) || { nome: "Produto", tipo: "outros" }; return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>#${x.o.num} · ${fd(x.o.data)} · acerto ${fd(x.o.venc)}</small>${can("vendas") ? `<span class="mini"><button class="btn sm" data-a="consig" data-m="vend" data-id="${x.o.id}" data-x="${x.ix}">Vendeu</button><button class="btn sm ghost" data-a="consig" data-m="dev" data-id="${x.o.id}" data-x="${x.ix}">Devolveu</button></span>` : ""}</span><span class="right"><b>${x.l}</b><small>com o cliente</small></span></div>`; }).join("")}</div>`;
  h += `<p class="sec">Pedidos <span class="count">${peds.length}</span></p>${DESK() ? pedTable(peds, "cli") : `<div class="list">${peds.map(pedRow).join("") || empty("Nenhum pedido ainda.", "")}</div>`}`;
  const i3 = h.length;
  h += `<p class="sec">Dados</p><dl class="specs"><div class="full"><dt>Razão social</dt><dd>${esc(c.razao || "—")}</dd></div><div><dt>Contato</dt><dd>${esc(c.contato || "—")}</dd></div><div><dt>Telefone</dt><dd>${esc(c.fone || "—")}</dd></div>
    <div><dt>E-mail</dt><dd>${esc(c.email || "—")}</dd></div><div><dt>Cidade</dt><dd>${esc(c.cidade || "—")}</dd></div><div><dt>Tabela</dt><dd>${TABELAS[c.tabela] || "Varejo"}</dd></div><div><dt>Limite</dt><dd>${c.limite ? fmt(c.limite) : "Sem limite"}</dd></div>
    <div class="full"><dt>${temFiscal() ? "Endereço fiscal" : "Endereço"}</dt><dd>${esc([c.logradouro && `${c.logradouro}, ${c.numero || "s/n"}`, c.bairro, c.cidade && `${c.cidade}/${c.uf || ""}`, c.cep].filter(Boolean).join(" · ") || c.endereco || "—")}</dd></div>${temFiscal() ? `<div><dt>Inscrição estadual</dt><dd>${esc(c.ie || "—")}</dd></div><div><dt>ICMS</dt><dd>${(IND_IE.find(x => x[0] === (c.indIE || "9")) || IND_IE[0])[1]}</dd></div>` : ""}${c.obs ? `<div class="full"><dt>Observações</dt><dd>${esc(c.obs)}</dd></div>` : ""}</dl>`;
  if (DESK()) return h.slice(0, i0) + `<div class="kpis-row">${h.slice(i0, i1)}</div>` + colunas(h.slice(i2, i3), h.slice(i1, i2) + h.slice(i3), "cliente");
  return h;
}

/* ---- Fornecedores ---- */
function fornStats(id) {
  const y = today.slice(0, 4), cs = S.comp.filter(c => c.forn === id && c.status !== "cancelado");
  return { n: cs.length, ano: sum(cs.filter(c => c.data.slice(0, 4) === y), c => compCalc(c).total), aberto: sum(cs, c => compCalc(c).aberto), pend: cs.filter(c => c.status === "pedido").length };
}
function vFornecedores() {
  const list = S.forn.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  return head("Fornecedores", "Importadoras, vinícolas e distribuidores", { back: ui.stack.length > 0, action: `<button class="btn sm" data-a="sheet" data-k="fornForm">+ Fornecedor</button>` }) + banners() +
    (DESK() ? dtable([["Fornecedor"], ["Contato"], ["Telefone"], ["Compras", "num"], ["Comprado no ano", "num"], ["A pagar", "num"]], list.map(f => { const s = fornStats(f.id); return dtr(`data-a="go" data-r="fornecedor" data-id="${f.id}"`, [
      td(`<span class="pcell"><span class="avatar sm">${initials(f.nome)}</span><span><b>${esc(f.nome)}</b>${f.obs ? `<small>${esc(f.obs)}</small>` : ""}</span></span>`), td(esc(f.contato || "—"), "muted"), td(esc(f.fone || "—"), "muted nowrap"),
      td(s.n, "num"), td(fmt(s.ano), "num"), td(s.aberto > 0.004 ? `<b>${fmt(s.aberto)}</b>` : "—", "num")]); }), empty("Nenhum fornecedor cadastrado.", "")) :
    `<div class="list">${list.map(f => { const s = fornStats(f.id); return `<button class="row" data-a="go" data-r="fornecedor" data-id="${f.id}"><span class="avatar">${initials(f.nome)}</span><span class="wmain"><b>${esc(f.nome)}</b><small>${s.n} compras${f.obs ? " · " + esc(f.obs) : ""}</small></span><span class="right"><b>${fmt(s.aberto)}</b><small>a pagar</small></span></button>`; }).join("") || empty("Nenhum fornecedor cadastrado.", "")}</div>`);
}
function vFornecedor() {
  const f = Fo(ui.id); if (!f) return head("Fornecedor", "", { back: true }) + empty("Carregando…", "");
  const s = fornStats(f.id), cs = S.comp.filter(c => c.forn === f.id).sort((a, b) => b.num - a.num), ps = S.prod.filter(p => p.forn === f.id && p.ativo !== false);
  let h = head(esc(f.nome), esc(f.doc || "Fornecedor"), { back: true, sm: true, action: `<button class="iconbtn" data-a="sheet" data-k="fornForm" data-id="${f.id}" aria-label="Editar fornecedor">${ico("edit", 18)}</button>` }) + banners();
  const i0 = h.length;
  h += `<div class="stats"><div class="stat"><span>Comprado no ano</span><b>${fmt0(s.ano)}</b><small>${s.n} compras no total</small></div><div class="stat ${s.aberto ? "warn" : ""}"><span>A pagar</span><b>${fmt0(s.aberto)}</b><small>prazo médio ${f.prazo || 30} dias</small></div></div>`;
  const i1 = h.length;
  h += `<div class="quick two"><button data-a="novaCompra" data-id="${f.id}" ${can("compras") ? "" : "disabled"}>${ico("cart")}Nova compra</button><a href="${waLink(f.fone, `Olá${f.contato ? " " + f.contato : ""}! `)}" target="_blank" rel="noopener">${ico("whats")}WhatsApp</a></div>`;
  const i2 = h.length;
  h += `<p class="sec">Compras</p>${DESK() ? compTable(cs) : `<div class="list">${cs.map(compRow).join("") || empty("Nenhuma compra registrada.", "")}</div>`}`;
  h += `<p class="sec">Produtos deste fornecedor <span class="count">${ps.length}</span></p><div class="list">${ps.map(p => `<button class="row" data-a="prod" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.estoque} un. · custo ${fmt(p.custo)}</small></span></button>`).join("") || empty("Nenhum produto ligado a este fornecedor.", "Cadastre os produtos dele aqui ou importe o XML da primeira nota.")}</div>${can("ajuste") ? `<button class="btn line block" style="margin-top:10px" data-a="novoProdForn" data-id="${f.id}">+ Novo produto deste fornecedor</button>` : ""}`;
  const i3 = h.length;
  h += `<p class="sec">Dados</p><dl class="specs"><div><dt>Contato</dt><dd>${esc(f.contato || "—")}</dd></div><div><dt>Telefone</dt><dd>${esc(f.fone || "—")}</dd></div><div><dt>E-mail</dt><dd>${esc(f.email || "—")}</dd></div><div><dt>Prazo</dt><dd>${f.prazo || 30} dias</dd></div>${f.obs ? `<div class="full"><dt>Observações</dt><dd>${esc(f.obs)}</dd></div>` : ""}</dl>`;
  if (DESK()) return h.slice(0, i0) + colunas(h.slice(i0, i1) + h.slice(i2, i3), h.slice(i1, i2) + h.slice(i3), "fornecedor");
  return h;
}

/* ---- Compras ---- */
function compRow(c) {
  const k = compCalc(c), f = Fo(c.forn);
  return `<button class="row ${c.status === "cancelado" ? "off" : ""}" data-a="go" data-r="compra" data-id="${c.id}"><span class="dot info">${ico("truck", 18)}</span><span class="wmain"><b>#${c.num} · ${esc(f ? f.nome : "Fornecedor")}</b><small>${fd(c.data)} · ${k.qtd} un.${c.status === "pedido" ? ` · previsão ${fd(c.prev)}` : ""}</small></span><span class="right"><b>${fmt(k.aberto > 0.004 ? k.aberto : k.total)}</b>${statusComp(k)}</span></button>`;
}
function compTable(list) {
  return dtable([["Compra"], ["Fornecedor"], ["Data"], ["Previsão"], ["Qtd.", "num"], ["Total", "num"], ["Em aberto", "num"], ["Situação"]], list.map(c => { const k = compCalc(c), f = Fo(c.forn);
    return dtr(`data-a="go" data-r="compra" data-id="${c.id}"`, [td(`<b>#${c.num}</b>`, "nowrap"), td(esc(f ? f.nome : "Fornecedor"), "strong"), td(fd(c.data), "muted"), td(c.status === "pedido" ? fd(c.prev) : "—", "muted"),
      td(k.qtd, "num"), td(fmt(k.total), "num"), td(k.aberto > 0.004 ? fmt(k.aberto) : "—", "num"), td(statusComp(k))], c.status === "cancelado" ? "off" : ""); }), empty("Nenhuma compra aqui.", ""), "t-comp");
}
function sugestoes() {
  const g = {};
  S.prod.filter(p => p.ativo !== false && p.estoque <= (p.min || 0)).forEach(p => {
    const pend = sum(S.comp.filter(c => c.status === "pedido"), c => sum(c.itens.filter(i => i.p === p.id), i => i.q));
    if (p.estoque + pend > (p.min || 0)) return;
    const k = p.forn || "sem"; g[k] = g[k] || []; g[k].push(p);
  });
  return g;
}
function vCompras() {
  const f = ui.kFiltro, list = S.comp.filter(c => { const k = compCalc(c); if (f === "abertas") return c.status === "pedido" || k.aberto > 0.004; if (f === "pedido") return c.status === "pedido"; return true; }).sort((a, b) => b.num - a.num);
  const sg = sugestoes();
  let h = head("Compras", "Pedidos a fornecedores", { back: ui.stack.length > 0, action: `<button class="btn sm" data-a="novaCompra">+ Compra</button>` }) + banners();
  if (can("ajuste") && temFiscal()) h += `<button class="row" data-a="xmlCompra"><span class="dot acc">${ico("file", 18)}</span><span class="wmain"><b>Importar XML da nota do fornecedor</b><small>Cria a compra, cadastra produtos novos e dá entrada no estoque</small></span>${ico("chev", 18)}</button><input type="file" id="xmlFile" accept=".xml,text/xml,application/xml" hidden>`;
  const ks = Object.keys(sg);
  if (ks.length) h += `<p class="sec">Sugestão de reposição</p><div class="list">${ks.map(k => { const fo = Fo(k); return `<div class="row"><span class="dot warn">!</span><span class="wmain"><b>${esc(fo ? fo.nome : "Sem fornecedor definido")}</b><small>${sg[k].length} ${sg[k].length === 1 ? "produto abaixo" : "produtos abaixo"} do mínimo: ${sg[k].slice(0, 3).map(p => esc(p.nome)).join(", ")}${sg[k].length > 3 ? "…" : ""}</small></span>${fo ? `<button class="btn sm" data-a="sugCompra" data-id="${k}">Criar</button>` : ""}</div>`; }).join("")}</div>`;
  h += `<div class="chips">${[["abertas", "Em aberto"], ["pedido", "Aguardando entrega"], ["todas", "Todas"]].map(([k, l]) => `<button class="chip" data-a="kf" data-id="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>`;
  h += DESK() ? compTable(list) : `<div class="list">${list.map(compRow).join("") || empty("Nenhuma compra aqui.", "")}</div>`;
  return h;
}
function vCompra() {
  const c = Co(ui.id); if (!c) return head("Compra", "", { back: true }) + empty("Carregando…", "");
  const k = compCalc(c), f = Fo(c.forn);
  let h = head(`Compra #${c.num}`, `${fdy(c.data)} · ${esc(f ? f.nome : "")}`, { back: true, sm: true, action: statusComp(k) }) + banners();
  h += `<div class="card"><div class="kv"><span>Fornecedor</span><b>${esc(f ? f.nome : "—")}</b></div><div class="kv"><span>Previsão de entrega</span><b>${fdy(c.prev)}</b></div>${c.recebidoEm ? `<div class="kv"><span>Recebida em</span><b>${fdy(c.recebidoEm)}</b></div>` : ""}<div class="kv"><span>Condição</span><b>${CONDS[c.cond] || "À vista"}</b></div></div>`;
  h += `<p class="sec">Itens</p><div class="list">${c.itens.map(i => { const p = P(i.p) || { nome: "Produto removido", tipo: "outros" }; return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${i.q} × ${fmt(i.custo)}</small></span><span class="right"><b>${fmt(i.q * i.custo)}</b></span></div>`; }).join("")}</div>`;
  h += `<div class="card" style="margin-top:12px"><div class="tot"><span>Total</span><span>${fmt(k.total)}</span></div>${c.status === "recebido" ? `<div class="tot"><span>Pago</span><span>${fmt(k.pago)}</span></div><div class="tot big"><span>A pagar</span><span>${fmt(k.aberto)}</span></div>` : ""}</div>`;
  if (k.parcelas.length) h += `<p class="sec">Parcelas</p><div class="list">${k.parcelas.map((p, ix) => `<div class="row"><span class="dot ${p.aberto <= 0.004 ? "good" : p.venc < today ? "bad" : "info"}">${ix + 1}</span><span class="wmain"><b>${fmt(p.valor)}</b><small>Vencimento ${fdy(p.venc)}</small></span>${p.aberto <= 0.004 ? '<span class="pill ok">Paga</span>' : p.venc < today ? '<span class="pill bad">Vencida</span>' : '<span class="pill info">Aberta</span>'}</div>`).join("")}</div>`;
  if ((c.pag || []).length) h += `<p class="sec">Pagamentos</p><div class="list">${c.pag.map(p => `<div class="row"><span class="dot good">${SIM()}</span><span class="wmain"><b>${fmt(p.valor)}</b><small>${p.forma} · ${fdy(p.data)} · ${esc(nomeDe(p.por))}</small></span></div>`).join("")}</div>`;
  if (c.obs) h += `<p class="sec">Observações</p><div class="card">${esc(c.obs)}</div>`;
  if (c.status === "pedido" && can("ajuste")) h += `<button class="btn block" data-a="sheet" data-k="receberCompra" data-id="${c.id}">Receber mercadoria</button>`;
  if (k.aberto > 0.004 && can("pagar")) h += `<button class="btn block" data-a="pay" data-src="comp" data-id="${c.id}">Registrar pagamento</button>`;
  let t = `*Pedido de compra #${c.num} · ${S.emp ? S.emp.nome : APP}*\n`; c.itens.forEach(i => { const p = P(i.p); t += `${i.q}× ${p ? p.nome : ""} · ${fmt(i.custo)}\n`; }); t += `Total: ${fmt(k.total)}\nCondição: ${CONDS[c.cond] || "À vista"}\nEntrega prevista: ${fdy(c.prev)}`;
  h += `<div class="btns"><a class="btn ghost" href="${waLink(f && f.fone, t)}" target="_blank" rel="noopener">${ico("whats", 18)}Enviar ao fornecedor</a>${c.status === "pedido" && can("compras") ? `<button class="btn danger" data-a="cancelCompra" data-id="${c.id}">Cancelar compra</button>` : ""}</div>`;
  return h;
}
function cdraftFoot() { const d = ui.cdraft, t = r2(sum(d.itens, i => (Number(i.q) || 0) * (parseMoney(i.custo) || 0))); return `<div><small>${sum(d.itens, i => Number(i.q) || 0)} un. · ${d.itens.length} itens</small><b>${fmt(t)}</b></div><button class="btn" data-a="salvarCompra" ${d.forn && d.itens.length ? "" : "disabled"}>${d.jaRecebido ? "Salvar e receber" : "Salvar pedido"}</button>`; }
function vNovaCompra() {
  if (!ui.cdraft) ui.cdraft = { forn: null, itens: [], prev: 7, cond: "30", obs: "", jaRecebido: false };
  const d = ui.cdraft, f = d.forn ? Fo(d.forn) : null;
  let h = head("Nova compra", "Pedido a fornecedor", { back: true }) + banners();
  const i0 = h.length;
  h += `<section class="card"><span class="lbl">Fornecedor</span><button class="picker" data-a="sheet" data-k="pickForn">${f ? `<span class="avatar">${initials(f.nome)}</span><span class="wmain"><b>${esc(f.nome)}</b><small>prazo ${f.prazo || 30} dias</small></span>` : `<span class="wmain"><b>Escolher fornecedor</b><small>Importadora, vinícola ou distribuidor</small></span>`}${ico("chev", 18)}</button></section>`;
  const i1 = h.length;
  h += `<span class="lbl" style="margin:16px 2px 8px">Itens</span><div class="list">${d.itens.map((i, ix) => { const p = P(i.p) || { nome: "Produto" }; return `<div class="crow"><span><b>${esc(p.nome)}</b><small>estoque ${p.estoque != null ? p.estoque : "—"}</small></span><input type="number" inputmode="numeric" min="1" data-ci="${ix}" data-cf="q" value="${esc(i.q)}" aria-label="Quantidade"><input inputmode="decimal" data-ci="${ix}" data-cf="custo" value="${esc(i.custo)}" aria-label="Custo unitário"><button class="xbtn" data-a="rmItemCompra" data-id="${ix}" aria-label="Remover item">×</button></div>`; }).join("")}</div>
    ${d.itens.length ? `<p class="hint">Quantidade e custo unitário (${SIM()}) de cada item.</p>` : ""}<button class="btn line block" style="margin-top:10px" data-a="sheet" data-k="pickProd">+ Adicionar produto</button>`;
  const i2 = h.length;
  h += `<section class="card" style="margin-top:14px"><span class="lbl">Condição de pagamento</span><div class="chips wrap tight">${Object.entries(CONDS).map(([k, l]) => `<button class="chip" data-a="kcond" data-id="${k}" aria-pressed="${d.cond === k}">${l}</button>`).join("")}</div>
    <span class="lbl" style="margin-top:14px">Entrega prevista em</span><div class="chips wrap tight">${[2, 5, 7, 15, 30].map(t => `<button class="chip" data-a="kprev" data-id="${t}" aria-pressed="${d.prev == t}">${t} dias</button>`).join("")}</div>
    ${can("ajuste") ? `<label class="toggle">Mercadoria já chegou<input type="checkbox" data-a="kreceb" ${d.jaRecebido ? "checked" : ""}></label>` : ""}
    <label class="field">Observações<input data-kd="obs" value="${esc(d.obs)}" placeholder="Ex: NF 4890"></label></section>`;
  const i3 = h.length;
  h += `<div class="ofoot" id="kfoot">${cdraftFoot()}</div>`;
  if (DESK()) return h.slice(0, i0) + colunas(h.slice(i1, i2), h.slice(i0, i1) + h.slice(i2, i3), "novo") + h.slice(i3);
  return h;
}

/* ---- Financeiro ---- */
function titRow(t) {
  return `<button class="row" data-a="titulo" data-src="${t.src}" data-id="${t.id}"><span class="dot ${t.status === "pago" ? "good" : t.status === "vencido" ? "bad" : "info"}">${t.src === "ped" ? "V" : t.src === "comp" ? "C" : "$"}</span>
    <span class="wmain"><b>${esc(t.quem || t.desc)}</b><small>${esc(t.quem ? t.desc : "")}${t.quem ? " · " : ""}venc. ${fdy(t.venc)}</small></span><span class="right"><b>${fmt(t.status === "pago" ? t.valor : t.aberto)}</b>${statusTit(t)}</span></button>`;
}
function titTable(list) {
  const orig = { ped: "Venda", comp: "Compra" };
  return dtable([["Vencimento"], ["Descrição"], ["Origem"], ["Valor", "num"], ["Em aberto", "num"], ["Situação"]], list.map(t => dtr(`data-a="titulo" data-src="${t.src}" data-id="${t.id}"`, [
    td(fdy(t.venc), "nowrap"), td(`<b>${esc(t.quem || t.desc)}</b>${t.quem ? `<small>${esc(t.desc)}</small>` : ""}`), td(orig[t.src] || "Lançamento", "muted"),
    td(fmt(t.valor), "num"), td(t.aberto > 0.004 ? `<b>${fmt(t.aberto)}</b>` : "—", "num"), td(statusTit(t))])), empty("Nada aqui.", ""));
}
function vFinanceiro() {
  const tabs = [can("receber") && ["receber", "A receber"], can("pagar") && ["pagar", "A pagar"], can("pagar") && can("receber") && ["fluxo", "Fluxo de caixa"]].filter(Boolean);
  if (!tabs.length) return noPerm();
  if (!tabs.some(t => t[0] === ui.finTab)) ui.finTab = tabs[0][0];
  const k = ui.finTab;
  let h = head("Financeiro", "Contas e fluxo de caixa", { back: ui.stack.length > 0, action: k !== "fluxo" && can("pagar") ? `<button class="btn sm" data-a="sheet" data-k="finForm" data-id="${k}">+ ${k === "pagar" ? "Despesa" : "Receita"}</button>` : "" }) + banners();
  h += `<div class="seg" style="margin-bottom:12px">${tabs.map(([t, l]) => `<button data-a="finTab" data-id="${t}" aria-pressed="${k === t}">${l}</button>`).join("")}</div>`;
  if (k === "fluxo") return h + vFluxo();
  const all = titulos(k), ab = all.filter(t => t.aberto > 0.004), ven = ab.filter(t => t.status === "vencido"), sete = ab.filter(t => t.status !== "vencido" && t.venc <= addDays(today, 7));
  h += `<div class="stats"><div class="stat"><span>Em aberto</span><b>${fmt0(sum(ab, t => t.aberto))}</b><small>${ab.length} títulos</small></div><div class="stat ${ven.length ? "bad" : "good"}"><span>Vencido</span><b>${fmt0(sum(ven, t => t.aberto))}</b><small>${ven.length} títulos</small></div></div>`;
  if (ven.length) {
    const b = [[1, 30], [31, 60], [61, 90], [91, 99999]].map(([a, z]) => sum(ven.filter(t => t.atraso >= a && t.atraso <= z), t => t.aberto)), mx = Math.max(1, ...b);
    h += `<div class="card" style="margin-top:10px"><span class="lbl">Atraso por faixa</span>${["1 a 30 dias", "31 a 60 dias", "61 a 90 dias", "Mais de 90 dias"].map((l, i) => `<div style="margin-top:8px"><div class="kv" style="border:0;padding:0"><span>${l}</span><b>${fmt(b[i])}</b></div><div class="hbar"><i class="bad" style="width:${Math.round(b[i] / mx * 100)}%"></i></div></div>`).join("")}</div>`;
  }
  const f = ui.finFiltro;
  let list = f === "vencidos" ? ven : f === "semana" ? sete : f === "pagos" ? all.filter(t => t.status === "pago") : ab;
  list = list.slice().sort((a, b) => f === "pagos" ? b.venc.localeCompare(a.venc) : a.venc.localeCompare(b.venc));
  h += `<div class="chips">${[["abertos", "Em aberto"], ["vencidos", "Vencidos"], ["semana", "Próximos 7 dias"], ["pagos", k === "pagar" ? "Pagos" : "Recebidos"]].map(([x, l]) => `<button class="chip" data-a="finF" data-id="${x}" aria-pressed="${f === x}">${l}</button>`).join("")}</div>`;
  h += `<p class="summary">${list.length} títulos · ${fmt(sum(list, t => f === "pagos" ? t.valor : t.aberto))}</p>${DESK() ? titTable(list.slice(0, 300)) : `<div class="list">${list.slice(0, 120).map(titRow).join("") || empty("Nada aqui.", "")}</div>`}`;
  return h;
}
function vFluxo() {
  const rec = titulos("receber").filter(t => t.aberto > 0.004), pag = titulos("pagar").filter(t => t.aberto > 0.004);
  const vR = sum(rec.filter(t => t.venc < today), t => t.aberto), vP = sum(pag.filter(t => t.venc < today), t => t.aberto);
  const sem = []; for (let w = 0; w < 5; w++) { const a = addDays(today, w * 7), z = addDays(today, w * 7 + 6); sem.push({ a, z, e: sum(rec.filter(t => t.venc >= a && t.venc <= z), t => t.aberto), s: sum(pag.filter(t => t.venc >= a && t.venc <= z), t => t.aberto) }); }
  const meses = []; const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), key = isoD(d).slice(0, 7); meses.push({ l: MESES[d.getMonth()], key, e: 0, s: 0 }); }
  const addPag = (arr, kk) => arr.forEach(p => { const m = meses.find(x => x.key === String(p.data).slice(0, 7)); if (m) m[kk] += p.valor; });
  S.ped.filter(o => o.status !== "cancelado").forEach(o => addPag(o.pag || [], "e")); S.comp.filter(c => c.status !== "cancelado").forEach(c => addPag(c.pag || [], "s")); // cancelado: valor devolvido, sai do caixa S.fin.forEach(f => addPag(f.pag || [], f.tipo === "receber" ? "e" : "s"));
  const mx = Math.max(1, ...meses.map(m => Math.max(m.e, m.s))), cur = meses[5];
  let h = `<div class="stats"><div class="stat good"><span>Recebido no mês</span><b>${fmt0(cur.e)}</b></div><div class="stat"><span>Pago no mês</span><b>${fmt0(cur.s)}</b></div></div>`;
  h += `<div class="card" style="margin-top:10px"><div class="kv"><span>Resultado do mês (caixa)</span><b class="${cur.e - cur.s < 0 ? "neg" : "pos"}">${fmt(cur.e - cur.s)}</b></div><div class="kv"><span>Atrasado a receber</span><b>${fmt(vR)}</b></div><div class="kv"><span>Atrasado a pagar</span><b>${fmt(vP)}</b></div></div>`;
  h += `<p class="sec">Próximas 5 semanas (previsto)</p><div class="tbl"><table><thead><tr><th>Semana</th><th class="n">Entradas</th><th class="n">Saídas</th><th class="n">Saldo</th></tr></thead><tbody>${sem.map(x => `<tr><td>${fd(x.a)} a ${fd(x.z)}</td><td class="n pos">${fmt0(x.e)}</td><td class="n neg">${fmt0(x.s)}</td><td class="n"><b>${fmt0(x.e - x.s)}</b></td></tr>`).join("")}</tbody></table></div>`;
  h += `<p class="sec">Realizado nos últimos 6 meses</p><div class="card"><div class="bars">${meses.map(m => `<div style="flex-direction:row;align-items:flex-end;gap:2px"><i style="height:${Math.round(m.e / mx * 100)}%;background:var(--good)" title="Entradas ${fmt0(m.e)}"></i><i style="height:${Math.round(m.s / mx * 100)}%;background:var(--bad)" title="Saídas ${fmt0(m.s)}"></i></div>`).join("")}</div><div class="barlbl">${meses.map(m => `<span>${m.l}</span>`).join("")}</div>
    <p class="hint"><span class="pos">■</span> entradas · <span class="neg">■</span> saídas · maior valor ${fmt0(mx)}</p></div>`;
  return h;
}

/* ---- Relatórios ---- */
function relData() {
  const r = periodo(ui.per), ps = vendasAtivas(r);
  const porProd = {}, porCli = {}, porVend = {}, porDia = {};
  ps.forEach(o => {
    const c = pedCalc(o), fator = c.bruto ? c.base / c.bruto : 1; // relatórios sem IVA (imposto não é faturamento)
    o.itens.forEach(i => { const q = soldQ(o, i); if (!q) return; const x = porProd[i.p] = porProd[i.p] || { q: 0, v: 0, c: 0 }; x.q += q; x.v += q * i.preco * fator; x.c += q * (i.custo || 0); });
    const y = porCli[o.cli] = porCli[o.cli] || { v: 0, n: 0 }; y.v += c.base; y.n++;
    const z = porVend[o.vendedor] = porVend[o.vendedor] || { v: 0, n: 0, m: 0 }; z.v += c.base; z.n++; z.m += c.margem;
    porDia[o.data] = (porDia[o.data] || 0) + c.base;
  });
  return { r, ps, porProd, porCli, porVend, porDia, total: sum(ps, o => pedCalc(o).base), custo: sum(ps, o => pedCalc(o).custo) };
}
function vRelatorios() {
  const d = relData(), t = ui.relTab;
  const tabs = [["vendas", "Vendas"], ["abc", "Curva ABC"], ["clientes", "Clientes"], ["equipe", "Vendedores"], ["margem", "Margem"], ["atraso", "Inadimplência"], ["parado", "Estoque parado"]];
  let h = head("Relatórios", d.r[2] + ` · ${fdy(d.r[0])} a ${fdy(d.r[1])}`, { back: ui.stack.length > 0, action: `<button class="iconbtn" data-a="exportRel" aria-label="Exportar relatório">${ico("download", 18)}</button>` }) + banners();
  h += `<div class="chips tight">${[["mes", "Este mês"], ["mesAnt", "Mês passado"], ["d90", "90 dias"], ["ano", "Ano"]].map(([k, l]) => `<button class="chip" data-a="per" data-id="${k}" aria-pressed="${ui.per === k}">${l}</button>`).join("")}</div>`;
  h += `<div class="chips">${tabs.map(([k, l]) => `<button class="chip" data-a="relTab" data-id="${k}" aria-pressed="${t === k}">${l}</button>`).join("")}</div>`;
  const R = relTable(d);
  if (t === "vendas") {
    const n = d.ps.length, mg = d.total - d.custo;
    h += `<div class="stats"><div class="stat"><span>Faturamento</span><b>${fmt0(d.total)}</b><small>${n} pedidos</small></div><div class="stat"><span>Ticket médio</span><b>${fmt0(n ? d.total / n : 0)}</b><small>${num(sum(Object.values(d.porProd), x => x.q))} un. vendidas</small></div>
      ${can("custo") ? `<div class="stat good"><span>Margem bruta</span><b>${fmt0(mg)}</b><small>${pct(d.total ? mg / d.total : 0)} do faturamento</small></div>` : ""}<div class="stat"><span>Clientes atendidos</span><b>${Object.keys(d.porCli).length}</b><small>no período</small></div></div>`;
    const buckets = barBuckets(d); const mx = Math.max(1, ...buckets.map(b => b.v));
    h += `<div class="card" style="margin-top:10px"><span class="lbl">Faturamento ${buckets.length > 20 ? "por dia" : buckets[0] && buckets[0].mes ? "por mês" : "por semana"}</span><div class="bars">${buckets.map(b => `<div><i style="height:${Math.round(b.v / mx * 100)}%" title="${b.l}: ${fmt0(b.v)}"></i></div>`).join("")}</div><div class="barlbl">${buckets.map((b, i) => `<span>${buckets.length > 12 ? (i % 5 === 0 ? b.l : "") : b.l}</span>`).join("")}</div><p class="hint">Maior valor: ${fmt0(mx)}</p></div>`;
  }
  h += `<div class="tbl" style="margin-top:10px"><table><thead><tr>${R.head.map((x, i) => `<th class="${i ? "n" : ""}">${x}</th>`).join("")}</tr></thead><tbody>${R.html.join("") || `<tr><td colspan="${R.head.length}" class="empty">Sem dados no período.</td></tr>`}</tbody></table></div>`;
  if (R.note) h += `<p class="hint">${R.note}</p>`;
  return h;
}
function barBuckets(d) {
  const [a, z] = d.r, days = diffDays(a, z) + 1, out = [];
  if (ui.per === "ano") { for (let m = 0; m <= new Date().getMonth(); m++) { const key = today.slice(0, 4) + "-" + pad(m + 1); out.push({ l: MESES[m], mes: true, v: sum(Object.entries(d.porDia).filter(([k]) => k.startsWith(key)), ([, v]) => v) }); } return out; }
  if (days > 40) { for (let w = 0; w * 7 < days; w++) { const s = addDays(a, w * 7), e = addDays(a, w * 7 + 6); out.push({ l: fd(s), v: sum(Object.entries(d.porDia).filter(([k]) => k >= s && k <= e), ([, v]) => v) }); } return out; }
  for (let i = 0; i < days; i++) { const k = addDays(a, i); out.push({ l: k.slice(8), v: d.porDia[k] || 0 }); }
  return out;
}
function relTable(d) {
  const t = ui.relTab, rows = [], html = [];
  if (t === "vendas" || t === "abc") {
    const arr = Object.entries(d.porProd).map(([id, x]) => ({ p: P(id), ...x })).filter(x => x.p).sort((a, b) => b.v - a.v);
    const tot = sum(arr, x => x.v) || 1; let acc = 0;
    arr.forEach(x => { acc += x.v; const cl = acc / tot <= 0.8 ? "A" : acc / tot <= 0.95 ? "B" : "C"; rows.push([x.p.nome, x.q, r2(x.v), pct(x.v / tot), cl]); html.push(`<tr><td>${esc(x.p.nome)}</td><td class="n">${x.q}</td><td class="n">${fmt0(x.v)}</td><td class="n">${pct(x.v / tot)}</td><td class="n"><span class="pill ${cl === "A" ? "ok" : cl === "B" ? "info" : "mute"}">${cl}</span></td></tr>`); });
    return { head: ["Produto", "Un.", "Receita", "%", "Classe"], rows, html, note: t === "abc" ? "Classe A: produtos que somam 80% da receita. B: os próximos 15%. C: o restante. Priorize estoque e negociação dos itens A." : "" };
  }
  if (t === "clientes") {
    Object.entries(d.porCli).map(([id, x]) => ({ c: Cl(id), ...x })).filter(x => x.c).sort((a, b) => b.v - a.v).forEach(x => { const s = cliStats(x.c.id); rows.push([x.c.nome, x.n, r2(x.v), r2(x.v / x.n), r2(s.aberto)]); html.push(`<tr><td>${esc(x.c.nome)}</td><td class="n">${x.n}</td><td class="n">${fmt0(x.v)}</td><td class="n">${fmt0(x.v / x.n)}</td><td class="n ${s.vencido ? "neg" : ""}">${fmt0(s.aberto)}</td></tr>`); });
    return { head: ["Cliente", "Pedidos", "Comprou", "Ticket", "Em aberto"], rows, html };
  }
  if (t === "equipe") {
    Object.entries(d.porVend).map(([id, x]) => ({ m: Mb(id), id, ...x })).sort((a, b) => b.v - a.v).forEach(x => { const pc = x.m ? x.m.comissao || 0 : 0; rows.push([x.m ? x.m.nome : "Removido", x.n, r2(x.v), pc + "%", r2(x.v * pc / 100)]); html.push(`<tr><td>${esc(x.m ? x.m.nome : "Removido")}</td><td class="n">${x.n}</td><td class="n">${fmt0(x.v)}</td><td class="n">${pc}%</td><td class="n"><b>${fmt(x.v * pc / 100)}</b></td></tr>`); });
    return { head: ["Vendedor", "Pedidos", "Vendas", "Comissão", "A pagar"], rows, html, note: "Comissão calculada sobre o faturado no período. Ajuste o percentual de cada vendedor em Equipe." };
  }
  if (t === "margem") {
    if (!can("custo")) return { head: ["Margem"], rows: [], html: [`<tr><td>Seu papel não vê custos.</td></tr>`] };
    Object.entries(d.porProd).map(([id, x]) => ({ p: P(id), ...x })).filter(x => x.p).sort((a, b) => (b.v - b.c) - (a.v - a.c)).forEach(x => { const m = x.v - x.c; rows.push([x.p.nome, r2(x.v), r2(x.c), r2(m), pct(x.v ? m / x.v : 0)]); html.push(`<tr><td>${esc(x.p.nome)}</td><td class="n">${fmt0(x.v)}</td><td class="n">${fmt0(x.c)}</td><td class="n"><b>${fmt0(m)}</b></td><td class="n">${pct(x.v ? m / x.v : 0)}</td></tr>`); });
    return { head: ["Produto", "Receita", "Custo", "Margem", "%"], rows, html, note: "Custo registrado no momento de cada venda." };
  }
  if (t === "atraso") {
    const g = {}; titulos("receber").filter(x => x.status === "vencido").forEach(x => { const k = x.quem; g[k] = g[k] || { v: 0, n: 0, a: 0 }; g[k].v += x.aberto; g[k].n++; g[k].a = Math.max(g[k].a, x.atraso); });
    Object.entries(g).sort((a, b) => b[1].v - a[1].v).forEach(([k, x]) => { rows.push([k, x.n, r2(x.v), x.a]); html.push(`<tr><td>${esc(k)}</td><td class="n">${x.n}</td><td class="n neg">${fmt(x.v)}</td><td class="n">${x.a} dias</td></tr>`); });
    return { head: ["Cliente", "Títulos", "Vencido", "Maior atraso"], rows, html, note: "Posição de hoje, independente do período escolhido." };
  }
  S.prod.filter(p => p.ativo !== false && p.estoque > 0).map(p => ({ p, u: ultimaSaida(p.id) })).filter(x => !x.u || diffDays(x.u, today) >= 60).sort((a, b) => b.p.estoque * (b.p.custo || 0) - a.p.estoque * (a.p.custo || 0)).forEach(x => { const v = x.p.estoque * (can("custo") ? x.p.custo || 0 : preco(x.p, "varejo")); rows.push([x.p.nome, x.p.estoque, r2(v), x.u ? fdy(x.u) : "Nunca"]); html.push(`<tr><td>${esc(x.p.nome)}</td><td class="n">${x.p.estoque}</td><td class="n">${fmt0(v)}</td><td class="n">${x.u ? fdy(x.u) : "Nunca"}</td></tr>`); });
  return { head: ["Produto", "Estoque", "Valor parado", "Última saída"], rows, html, note: "Produtos com estoque e sem venda há 60 dias ou mais. Bons candidatos a promoção ou consignação." };
}

/* ---- Equipe, empresa, atividade, importar ---- */
function vEquipe() {
  const adm = can("equipe");
  let h = head("Equipe", "Usuários e permissões", { back: ui.stack.length > 0, action: adm && (MODE === "supa" || MODE === "demo") ? `<button class="btn sm" data-a="sheet" data-k="novoMembro">+ Adicionar</button>` : "" }) + banners();
  if (adm && S.emp) h += `<div class="card"><span class="lbl">Código de acesso da empresa</span><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="code">${esc(S.emp.codigo || "—")}</span><button class="btn sm ghost" data-a="copyCode">${ico("copy", 16)}Copiar</button></div>
    ${MODE === "cloud" ? `<p class="hint">Para convidar alguém: 1) no claude.ai, compartilhe este app com o e-mail da pessoa como <b>Editor</b>; 2) envie este código. Ela entra como Vendedor e você ajusta o papel aqui.</p>` : `<p class="hint">Para quem ainda não tem conta, toque em <b>+ Adicionar</b> e crie o acesso com e-mail e senha temporária. Quem já usa o ${APP} entra com este código, como Vendedor, e você ajusta o papel aqui.</p>`}</div>`;
  h += `<p class="sec">Membros <span class="count">${S.mem.length}</span></p><div class="list">${S.mem.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(m => `<button class="row" ${adm ? `data-a="sheet" data-k="membro" data-id="${m.id}"` : "disabled"}><span class="avatar">${initials(m.nome)}</span><span class="wmain"><b>${esc(m.nome)}${m.id === UID ? " (você)" : ""}</b><small>${PAPEIS[m.papel]}${m.comissao ? ` · comissão ${m.comissao}%` : ""}</small></span>${adm ? ico("chev", 18) : ""}</button>`).join("")}</div>`;
  h += `<p class="sec">O que cada papel pode fazer</p><div class="tbl"><table><thead><tr><th>Área</th><th class="n">Adm</th><th class="n">Ger</th><th class="n">Vend</th><th class="n">Est</th></tr></thead><tbody>${[["Vendas e clientes", "vendas"], ["Receber pagamentos", "receber"], ["Estoque (ver)", "estoque"], ["Ajustar estoque", "ajuste"], ["Ver custos e margem", "custo"], ["Compras", "compras"], ["Contas a pagar", "pagar"], ["Relatórios", "relatorios"], ["Cancelar pedidos", "cancelar"], ["Equipe e empresa", "equipe"]].map(([l, p]) => `<tr><td>${l}</td>${["admin", "gerente", "vendedor", "estoque"].map(r => `<td class="n">${PERMS[r].includes(p) ? '<span class="pos">✓</span>' : '<span style="color:var(--muted)">–</span>'}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="hint">As permissões organizam o uso no dia a dia. No piloto, quem tem acesso de Editor ao app tecnicamente pode ler todos os dados da empresa.</p>`;
  return h;
}
function vEmpresa() {
  const e = S.emp || {};
  let h = head("Empresa", "Cadastro e dados", { back: ui.stack.length > 0, action: `<button class="iconbtn" data-a="sheet" data-k="empForm" aria-label="Editar empresa">${ico("edit", 18)}</button>` }) + banners();
  h += `<dl class="specs"><div class="full"><dt>Nome</dt><dd>${esc(e.nome || "—")}</dd></div><div><dt>País</dt><dd>${PC().l}</dd></div><div><dt>${PC().docEmp}</dt><dd>${esc(e.cnpj || "—")}</dd></div><div><dt>Cidade</dt><dd>${esc(e.cidade || "—")}</dd></div>${ivaTaxa() ? `<div><dt>IVA</dt><dd>${ivaPadrao() ? "Somado nos pedidos" : "Incluído nos preços"}</dd></div>` : ""}<div><dt>Telefone</dt><dd>${esc(e.fone || "—")}</dd></div><div><dt>Desde</dt><dd>${fdy(e.criadoEm)}</dd></div></dl>`;
  h += `<p class="sec">Seus dados</p><div class="menu"><button data-a="backup">${ico("download")}<span class="wmain"><b>Exportar backup completo</b><small>Todos os cadastros, pedidos e lançamentos em um arquivo</small></span></button><button data-a="go" data-r="importar">${ico("upload")}<span class="wmain"><b>Importar planilha</b><small>Produtos e clientes a partir de CSV</small></span></button>${can("empresa") ? `<button data-a="go" data-r="categorias">${ico("tag")}<span class="wmain"><b>Categorias de produto</b><small>${esc(RUBROS[rubro()].l)} · ${cats().length} categorias</small></span></button>` : ""}</div>`;
  if (MODE === "supa" && e.plano) h += `<p class="sec">Plano</p><div class="card plan"><span class="wmain"><b>${e.plano === "ativo" ? "Plano ativo" : e.plano === "teste" ? "Teste grátis" : e.plano === "cancelado" ? "Assinatura cancelada" : "Bloqueado"}</b><small>${e.plano === "teste" ? "até " + fdy(e.teste_ate) : e.plano === "ativo" ? "Obrigado por usar o " + APP : "Fale com o suporte"}</small></span><span class="pill ${e.plano === "ativo" ? "ok" : e.plano === "teste" ? "info" : "bad"}">${e.plano}</span></div>`;
  h += `<p class="sec">Integrações</p><div class="menu">${temFiscal() ? `<button data-a="go" data-r="fiscal">${ico("receipt")}<span class="wmain"><b>Nota fiscal (NF-e e NFC-e)</b><small>Via Focus NFe, com o certificado A1 da empresa</small></span><span class="pill ${MODE === "supa" ? "ok" : "mute"}">${MODE === "supa" ? "Disponível" : "No app Android"}</span></button>` : `<div class="row" style="border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none"><span class="wmain"><b>${paisEmp() === "MX" ? "Factura electrónica (CFDI 4.0)" : "Faturas e impostos (sales tax)"}</b><small>Emissão fiscal para ${PC().l}</small></span><span class="pill mute">Em breve</span></div>`}<div class="row" style="border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none"><span class="wmain"><b>Código de barras</b><small>Câmera do celular, leitor USB ou Bluetooth</small></span><span class="pill ok">Ativo</span></div>${[...(temFiscal() ? [["Boletos e Pix cobrança", "Geração e baixa automática"]] : []), ["Loja virtual e catálogo online", "Pedidos de clientes direto no app"]].map(([t, s]) => `<div class="row" style="border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none"><span class="wmain"><b>${t}</b><small>${s}</small></span><span class="pill mute">Em breve</span></div>`).join("")}</div>`;
  return h;
}
/* ---- Categorias de produto (Mais → Empresa → Categorias) ---- */
function vCategorias() {
  const l = cats(true), n = id => S.prod.filter(p => catDe(p.tipo).id === id).length;
  let h = head("Categorias", RUBROS[rubro()].l, { back: ui.stack.length > 0, action: `<button class="btn sm" data-a="sheet" data-k="catForm">+ Nova</button>` }) + banners();
  h += `<p class="hint">Aparecem nos filtros do estoque, no cadastro de produto e no catálogo, nesta ordem. Toque para editar; use as setas para reordenar.</p>`;
  h += `<div class="list">${l.map((c, i) => { const q = n(c.id); return `<div class="row catrow${c.arq ? " arq" : ""}"><button class="catmain" data-a="sheet" data-k="catForm" data-id="${esc(c.id)}"><span class="catdot" style="background:${esc(c.c)}"></span><span class="wmain"><b>${esc(c.l)}</b><small>${q} produto${q === 1 ? "" : "s"}${c.ncm ? " · NCM " + esc(c.ncm) : ""}${c.min ? " · mín. " + c.min : ""}${c.arq ? " · arquivada" : ""}${c.id === "outros" ? " · fixa" : ""}</small></span></button><span class="ord"><button class="iconbtn sm" data-a="catMover" data-id="${esc(c.id)}" data-d="-1" aria-label="Subir ${esc(c.l)}" ${i === 0 ? "disabled" : ""}>${ico("up", 18)}</button><button class="iconbtn sm" data-a="catMover" data-id="${esc(c.id)}" data-d="1" aria-label="Descer ${esc(c.l)}" ${i === l.length - 1 ? "disabled" : ""}>${ico("down", 18)}</button></span></div>`; }).join("")}</div>`;
  h += `<p class="sec">Ramo da empresa</p><div class="menu"><button data-a="sheet" data-k="rubroForm">${ico("building")}<span class="wmain"><b>${esc(RUBROS[rubro()].l)}</b><small>Define os campos da ficha do produto e as categorias sugeridas</small></span>${ico("chev", 18)}</button></div>`;
  return h;
}
/* ---- Movimentos de estoque (tipo MB51 / kardex): tudo o que aconteceu com cada produto ---- */
const MOV_PER = [["d30", "30 dias", 30], ["d90", "90 dias", 90], ["ano", "12 meses", 365], ["tudo", "Tudo", 0]];
function movDesde() { const p = MOV_PER.find(x => x[0] === ui.movPer) || MOV_PER[1]; return p[2] ? addDays(today, -(p[2] - 1)) : ""; }
function movFonte() {
  const key = (ui.movP || "") + "|" + ui.movPer;
  if (MODE !== "supa") return { rows: S.mov, carregando: false };
  if (ui.movRemoto && ui.movRemoto.key === key) return { rows: ui.movRemoto.rows || S.mov, carregando: !ui.movRemoto.rows, erro: ui.movRemoto.erro };
  ui.movRemoto = { key, rows: null };
  const desde = movDesde();
  SupaBE.movs(ui.movP || null, desde ? desde + "T00:00:00" : "").then(rows => { if (ui.movRemoto && ui.movRemoto.key === key) { ui.movRemoto.rows = rows; if (ui.route === "movimentos") render(); } })
    .catch(e => { if (ui.movRemoto && ui.movRemoto.key === key) { ui.movRemoto.rows = S.mov; ui.movRemoto.erro = true; if (ui.route === "movimentos") render(); } Erros.enviar("rede", String((e && e.message) || e), e && e.stack, { tela: "movimentos" }); });
  return { rows: S.mov, carregando: true };
}
function movDoc(e) {
  const o = e.ref && S.ped.find(x => x.id === e.ref); if (o) return { t: `${tipoPed(o.tipo)} #${o.num}`, a: `data-a="go" data-r="pedido" data-id="${o.id}"` };
  const c = e.ref && S.comp.find(x => x.id === e.ref); if (c) return { t: `Compra #${c.num}`, a: `data-a="go" data-r="compra" data-id="${c.id}"` };
  return { t: "", a: "" };
}
/* Uma linha por produto e movimento, do mais novo para o mais antigo, com o saldo depois de cada um */
function movLinhas() {
  const fonte = movFonte(), desde = movDesde(), pid = ui.movP;
  const regs = (fonte.rows || []).filter(e => Array.isArray(e.ps) && e.ps.length && (!desde || String(e.ts).slice(0, 10) >= desde) && (!pid || e.ps.includes(pid))).slice().sort(byTs);
  const out = [];
  const saldo = {}; // saldo corrente por produto, voltando no tempo a partir do estoque atual
  regs.forEach(e => {
    const tm = movTipo(e), ids = pid ? [pid] : [...new Set(e.ps)];
    ids.forEach(id => {
      const p = P(id), x = movQtd(e, id);
      if (!pid && (!x || !x.q)) return; // na visão geral só entram os movimentos que mexeram no estoque
      if (!(id in saldo)) saldo[id] = p ? p.estoque : null;
      let depois = null;
      if (x) { depois = x.de != null ? Number(x.de) + x.q : saldo[id]; saldo[id] = depois != null ? depois - x.q : null; }
      else if (TM[tm] && TM[tm][1] !== 0 || tm === "inventario" || tm === "import") saldo[id] = null; // registro antigo sem quantidade: não dá para saber o saldo antes dele
      out.push({ e, id, p, tm, x, depois });
    });
  });
  return { linhas: out.filter(l => ui.movT === "todos" || (ui.movT === "entradas" ? l.x && l.x.q > 0 : ui.movT === "saidas" ? l.x && l.x.q < 0 : ui.movT === "contagens" ? l.tm === "contagem" || l.tm === "inventario" : !l.x || !l.x.q)), fonte };
}
const movQtdTxt = l => !l.x ? "" : l.x.q > 0 ? "+" + dec(r4(l.x.q)) : l.x.q < 0 ? "−" + dec(r4(Math.abs(l.x.q))) : "0";
const movDetalhe = l => { const x = l.x, t = []; if (x && x.c != null) t.push(`sistema ${x.de}, contado ${x.c}`); if (l.e.motivo) t.push(l.e.motivo); return t.join(" · "); };
function vMovimentos() {
  const p = ui.movP ? P(ui.movP) : null, D = DESK();
  const { linhas, fonte } = movLinhas();
  let h = head("Movimentos de estoque", p ? esc(p.nome) : "Todos os produtos", { back: ui.stack.length > 0, action: `<button class="iconbtn" data-a="exportMov" aria-label="Exportar movimentos">${ico("download", 18)}</button>` }) + banners();
  const prods = S.prod.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  h += `<label class="field">Produto<select id="movP"><option value="">Todos os produtos</option>${prods.map(x => `<option value="${x.id}" ${ui.movP === x.id ? "selected" : ""}>${esc(x.nome)}${x.ativo === false ? " (inativo)" : ""}</option>`).join("")}</select></label>`;
  h += `<div class="chips tight">${MOV_PER.map(([k, l]) => `<button class="chip" data-a="movPer" data-id="${k}" aria-pressed="${ui.movPer === k}">${l}</button>`).join("")}</div>`;
  h += `<div class="chips">${[["todos", "Todos"], ["entradas", "Entradas"], ["saidas", "Saídas"], ["contagens", "Contagens"], ["outros", p ? "Outros eventos" : "Sem quantidade"]].filter(([k]) => p || k !== "outros").map(([k, l]) => `<button class="chip" data-a="movT" data-id="${k}" aria-pressed="${ui.movT === k}">${l}</button>`).join("")}</div>`;
  const ent = sum(linhas, l => l.x && l.x.q > 0 ? l.x.q : 0), sai = sum(linhas, l => l.x && l.x.q < 0 ? -l.x.q : 0);
  h += `<div class="stats">${p ? `<div class="stat"><span>Saldo atual</span><b>${p.estoque}</b><small>un. em estoque</small></div>` : ""}<div class="stat good"><span>Entradas</span><b>+${num(ent)}</b><small>un. no período</small></div><div class="stat warn"><span>Saídas</span><b>−${num(sai)}</b><small>un. no período</small></div><div class="stat"><span>Movimentos</span><b>${linhas.length}</b><small>${fonte.carregando ? "carregando…" : "registros"}</small></div></div>`;
  if (fonte.erro) h += `<div class="note warn">Não foi possível buscar o histórico completo no servidor. Mostrando só os registros mais recentes.</div>`;
  const vazio = empty(fonte.carregando ? "Carregando os movimentos…" : "Nenhum movimento no período.", p ? "" : "Escolha um produto para ver tudo o que aconteceu com ele, inclusive cadastro e pedidos de compra.");
  const quando = e => `${fdy(e.ts)} ${String(e.ts).slice(11, 16)}`;
  if (D) {
    const cols = [["Data e hora"], ["Tipo"], ...(p ? [] : [["Produto"]]), ["Qtd.", "n"], ["Saldo", "n"], ["Documento"], ["Usuário"], ["Detalhe"]];
    h += `<div style="margin-top:10px">${dtable(cols, linhas.map(l => { const doc = movDoc(l.e); return dtr(doc.a, [td(quando(l.e)), td(esc(TM[l.tm][0])), ...(p ? [] : [td(esc(l.p ? l.p.nome : "Produto removido"))]), td(`<span class="mvq ${l.x && l.x.q > 0 ? "pos" : l.x && l.x.q < 0 ? "neg" : ""}">${movQtdTxt(l)}</span>`, "n"), td(l.depois != null ? dec(r4(l.depois)) : (l.x ? "—" : ""), "n"), td(esc(doc.t), "mvdoc"), td(esc(nomeDe(l.e.por))), td(esc(movDetalhe(l) || (l.x ? "" : l.e.txt)))]); }), vazio, "t-mov")}</div>`;
  } else {
    let cur = "", rows = "";
    linhas.forEach(l => { const d = String(l.e.ts).slice(0, 10), doc = movDoc(l.e); if (d !== cur) { cur = d; rows += `<p class="day">${d === today ? "Hoje" : d === addDays(today, -1) ? "Ontem" : fdy(d)}</p>`; }
      rows += `<${doc.a ? "button" : "div"} class="row" ${doc.a}><span class="wmain"><b>${esc(TM[l.tm][0])}${p ? "" : " · " + esc(l.p ? l.p.nome : "Produto removido")}</b><small>${esc([String(l.e.ts).slice(11, 16), nomeDe(l.e.por), doc.t, movDetalhe(l)].filter(Boolean).join(" · "))}</small>${l.x ? "" : `<small>${esc(l.e.txt)}</small>`}</span><span class="right">${l.x ? `<b class="mvq ${l.x.q > 0 ? "pos" : l.x.q < 0 ? "neg" : ""}">${movQtdTxt(l)}</b>` : ""}${l.depois != null ? `<small class="mvsaldo">saldo ${dec(r4(l.depois))}</small>` : ""}</span></${doc.a ? "button" : "div"}>`; });
    h += `<div class="list" style="margin-top:12px">${rows || vazio}</div>`;
  }
  h += `<p class="hint">O saldo é o estoque depois de cada movimento. Registros feitos antes desta versão não guardavam a quantidade em todos os casos; nesses aparece “—”.</p>`;
  return h;
}
function movCsv() {
  const { linhas } = movLinhas();
  return [["Data", "Hora", "Tipo", "Produto", "Código", "Quantidade", "Saldo depois", "Sistema antes", "Contado", "Documento", "Usuário", "Descrição"],
    ...linhas.map(l => [String(l.e.ts).slice(0, 10), String(l.e.ts).slice(11, 16), TM[l.tm][0], l.p ? l.p.nome : "Produto removido", l.p ? l.p.ean || "" : "", l.x ? l.x.q : "", l.depois != null ? l.depois : "", l.x && l.x.de != null ? l.x.de : "", l.x && l.x.c != null ? l.x.c : "", movDoc(l.e).t, nomeDe(l.e.por), l.e.txt])];
}
function vAtividade() {
  const cats = { venda: "Vendas", consig: "Consignação", estoque: "Estoque", compra: "Compras", fin: "Financeiro", fiscal: "Fiscal", cadastro: "Cadastros", equipe: "Equipe" };
  const list = S.mov.filter(e => (ui.actF === "tudo" || e.k === ui.actF) && (ui.actU === "todos" || e.por === ui.actU)).slice().sort(byTs).slice(0, 250);
  let h = head("Atividade", "Registro de auditoria", { back: ui.stack.length > 0 }) + banners();
  h += `<div class="chips tight">${[["tudo", "Tudo"], ...Object.entries(cats)].map(([k, l]) => `<button class="chip" data-a="actF" data-id="${k}" aria-pressed="${ui.actF === k}">${l}</button>`).join("")}</div>`;
  h += `<label class="field" style="margin-top:6px">Usuário<select id="actU"><option value="todos">Todos</option>${S.mem.map(m => `<option value="${m.id}" ${ui.actU === m.id ? "selected" : ""}>${esc(m.nome)}</option>`).join("")}</select></label>`;
  let cur = "", rows = "";
  list.forEach(e => { const d = String(e.ts).slice(0, 10); if (d !== cur) { cur = d; rows += `<p class="day">${d === today ? "Hoje" : d === addDays(today, -1) ? "Ontem" : new Date(d + "T12:00").toLocaleDateString(IDIOMA_LOC, { weekday: "long", day: "numeric", month: "long" })}</p>`; }
    rows += `<div class="row"><span class="avatar sm">${initials(nomeDe(e.por))}</span><span class="wmain"><b style="font-weight:500">${esc(e.txt)}</b><small>${esc(nomeDe(e.por))} · ${String(e.ts).slice(11, 16)} · ${cats[e.k] || ""}</small></span></div>`; });
  h += `<div class="list" style="margin-top:12px">${rows || empty("Nenhum registro.", "")}</div>`;
  if (MODE === "cloud" && S.mov.length >= 400) h += `<p class="hint">Mostrando os 400 registros mais recentes.</p>`;
  return h;
}
const IMP = {
  prod: { l: "Produtos", cols: ["nome", "tipo", "uva", "pais", "regiao", "safra", "volume", "produtor", "codigo", "custo", "preco_varejo", "preco_atacado", "preco_restaurante", "preco_consignado", "estoque", "minimo", "localizacao"], ex: "Vale Alto Reserva;tinto;Malbec;Argentina;Mendoza;2021;750;Bodega Vale Alto;7790001000011;52,00;89,00;74,00;79,00;84,00;48;24;Rua A" },
  cli: { l: "Clientes", cols: ["nome", "razao_social", "cnpj", "tipo", "contato", "telefone", "email", "cidade", "tabela", "limite"], ex: "Trattoria Bella Vista;Bella Vista Gastronomia Ltda;12.345.678/0001-90;Restaurante;Giovanni;(47) 99999-0000;contato@exemplo.com;Joinville;restaurante;6000" }
};
/* Modelo de planilha conforme o ramo e o país da empresa (decimais, documento e NCM) */
function impModelo(k) {
  const loc = x => PC().dec === "," ? x : x.replace(/(\d),(\d{2})(?=;|$)/g, "$1.$2");
  if (k === "cli") return temFiscal() ? IMP.cli : { l: IMP.cli.l, cols: IMP.cli.cols.map(c => c === "cnpj" ? "documento" : c), ex: ["Trattoria Bella Vista", "Bella Vista Gastronomía SA de CV", paisEmp() === "MX" ? "BVG010203AB1" : "12-3456789", "Restaurante", "Giovanni", PC().fone, "contato@exemplo.com", PC().cidadePh.split(",")[0], "restaurante", "6000"].join(";") };
  if (k !== "prod" || ehVinho()) return Object.assign({}, IMP[k], { ex: loc(IMP[k].ex) });
  const c = cats()[0] || catDe("outros"), ex = { semijoias: "Brinco argola dourada;{cat};Maria Bijoux;BR-1020;Ouro 18k;3 cm", emporio: "Azeite extravirgem;{cat};Oliveira Sul;AZ-500;;500 ml", limpeza: "Vassoura de ixtle;{cat};La Escoba;VX-60;Ixtle;60 cm" }[rubro()] || "Produto exemplo;{cat};Marca;REF-01;;";
  const cols = ["nome", "categoria", "marca", "referencia", "material", "medida", "codigo", ...(temFiscal() ? ["ncm"] : []), "custo", "preco_varejo", "preco_atacado", "preco_restaurante", "preco_consignado", "estoque", "minimo", "localizacao"];
  return { l: IMP.prod.l, cols, ex: loc(ex.replace("{cat}", c.l) + ";7890000000017" + (temFiscal() ? ";" : "") + ";20,00;49,90;39,90;44,90;;10;2;Vitrine 1") };
}
function vImportar() {
  const k = ui.impTipo, cfg = impModelo(k), rows = ui.impTxt ? parseCSV(ui.impTxt) : [], ok = rows.filter(r => r.nome);
  let h = head("Importar planilha", "CSV separado por ponto e vírgula ou vírgula", { back: true }) + banners();
  h += `<div class="seg" style="margin-bottom:12px">${Object.entries(IMP).filter(([x]) => x === "prod" ? can("ajuste") : can("clientes")).map(([x, c]) => `<button data-a="impTipo" data-id="${x}" aria-pressed="${k === x}">${c.l}</button>`).join("")}</div>`;
  h += `<div class="card"><span class="lbl">Colunas aceitas</span><p style="margin:0;font-size:13.5px;overflow-wrap:anywhere">${cfg.cols.join(" · ")}</p><p class="hint">Só a coluna <b>nome</b> é obrigatória. No Excel ou Google Planilhas, salve como CSV.${k === "prod" ? ` ${ehVinho() ? "Tipo" : "Categoria"}: ${esc(cats().map(c => c.l).join(", "))}. Categoria que não existir vai para “${esc(catLabel("outros"))}”.` : " Tabela: varejo, atacado ou restaurante."}</p><button class="btn sm ghost" data-a="modeloCSV" style="margin-top:10px">${ico("download", 16)}Baixar modelo</button></div>`;
  h += `<label class="field">Escolher arquivo CSV<input type="file" id="impFile" accept=".csv,text/csv,text/plain"></label>`;
  h += `<label class="field">Ou cole o conteúdo aqui<textarea id="impTxt" placeholder="${esc(cfg.cols.join(";"))}">${esc(ui.impTxt)}</textarea></label>`;
  const errado = ok.length ? impOutroTipo(ok, k) : null;
  if (errado) h += `<div class="note bad">Esta planilha parece ser de <b>${IMP[errado.tipo].l.toLowerCase()}</b> (colunas ${esc(errado.cols.slice(0, 4).join(", "))}). Importar como ${cfg.l.toLowerCase()} criaria um cadastro errado para cada linha.</div>${(errado.tipo === "prod" ? can("ajuste") : can("clientes")) ? `<button class="btn ghost block" style="margin-bottom:12px" data-a="impTipo" data-keep="1" data-id="${errado.tipo}">Importar como ${IMP[errado.tipo].l.toLowerCase()}</button>` : ""}`;
  const pl = ok.length && !errado ? impPlano(ok, k) : null;
  if (rows.length && !ok.length) h += `<div class="note warn">Nenhuma linha com nome. Confira se a primeira linha tem os nomes das colunas.</div>`;
  if (pl) {
    const ign = ok.length - pl.novos.length - pl.atual.length;
    h += `<div class="note info"><b>${pl.novos.length}</b> novo${pl.novos.length === 1 ? "" : "s"} · <b>${pl.atual.length}</b> já cadastrado${pl.atual.length === 1 ? "" : "s"} (atualiza${pl.atual.length === 1 ? "" : "m"} sem duplicar)${k === "prod" && pl.ajustes ? ` · estoque muda em <b>${pl.ajustes}</b>` : ""}${ign > 0 ? ` · ${ign} linha${ign > 1 ? "s" : ""} repetida${ign > 1 ? "s" : ""} ignorada${ign > 1 ? "s" : ""}` : ""}</div>`;
    const aj = pl.atual.filter(a => a.delta).slice(0, 8);
    if (aj.length) h += `<div class="list">${aj.map(a => `<div class="row"><span class="wmain"><b>${esc(a.x.nome)}</b><small>Estoque ${a.x.estoque} → ${a.q} un.</small></span><span class="pill ${a.delta > 0 ? "ok" : "warn"}">${a.delta > 0 ? "+" : "−"}${Math.abs(a.delta)}</span></div>`).join("")}</div>`;
  }
  const nImp = pl ? pl.novos.length + pl.atual.length : 0;
  h += `<button class="btn block" data-a="importar" ${nImp ? "" : "disabled"}>${pl && pl.atual.length ? "Importar e atualizar" : "Importar"} ${nImp || ""} ${nImp === 1 ? (k === "prod" ? "produto" : "cliente") : cfg.l.toLowerCase()}</button>`;
  if (k === "prod") h += `<p class="hint center">A coluna <b>estoque</b> é a quantidade que existe hoje: para produtos já cadastrados, o app ajusta a diferença e registra na Atividade.</p>`;
  return h;
}

/* ---- Roteador ---- */
const ROUTES = {
  entrada: { v: vEntrada }, login: { v: vLogin }, termos: { v: vTermos }, inicio: { v: vInicio, tab: "inicio" },
  notas: { v: vNotas, tab: "mais", p: "fiscal" }, fiscal: { v: vFiscal, tab: "mais", p: "empresa" }, conta: { v: vConta, tab: "mais" },
  vendas: { v: vVendas, tab: "vendas", p: "vendas" }, pedido: { v: vPedido, tab: "vendas", p: "vendas" }, novoPedido: { v: vNovoPedido, tab: "vendas", p: "vendas" },
  estoque: { v: vEstoque, tab: "estoque", p: "estoque" }, categorias: { v: vCategorias, tab: "mais", p: "empresa" }, inventario: { v: vInventario, tab: "estoque", p: "ajuste" }, movimentos: { v: vMovimentos, tab: "estoque", p: "estoque" },
  mais: { v: vMais, tab: "mais" }, clientes: { v: vClientes, tab: "mais", p: "clientes" }, cliente: { v: vCliente, tab: "mais", p: "clientes" },
  fornecedores: { v: vFornecedores, tab: "mais", p: "fornecedores" }, fornecedor: { v: vFornecedor, tab: "mais", p: "fornecedores" },
  compras: { v: vCompras, tab: "compras", p: "compras" }, compra: { v: vCompra, tab: "compras", p: "compras" }, novaCompra: { v: vNovaCompra, tab: "compras", p: "compras" },
  financeiro: { v: vFinanceiro, tab: "mais" }, relatorios: { v: vRelatorios, tab: "mais", p: "relatorios" },
  equipe: { v: vEquipe, tab: "mais" }, empresa: { v: vEmpresa, tab: "mais", p: "empresa" }, atividade: { v: vAtividade, tab: "mais", p: "atividade" }, importar: { v: vImportar, tab: "mais" }
};
function tabsFor() {
  const t = [["inicio", "home", "Início"]];
  t.push(can("vendas") ? ["vendas", "order", "Vendas"] : ["compras", "cart", "Compras"]);
  t.push(["fab", "plus", "Novo"]);
  t.push(["estoque", "bottle", "Estoque"]);
  t.push(["mais", "grid", "Mais"]);
  return t;
}
/* Barra lateral do computador: todas as áreas agrupadas, respeitando as permissões do papel */
const SIDE_DE = { pedido: "vendas", novoPedido: "vendas", cliente: "clientes", fornecedor: "fornecedores", compra: "compras", novaCompra: "compras", inventario: "estoque", movimentos: "estoque", receitas: "estoque", receita: "estoque", receitaEdit: "estoque", categorias: "estoque", importar: "estoque", fiscal: "empresa", conta: "mais", termos: "mais" };
function sideNav() {
  const m = ME(), cur = SIDE_DE[ui.route] || ui.route;
  const it = (r, i, l, ok) => ok === false ? "" : `<button data-a="tab" data-r="${r}" aria-current="${cur === r ? "page" : "false"}">${ico(i)}<span>${l}</span></button>`;
  const grp = (t, itens) => { const x = itens.join(""); return x ? `<p class="sn-sec">${t}</p>${x}` : ""; };
  return `<div class="sn-brand">${marcaSaus("escuro", "var(--side-bg)")}<b>Saus<span>360</span></b>${MODE === "demo" ? '<span class="demo-tag">DEMO</span>' : ""}</div>
    <button class="sn-new" data-a="sheet" data-k="quick">${ico("plus", 20)}<span>Novo</span></button>
    <div class="sn-nav">${it("inicio", "home", "Início")}
    ${grp("Comercial", [it("vendas", "order", "Vendas", can("vendas")), it("clientes", "users", "Clientes", can("clientes")), can("vendas") ? `<button data-a="abrirCatalogo">${ico("file")}<span>Catálogo</span></button>` : ""])}
    ${grp("Estoque", [it("estoque", "bottle", "Produtos", can("estoque")), it("compras", "cart", "Compras", can("compras")), it("fornecedores", "truck", "Fornecedores", can("fornecedores"))])}
    ${grp("Gestão", [it("financeiro", "wallet", "Financeiro", can("receber") || can("pagar")), it("relatorios", "chart", "Relatórios", can("relatorios")), temFiscal() ? it("notas", "receipt", "Notas fiscais", can("fiscal")) : ""])}
    ${grp("Empresa", [it("equipe", "users", "Equipe"), it("empresa", "building", "Dados da empresa", can("empresa")), it("atividade", "activity", "Atividade", can("atividade"))])}</div>
    <button class="sn-me" data-a="tab" data-r="mais" aria-current="${cur === "mais" ? "page" : "false"}"><span class="avatar sm">${initials(m.nome)}</span><span class="wmain"><b>${esc(m.nome)}</b><small>${esc(S.emp ? S.emp.nome : "")}</small></span>${ico("grid", 18)}</button>`;
}
function render() {
  const pub = ["entrada", "login", "termos"];
  if (MODE === null && !pub.includes(ui.route)) ui.route = SB && !SESSION ? "login" : "entrada";
  const R = ROUTES[ui.route] || ROUTES.inicio;
  let html;
  if (!pub.includes(ui.route) && !ME()) html = vSemAcesso();
  else if (R.p && !can(R.p)) html = noPerm();
  else html = R.v();
  $("main").innerHTML = html;
  const bar = $("tabbar"), bare = pub.includes(ui.route) || !ME();
  bar.hidden = bare;
  $("app").className = "app" + (bare ? " bare" : "") + (["novoPedido", "inventario", "novaCompra"].includes(ui.route) ? " with-foot" : "") + " r-" + ui.route;
  if (!bare && DESK()) { bar.classList.add("side"); bar.innerHTML = sideNav(); }
  else if (!bare) {
    bar.classList.remove("side");
    const cur = R.tab === "compras" && can("vendas") ? "mais" : R.tab;
    bar.innerHTML = tabsFor().map(([k, i, l]) => k === "fab" ? `<button data-a="sheet" data-k="quick" aria-label="Novo"><span class="fab">${ico(i, 26)}</span><span>${l}</span></button>` : `<button data-a="tab" data-r="${k}" aria-current="${cur === k ? "page" : "false"}">${ico(i)}<span>${l}</span></button>`).join("");
  }
}

/* ---- actions.js ---- */
/* ================= Bottom sheets ================= */
function bigStepper(v, min, max) {
  return `<div class="stepper lg"><button data-a="step" data-d="-1" aria-label="Diminuir" ${v <= min ? "disabled" : ""}>−</button><input type="number" inputmode="numeric" data-sh="qty" value="${v}" aria-label="Quantidade"><button data-a="step" data-d="1" aria-label="Aumentar" ${v >= max ? "disabled" : ""}>+</button></div>`;
}
function prodMini(p, extra) { return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${extra || `${p.estoque} un. em estoque`}</small></span></div>`; }
const SPEC = {
  /* Campos da ficha conforme o ramo da empresa: vinho tem safra/uva/região; os outros, marca/referência/medida */
  prod: s => {
    const r = rubro(), opts = cats().map(c => [c.id, c.l]), cur = s && s.vals && s.vals.tipo;
    if (cur && cur !== "__nova" && !opts.some(o => o[0] === cur)) opts.push([cur, catLabel(cur) + " (arquivada)"]);
    if (can("empresa")) opts.push(["__nova", "+ Nova categoria…"]);
    const esp = r === "vinhos" ? [{ k: "safra", l: "Safra", h: 1, ph: "2022 ou NV" }, { k: "uva", l: "Uva", h: 1, ph: "Ex: Malbec" }, { k: "vol", l: "Volume (ml)", t: "num", h: 1 }, { k: "pais", l: "País", h: 1 }, { k: "regiao", l: "Região", h: 1 }, { k: "produtor", l: "Produtor", h: 1 }, { k: "teor", l: "Teor alcoólico", h: 1, ph: "13,5%" }]
      : r === "semijoias" ? [{ k: "ref", l: "Referência", h: 1, ph: "Código do fornecedor" }, { k: "material", l: "Banho ou material", h: 1, ph: "Ouro 18k, ródio, prata" }, { k: "medida", l: "Tamanho ou medida", h: 1, ph: "Aro 16, 45 cm" }, { k: "marca", l: "Marca", h: 1 }]
      : r === "limpeza" ? [{ k: "marca", l: "Marca", h: 1 }, { k: "ref", l: "Referência", h: 1, ph: "Código do fornecedor" }, { k: "medida", l: "Tamanho ou conteúdo", h: 1, ph: "1 L, 60 cm, pacote com 12" }, { k: "material", l: "Material", h: 1, ph: "Plástico, ixtle, microfibra" }]
      : ehFood() ? [{ k: "tipoItem", l: "Tipo de item", t: "select", h: 1, opts: [["venda", "Produto de venda"], ["insumo", "Ingrediente / insumo"], ["embalagem", "Embalagem"]] }, { k: "un", l: "Unidade do estoque", t: "select", h: 1, opts: UNIDADES.map(u => [u, UN_NOME[u]]) }, { k: "marca", l: "Marca", h: 1 }, { k: "validade", l: "Validade (dias)", t: "num", h: 1, ph: "Ex: 5" }, { k: "alerg", l: "Alérgenos", ph: "Leite, glúten, ovo, castanhas" }]
      : r === "emporio" ? [{ k: "marca", l: "Marca", h: 1 }, { k: "medida", l: "Peso ou volume", h: 1, ph: "500 g, 1 L" }, { k: "produtor", l: "Fabricante", h: 1 }, { k: "pais", l: "País de origem", h: 1 }]
      : [{ k: "marca", l: "Marca", h: 1 }, { k: "ref", l: "Referência", h: 1 }, { k: "medida", l: "Tamanho ou medida" }];
    return [
      { k: "nome", l: "Nome do produto", ph: { vinhos: "Ex: Quinta da Serra Reserva", semijoias: "Ex: Brinco argola dourada", emporio: "Ex: Azeite extravirgem 500 ml", limpeza: "Ex: Vassoura de ixtle" }[r] || "Como aparece na nota" },
      { k: "tipo", l: "Categoria", t: "select", opts },
      ...(cur === "__nova" ? [{ k: "novaCat", l: "Nome da nova categoria", ph: "Ex: Kits e presentes" }] : []),
      ...esp,
      { k: "forn", l: "Fornecedor principal", t: "select", opts: [["", "Nenhum"], ...S.forn.map(f => [f.id, f.nome])] },
      { k: "custo", l: `Custo unitário (${SIM()})`, t: "money", h: 1, ph: money(52) }, { k: "pv", l: "Preço varejo", t: "money", h: 1, ph: money(89) },
      { k: "pa", l: "Preço atacado", t: "money", h: 1 }, { k: "pr", l: "Preço restaurante", t: "money", h: 1 },
      { k: "pc", l: "Preço consignado", t: "money", h: 1, ph: "vazio = varejo" },
      { k: "estoque", l: ehFood() ? "Estoque atual (na unidade)" : "Estoque atual", t: ehFood() ? "money" : "num", h: 1 }, { k: "min", l: "Estoque mínimo", t: ehFood() ? "money" : "num", h: 1 },
      { k: "ean", l: "Código de barras (EAN)", t: "code", scan: 1 }, { k: "loc", l: "Localização", ph: "Rua A · prat. 2" },
      ...(r === "vinhos" ? [{ k: "temp", l: "Temperatura de serviço", ph: "16 a 18 °C" }, { k: "harmon", l: "Harmonização", t: "textarea", ph: "Ex: carnes vermelhas, queijos curados" }] : [{ k: "harmon", l: "Observações", t: "textarea", ph: "Detalhes que ajudam a vender" }]),
      ...(temFiscal() ? [{ sec: "Dados fiscais (confirme com o contador)" },
        { k: "ncm", l: "NCM", h: 1, t: "tel", ph: r === "vinhos" ? "22042100" : "8 dígitos" }, { k: "cest", l: "CEST", h: 1, t: "tel", ph: "Se houver ST" },
        { k: "origem", l: "Origem da mercadoria", t: "select", opts: ORIGENS }, { k: "st", l: "Sujeito a substituição tributária (ICMS-ST)", t: "select", opts: [["nao", "Não"], ["sim", "Sim, ICMS já retido"]] }] : [])
    ];
  },
  /* Campos que dependem do ramo (os demais são comuns a todos) */
  campos: ["safra", "uva", "vol", "pais", "regiao", "produtor", "teor", "ref", "material", "medida", "marca", "temp", "tipoItem", "un", "validade", "alerg"],
  cli: () => { const P = PC(); return [
    { k: "nome", l: "Nome fantasia", ph: "Ex: Bistrô Maré" }, { k: "razao", l: "Razão social" },
    { k: "doc", l: P.docCli, h: 1, t: P.dec === "," ? "tel" : "code" }, { k: "tipo", l: "Tipo", t: "select", h: 1, opts: CLI_TIPOS.map(x => [x, x]) },
    { k: "contato", l: "Contato", h: 1 }, { k: "fone", l: "WhatsApp", t: "tel", h: 1, ph: P.fone },
    { k: "email", l: "E-mail", t: "email" }, { k: "tabela", l: "Tabela de preço", t: "select", opts: Object.entries(TABELAS) },
    { k: "limite", l: `Limite de crédito (${P.sim})`, t: "money", ph: "0 = sem limite" }, { k: "obs", l: "Observações", t: "textarea" },
    { sec: temFiscal() ? "Endereço e dados para nota fiscal" : "Endereço" },
    { k: "logradouro", l: "Rua / avenida" }, { k: "numero", l: "Número", h: 1 }, { k: "bairro", l: P.bairro, h: 1 },
    { k: "cidade", l: P.cidade, h: 1 }, { k: "uf", l: P.uf, t: "select", h: 1, opts: [["", "—"], ...P.ufs.map(u => [u, u])] }, { k: "cep", l: P.cep, t: "tel", h: 1 },
    ...(temFiscal() ? [{ k: "ie", l: "Inscrição estadual", t: "tel", h: 1 }, { k: "indIE", l: "Situação no ICMS", t: "select", opts: IND_IE }] : [])
  ]; },
  forn: () => [
    { k: "nome", l: "Nome", ph: "Ex: Ibérica Importadora" }, { k: "doc", l: PC().docForn, t: PC().dec === "," ? "tel" : "code" },
    { k: "contato", l: "Contato", h: 1 }, { k: "fone", l: "WhatsApp", t: "tel", h: 1, ph: PC().fone }, { k: "email", l: "E-mail", t: "email", h: 1 }, { k: "prazo", l: "Prazo médio (dias)", t: "num", h: 1 },
    { k: "obs", l: "Observações", t: "textarea", ph: "Ex: Portugal e Espanha, pedido mínimo 60 garrafas" }
  ],
  /* País: muda moeda, documentos, endereço, formas de pagamento e impostos (IVA no México; nota fiscal só no Brasil) */
  emp: v => { const P = PAISES[v && PAISES[v.pais] ? v.pais : "BR"]; return [{ k: "nome", l: "Nome da empresa" }, { k: "pais", l: "País", t: "select", opts: Object.entries(PAISES).map(([k, x]) => [k, x.l]) }, { k: "cnpj", l: P.docEmp, t: P.dec === "," ? "tel" : "code", h: 1 }, { k: "fone", l: "Telefone", t: "tel", h: 1, ph: P.fone }, { k: "cidade", l: "Cidade", ph: P.cidadePh }, ...(P.iva ? [{ k: "ivaSomar", l: "IVA nos pedidos", t: "select", opts: IVA_OPTS(P) }] : [])]; },
  criarEmp: v => { const P = PAISES[v && PAISES[v.pais] ? v.pais : "BR"]; return [{ k: "nome", l: "Nome da empresa", ph: "Ex: Empório Central" }, { k: "pais", l: "País", t: "select", opts: Object.entries(PAISES).map(([k, x]) => [k, x.l]) }, { k: "rubro", l: "Ramo da empresa", t: "select", opts: Object.entries(RUBROS).map(([k, r]) => [k, r.l]) }, ...(P.iva ? [{ k: "ivaSomar", l: "IVA nos pedidos", t: "select", opts: IVA_OPTS(P) }] : []), { k: "cnpj", l: `${P.docEmp} (opcional)`, t: P.dec === "," ? "tel" : "code", h: 1 }, { k: "cidade", l: "Cidade", h: 1, ph: P.cidadePh }, { k: "seuNome", l: "Seu nome", ph: "Como a equipe vai ver você" }]; },
  entrarEmp: () => [{ k: "codigo", l: "Código da empresa", t: "code", ph: "Ex: K7P2QX" }, { k: "seuNome", l: "Seu nome", ph: "Como a equipe vai ver você" }],
  fin: () => [{ k: "desc", l: "Descrição", ph: "Ex: Aluguel de novembro" }, { k: "cat", l: "Categoria", t: "select", h: 1, opts: (ui.sheet.id === "receber" ? ["Eventos", "Serviços", "Outros"] : DESP_CATS).map(x => [x, x]) }, { k: "valor", l: `Valor (${SIM()})`, t: "money", h: 1 }, { k: "venc", l: "Vencimento", t: "date" }]
};
const SH = {
  quick: () => {
    const it = (a, k, icon, t, s, extra) => `<button data-a="${a}" ${k ? `data-k="${k}"` : ""} ${extra || ""}>${ico(icon)}<span class="wmain"><b>${t}</b><small>${s}</small></span></button>`;
    let m = "";
    if (can("vendas")) m += it("novoPedido", "", "order", "Novo pedido", "Venda com baixa no estoque") + it("novoPedido", "", "tag", "Novo orçamento", "Sem mexer no estoque", 'data-id="orcamento"') + it("novoPedido", "", "share", "Nova consignação", "Garrafas que ficam com o cliente", 'data-id="consig"');
    if (can("receber")) m += it("sheet", "payPickCli", "cash", "Receber pagamento", "De um cliente");
    if (can("compras")) m += it("novaCompra", "", "truck", "Nova compra", "Pedido a fornecedor");
    if (can("ajuste")) m += it("sheet", "pickProdEntrada", "box", "Entrada de estoque", "Sem pedido de compra") + it("sheet", "prodForm", "bottle", "Novo produto", ehVinho() ? "Cadastrar rótulo" : "Cadastrar produto");
    if (can("pagar")) m += it("sheet", "finForm", "wallet", "Nova despesa", "Conta a pagar", 'data-id="pagar"');
    if (can("clientes")) m += it("sheet", "cliForm", "users", "Novo cliente", "Cadastro rápido");
    return ["O que você quer registrar?", `<div class="menu">${m}</div>`];
  },
  criarEmp: s => ["Criar empresa", `<p class="hint" style="margin:0">Você será o administrador. Depois é só compartilhar o código com sua equipe. O ramo define as categorias e os campos dos produtos; dá para mudar depois.</p>${formHtml(SPEC.criarEmp(s.vals), s.vals)}${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="doCriarEmp" ${s.busy ? "disabled" : ""}>${s.busy ? "Criando…" : "Criar e entrar"}</button>`],
  entrarEmp: s => ["Entrar em uma empresa", `<p class="hint" style="margin:0">Peça o código ao administrador. Ele também precisa ter compartilhado o app com você como Editor.</p>${formHtml(SPEC.entrarEmp(), s.vals)}${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="doEntrarEmp" ${s.busy ? "disabled" : ""}>${s.busy ? "Entrando…" : "Entrar"}</button>`],
  prod: s => {
    const p = P(s.id); if (!p) return ["Produto", empty("Produto não encontrado.", "")];
    const st = pstate(p), cc = comClientes(p.id), hist = S.mov.filter(e => (e.ps || []).includes(p.id)).sort(byTs).slice(0, 8);
    const vend90 = sum(vendasAtivas([addDays(today, -89), today]), o => sum(o.itens.filter(i => i.p === p.id), i => soldQ(o, i)));
    const m = p.precos && p.precos.varejo ? (p.precos.varejo - (p.custo || 0)) / p.precos.varejo : 0;
    return ["Ficha do produto", `
    <div class="whead"><span class="bt lg">${bottle(p.tipo)}</span><div><p class="eyebrow">${esc(catLabel(p.tipo))}${p.produtor ? " · " + esc(p.produtor) : p.marca ? " · " + esc(p.marca) : ""}</p><h4>${esc(p.nome)}</h4><p class="eyebrow" style="margin:6px 0 0">${esc((ehVinho() ? [p.uva, p.safra && "Safra " + p.safra] : [p.ref && "ref. " + p.ref, p.material, p.medida]).filter(Boolean).join(" · "))}</p></div></div>
    <div class="stockbox ${st.cls}"><div><span>Em estoque</span><b>${p.estoque}</b><small>${ehVinho() ? `${Math.floor(Math.max(0, p.estoque) / 6)} cx + ${Math.max(0, p.estoque) % 6} un.` : "unidades"}</small></div><div><span>Mínimo</span><b>${p.min || 0}</b><small>un.</small></div><div><span>Consignado</span><b>${cc}</b><small>com clientes</small></div></div>
    ${can("ajuste") ? `<div class="actions3"><button data-a="sheet" data-k="entrada" data-id="${p.id}">+ Entrada</button><button data-a="sheet" data-k="baixa" data-id="${p.id}" ${p.estoque > 0 ? "" : "disabled"}>− Baixa</button><button data-a="sheet" data-k="contagem" data-id="${p.id}">Contagem</button></div>` : ""}
    <dl class="specs">${Object.entries(TABELAS).map(([k, l]) => `<div><dt>Preço ${l.toLowerCase()}</dt><dd>${fmt(preco(p, k))}</dd></div>`).join("")}${can("custo") ? `<div><dt>Custo médio</dt><dd>${fmt(p.custo)} · margem ${pct(m)}</dd></div>` : ""}
      ${ehVinho() ? `<div><dt>Origem</dt><dd>${esc([p.regiao, p.pais].filter(Boolean).join(", ") || "—")}</dd></div><div><dt>Volume</dt><dd>${p.vol ? p.vol + " ml" : "—"}${p.teor ? " · " + esc(p.teor) : ""}</dd></div>` : `<div><dt>Marca</dt><dd>${esc(p.marca || "—")}</dd></div><div><dt>${rubro() === "emporio" ? "Peso ou volume" : rubro() === "limpeza" ? "Tamanho ou conteúdo" : "Medida"}</dt><dd>${esc(p.medida || "—")}</dd></div>`}
      <div><dt>Vendidas em 90 dias</dt><dd>${vend90} un.</dd></div><div><dt>Localização</dt><dd>${esc(p.loc || "—")}</dd></div><div><dt>Código</dt><dd>${esc(p.ean || "—")}</dd></div><div><dt>Fornecedor</dt><dd>${esc(p.forn && Fo(p.forn) ? Fo(p.forn).nome : "—")}</dd></div>
      ${p.temp ? `<div class="full"><dt>Serviço</dt><dd>${esc(p.temp)}</dd></div>` : ""}${p.harmon ? `<div class="full"><dt>${ehVinho() ? "Harmonização" : "Observações"}</dt><dd>${esc(p.harmon)}</dd></div>` : ""}</dl>
    ${can("ajuste") ? `<div class="btns"><button class="btn line" data-a="sheet" data-k="prodForm" data-id="${p.id}">${ico("edit", 16)}Editar</button><button class="btn line" data-a="toggleAtivo" data-id="${p.id}">${p.ativo === false ? "Reativar" : "Inativar"}</button></div>` : ""}
    <p class="sec">Últimas movimentações<button class="btn sm line" style="margin-left:auto;text-transform:none;letter-spacing:0" data-a="go" data-r="movimentos" data-id="${p.id}">Ver todos</button></p><div class="list">${hist.map(e => `<div class="row"><span class="avatar sm">${initials(nomeDe(e.por))}</span><span class="wmain"><b style="font-weight:500">${esc(e.txt)}</b><small>${esc(nomeDe(e.por))} · ${fdy(e.ts)}</small></span></div>`).join("") || empty("Sem movimentações registradas.", "")}</div>`];
  },
  prodForm: s => [s.id ? "Editar produto" : "Novo produto", formHtml(SPEC.prod(s).filter(f => !(s.id && f.k === "estoque")), s.vals) + (s.id ? `<p class="hint">Para mudar a quantidade em estoque use Entrada, Baixa ou Contagem: assim fica registrado no histórico.</p>` : "") + `${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveProd">${s.id ? "Salvar alterações" : "Cadastrar produto"}</button>`],
  entrada: s => { const p = P(s.id); return ["Entrada de estoque", `${prodMini(p)}
    <div class="seg" style="margin-top:14px"><button data-a="unit" data-id="un" aria-pressed="${s.unit === "un"}">Unidades</button><button data-a="unit" data-id="cx" aria-pressed="${s.unit === "cx"}">Caixas de 6</button></div>
    ${bigStepper(s.qty, 1, 9999)}<div id="shd">${SHD.entrada(s)}</div>
    ${can("custo") ? `<label class="field">Custo unitário desta entrada (opcional)<input data-f="custo" inputmode="decimal" value="${esc(s.vals.custo || "")}" placeholder="Atual ${money(p.custo)}"></label><p class="hint">Se informar, o custo médio do produto é recalculado.</p>` : ""}
    <label class="field">Nota fiscal ou origem<input data-f="nota" value="${esc(s.vals.nota || "")}" placeholder="Ex: NF 4890 · Importadora"></label>
    <button class="btn block" data-a="doEntrada">Confirmar entrada</button>`]; },
  baixa: s => { const p = P(s.id); return ["Baixa de estoque", `${prodMini(p)}<span class="lbl" style="margin-top:16px">Motivo</span>
    <div class="chips wrap tight">${BAIXAS.map(r => `<button class="chip" data-a="reason" data-id="${r}" aria-pressed="${s.reason === r}">${r}</button>`).join("")}</div>
    ${bigStepper(s.qty, 1, Math.max(1, p.estoque))}<div id="shd">${SHD.baixa(s)}</div>
    <label class="field">Observação<input data-f="nota" value="${esc(s.vals.nota || "")}" placeholder="Ex: garrafa trincada no recebimento"></label>
    <button class="btn block" data-a="doBaixa">Registrar baixa</button>`]; },
  finInv: () => {
    const list = invLista(), d = list.map(p => ({ p, q: invNum(ui.inv[p.id]) - p.estoque })).filter(x => x.q), plus = sum(d, x => Math.max(0, x.q)), minus = sum(d, x => Math.max(0, -x.q));
    return ["Finalizar inventário", `<div class="stats"><div class="stat good"><span>Contados</span><b>${list.length}</b><small>todos os produtos</small></div><div class="stat ${d.length ? "warn" : ""}"><span>Com diferença</span><b>${d.length}</b><small>+${plus} / −${minus} un.</small></div></div>
    ${d.length ? `<p class="sec">Ajustes que serão feitos</p><div class="list">${d.slice(0, 40).map(x => `<div class="row"><span class="wmain"><b>${esc(x.p.nome)}</b><small>sistema ${x.p.estoque} → contado ${x.p.estoque + x.q}</small></span><b class="${x.q > 0 ? "pos" : "neg"}">${x.q > 0 ? "+" : "−"}${Math.abs(x.q)}</b></div>`).join("")}</div>${d.length > 40 ? `<p class="hint">E mais ${d.length - 40}.</p>` : ""}` : `<div class="note good">Tudo bate com o sistema. O inventário fica registrado no histórico de cada produto.</div>`}
    <button class="btn block" style="margin-top:14px" data-a="doFinInv">${d.length ? "Confirmar e ajustar o estoque" : "Confirmar inventário"}</button>`];
  },
  invDescartar: () => ["Recomeçar a contagem?", `<p class="hint" style="margin:0 0 14px">Apaga o que já foi contado neste aparelho. O estoque não muda.</p><button class="btn block danger" data-a="doInvDescartar">Apagar e recomeçar</button>`],
  contagem: s => { const p = P(s.id); return ["Contagem física", `${prodMini(p, `No sistema: ${p.estoque} un.`)}<p class="hint">Conte na prateleira e informe o total encontrado.</p>${bigStepper(s.qty, 0, 99999)}<div id="shd">${SHD.contagem(s)}</div><button class="btn block" data-a="doContagem">Salvar contagem</button>`]; },
  pickProdEntrada: s => ["Entrada: escolha o produto", pickList(s, S.prod.filter(p => p.ativo !== false), p => `<button class="row" data-a="sheet" data-k="entrada" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.estoque} un.</small></span>${ico("chev", 18)}</button>`, p => [p.nome, p.uva, p.ean].join(" "))],
  pickProd: s => ["Adicionar à compra", pickList(s, S.prod.filter(p => p.ativo !== false).sort((a, b) => (b.forn === (ui.cdraft && ui.cdraft.forn)) - (a.forn === (ui.cdraft && ui.cdraft.forn))), p => `<button class="row" data-a="addItemCompra" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>${p.estoque} un. · mín. ${p.min || 0} · custo ${fmt(p.custo)}</small></span>${ico("plus", 18)}</button>`, p => [p.nome, p.uva, p.ean].join(" ")) + (can("ajuste") ? `<button class="btn line block" style="margin-top:10px" data-a="novoProdCompra">+ Cadastrar novo produto</button>` : "")],
  pickCli: s => ["Escolha o cliente", (ui.route === "novoPedido" && ui.draft && ui.draft.tipo !== "consig" ? `<button class="row" data-a="setCli" data-id="CF" style="margin-bottom:10px"><span class="avatar">CF</span><span class="wmain"><b>Consumidor final</b><small>Venda de balcão, com NFC-e</small></span>${ico("chev", 18)}</button>` : "") + pickList(s, S.cli.filter(c => c.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome)), c => { const st = cliStats(c.id); return `<button class="row" data-a="setCli" data-id="${c.id}"><span class="avatar">${initials(c.nome)}</span><span class="wmain"><b>${esc(c.nome)}</b><small class="${st.vencido ? "bad" : ""}">${esc(c.tipo)} · ${st.vencido ? fmt(st.vencido) + " vencido" : st.aberto ? fmt(st.aberto) + " em aberto" : "em dia"}</small></span>${ico("chev", 18)}</button>`; }, c => [c.nome, c.razao, c.doc, c.cidade].join(" ")) + (can("clientes") ? `<button class="btn line block" data-a="sheet" data-k="cliForm">+ Cadastrar novo cliente</button>` : "")],
  pickForn: () => ["Escolha o fornecedor", `<div class="list">${S.forn.map(f => `<button class="row" data-a="setForn" data-id="${f.id}"><span class="avatar">${initials(f.nome)}</span><span class="wmain"><b>${esc(f.nome)}</b><small>${esc(f.obs || "")}</small></span>${ico("chev", 18)}</button>`).join("") || empty("Nenhum fornecedor.", "")}</div><button class="btn line block" data-a="sheet" data-k="fornForm">+ Cadastrar fornecedor</button>`],
  payPickCli: s => { const list = S.cli.map(c => ({ c, st: cliStats(c.id) })).filter(x => x.st.aberto > 0.004).sort((a, b) => b.st.vencido - a.st.vencido || b.st.aberto - a.st.aberto); return ["Receber de qual cliente?", `<div class="list">${list.map(x => `<button class="row" data-a="sheet" data-k="payPick" data-id="${x.c.id}"><span class="avatar">${initials(x.c.nome)}</span><span class="wmain"><b>${esc(x.c.nome)}</b><small class="${x.st.vencido ? "bad" : ""}">${fmt(x.st.aberto)} em aberto${x.st.vencido ? " · tem vencido" : ""}</small></span>${ico("chev", 18)}</button>`).join("") || empty("Nenhum cliente com saldo.", "")}</div>`]; },
  payPick: s => { const c = Cl(s.id); const os = S.ped.filter(o => o.cli === s.id).map(o => ({ o, k: pedCalc(o) })).filter(x => x.k.aberto > 0.004).sort((a, b) => a.o.data.localeCompare(b.o.data)); return ["Qual pedido?", `<p class="hint" style="margin:0 2px 10px">${esc(c ? c.nome : "")}</p><div class="list">${os.map(x => `<button class="row" data-a="pay" data-src="ped" data-id="${x.o.id}"><span class="dot ${x.k.status === "vencido" ? "bad" : "info"}">#</span><span class="wmain"><b>#${x.o.num} · ${tipoPed(x.o.tipo)}</b><small>${fd(x.o.data)} · próximo venc. ${fd((x.k.parcelas.find(p => p.aberto > 0.004) || {}).venc)}</small></span><span class="right"><b>${fmt(x.k.aberto)}</b>${statusPed(x.k)}</span></button>`).join("")}</div>`]; },
  pay: s => {
    const info = payInfo(s);
    return [s.src === "comp" || (s.src === "fin" && Fi(s.id) && Fi(s.id).tipo === "pagar") ? "Registrar pagamento" : "Registrar recebimento", `
    <div class="row"><span class="avatar">${initials(info.quem)}</span><span class="wmain"><b>${esc(info.quem)}</b><small>${esc(info.desc)} · em aberto ${fmt(info.aberto)}</small></span></div>
    <label class="field">Valor (${SIM()})<input data-f="valor" inputmode="decimal" value="${esc(s.vals.valor)}"></label>
    <label class="field">Data<input data-f="data" type="date" value="${esc(s.vals.data)}"></label>
    <span class="lbl" style="margin-top:16px">Forma</span><div class="chips wrap tight">${formas().map(f => `<button class="chip" data-a="pforma" data-id="${f}" aria-pressed="${s.forma === f}">${f}</button>`).join("")}</div>
    ${s.src === "ped" && info.parcelas > 1 ? `<p class="hint">O valor abate a parcela mais antiga em aberto.</p>` : ""}
    <button class="btn block" data-a="doPay">Confirmar</button>`];
  },
  consig: s => { const o = Pe(s.oid), i = o.itens[s.ix], p = P(i.p) || { nome: "Produto", tipo: "outros", estoque: 0 }, left = i.q - (i.vend || 0) - (i.dev || 0); return [s.m === "vend" ? "Cliente vendeu" : "Cliente devolveu", `
    ${prodMini(p, `#${o.num} · ${left} un. com ${esc(Cl(o.cli) ? Cl(o.cli).nome : "o cliente")}`)}
    <p class="hint">${s.m === "vend" ? "Essas unidades passam a ser cobradas do cliente no acerto." : "Essas unidades voltam para o estoque."}</p>
    ${bigStepper(s.qty, 1, left)}<div id="shd">${SHD.consig(s)}</div>
    ${s.m === "vend" && left > 1 ? `<button class="btn line block" data-a="consigTudo">Vendeu todas as ${left}</button>` : ""}
    <button class="btn block" data-a="doConsig">${s.m === "vend" ? "Registrar venda" : "Registrar devolução"}</button>`]; },
  cliForm: s => [s.id ? "Editar cliente" : "Novo cliente", formHtml(SPEC.cli(), s.vals) + `${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveCli">${s.id ? "Salvar" : "Cadastrar cliente"}</button>${s.id && can("cancelar") ? `<button class="btn danger block" style="margin-top:8px" data-a="inativarCli">Desativar cliente</button>` : ""}`],
  fornForm: s => [s.id ? "Editar fornecedor" : "Novo fornecedor", formHtml(SPEC.forn(), s.vals) + `${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveForn">${s.id ? "Salvar" : "Cadastrar fornecedor"}</button>`],
  empForm: s => ["Dados da empresa", formHtml(SPEC.emp(s.vals), s.vals) + (s.err ? `<div class="note bad">${esc(s.err)}</div>` : "") + `<button class="btn block" data-a="saveEmp">Salvar</button>`],
  catForm: s => {
    const c = s.id ? catDe(s.id) : null, fixa = s.id === "outros", q = s.id ? S.prod.filter(p => catDe(p.tipo).id === s.id).length : 0;
    let b = formHtml([{ k: "l", l: "Nome", ph: "Ex: Espumantes nacionais" }], s.vals);
    b += `<span class="lbl">Cor</span><div class="cores">${CAT_CORES.map(x => `<button data-a="catCor" data-id="${x}" style="background:${x}" aria-label="Cor ${x}" aria-pressed="${s.vals.c === x}"></button>`).join("")}</div>`;
    b += formHtml([{ sec: "Padrões para produtos novos" }, ...(temFiscal() ? [{ k: "ncm", l: "NCM padrão", h: 1, t: "tel", ph: "8 dígitos" }] : []), { k: "min", l: "Estoque mínimo", t: "num", h: !!temFiscal() }], s.vals);
    b += `<p class="hint">${temFiscal() ? "Ao cadastrar um produto nesta categoria, o NCM e o estoque mínimo já vêm preenchidos. Confirme o NCM com o contador." : "Ao cadastrar um produto nesta categoria, o estoque mínimo já vem preenchido."}</p>`;
    if (s.err) b += `<div class="note bad">${esc(s.err)}</div>`;
    b += `<button class="btn block" data-a="saveCat">${c ? "Salvar" : "Criar categoria"}</button>`;
    if (c && fixa) b += `<p class="hint">“${esc(c.l)}” é fixa: recebe os produtos sem categoria e não pode ser arquivada nem excluída.</p>`;
    if (c && !fixa) {
      b += `<div class="btns" style="margin-top:8px"><button class="btn line" data-a="catArq">${c.arq ? "Reativar" : "Arquivar"}</button><button class="btn danger" data-a="catDel">Excluir</button></div><p class="hint">Arquivada some do cadastro e dos filtros, mas os produtos dela continuam iguais.</p>`;
      if (s.confirmDel && q) b += `<div class="note warn">“${esc(c.l)}” tem ${q} produto${q === 1 ? "" : "s"}. Escolha para onde ${q === 1 ? "ele vai" : "eles vão"} antes de excluir.</div>` + formHtml([{ k: "mover", l: "Mover produtos para", t: "select", opts: cats().filter(x => x.id !== s.id).map(x => [x.id, x.l]) }], s.vals) + `<button class="btn danger block" data-a="catDelOk">Mover ${q} e excluir</button>`;
      else if (s.confirmDel) b += `<div class="note warn">Excluir “${esc(c.l)}”? Não há produtos nela.</div><button class="btn danger block" data-a="catDelOk">Excluir categoria</button>`;
    }
    return [c ? "Editar categoria" : "Nova categoria", b];
  },
  rubroForm: s => ["Ramo da empresa", `<p class="hint" style="margin:0 0 10px">O ramo muda os campos da ficha do produto. As categorias e os produtos que você já tem continuam como estão.</p>${formHtml([{ k: "rubro", l: "Ramo", t: "select", opts: Object.entries(RUBROS).map(([k, r]) => [k, r.l]) }], s.vals)}<label class="toggle">Adicionar as categorias sugeridas do ramo<input type="checkbox" data-a="rubroSug" ${s.vals.sugeridas ? "checked" : ""}></label>${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveRubro">Salvar</button>`],
  finForm: s => [s.id === "receber" ? "Nova receita avulsa" : "Nova despesa", formHtml(SPEC.fin(), s.vals) + `<label class="toggle">Já ${s.id === "receber" ? "recebido" : "pago"}<input type="checkbox" data-a="finPago" ${s.pago ? "checked" : ""}></label>${s.pago ? `<div class="chips wrap tight" style="margin-top:8px">${formas().map(f => `<button class="chip" data-a="pforma" data-id="${f}" aria-pressed="${s.forma === f}">${f}</button>`).join("")}</div>` : ""}${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveFin">Salvar</button>`],
  finDet: s => { const f = Fi(s.id); if (!f) return ["Lançamento", empty("Não encontrado.", "")]; const k = finCalc(f); return [f.tipo === "pagar" ? "Conta a pagar" : "Conta a receber", `
    <div class="card"><div class="kv"><span>Descrição</span><b>${esc(f.desc)}</b></div><div class="kv"><span>Categoria</span><b>${esc(f.cat || "—")}</b></div><div class="kv"><span>Valor</span><b>${fmt(f.valor)}</b></div><div class="kv"><span>Vencimento</span><b>${fdy(f.venc)}</b></div><div class="kv"><span>Em aberto</span><b>${fmt(k.aberto)}</b></div></div>
    ${(f.pag || []).length ? `<div class="list">${f.pag.map(p => `<div class="row"><span class="dot good">${SIM()}</span><span class="wmain"><b>${fmt(p.valor)}</b><small>${p.forma} · ${fdy(p.data)} · ${esc(nomeDe(p.por))}</small></span></div>`).join("")}</div>` : ""}
    ${k.aberto > 0.004 && can("pagar") ? `<button class="btn block" data-a="pay" data-src="fin" data-id="${f.id}">${f.tipo === "pagar" ? "Registrar pagamento" : "Registrar recebimento"}</button>` : ""}
    ${!(f.pag || []).length && can("pagar") ? `<button class="btn danger block" style="margin-top:8px" data-a="delFin" data-id="${f.id}">Excluir lançamento</button>` : ""}`]; },
  /* Administrador cria o acesso de alguém da equipe: o servidor cria a conta já confirmada (sem e-mail) */
  novoMembro: s => {
    if (s.feito) {
      const f = s.feito;
      return ["Acesso criado", `<div class="note good"><b>${esc(f.nome)}</b> já faz parte da equipe como ${PAPEIS[f.papel]}.</div>
        <div class="card"><div class="kv"><span>E-mail</span><b>${esc(f.email)}</b></div><div class="kv"><span>Senha temporária</span><b class="code">${esc(f.senha)}</b></div></div>
        <p class="hint">Envie esses dados para a pessoa. Ela entra no app com eles e pode trocar a senha em Mais → Minha conta. A senha não fica guardada aqui.</p>
        <div class="btns"><button class="btn" data-a="waAcesso">${ico("whats", 18)}WhatsApp</button><button class="btn line" data-a="copyAcesso">${ico("copy", 16)}Copiar</button></div>
        <button class="btn ghost block" data-a="sheet" data-k="novoMembro">Adicionar outra pessoa</button>`];
    }
    return ["Adicionar à equipe", `<p class="hint" style="margin-top:0">Crie o acesso com e-mail e uma senha temporária. A pessoa entra direto, sem precisar confirmar o e-mail.</p>
      ${formHtml([{ k: "nome", l: "Nome", ph: "Como a equipe vai ver a pessoa" }, { k: "email", l: "E-mail", t: "email", ph: "pessoa@email.com" }, { k: "papel", l: "Papel", t: "select", opts: Object.entries(PAPEIS) }, { k: "senha", l: "Senha temporária", ph: "mínimo 8 caracteres" }], s.vals)}
      ${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}
      <button class="btn block" data-a="doCriarMembro" ${s.busy ? "disabled" : ""}>${s.busy ? "Criando…" : "Criar acesso"}</button>
      <p class="hint">Quem já tem conta no ${APP} entra com o código da empresa, em Equipe.</p>`];
  },
  trocarSenha: s => ["Trocar senha", `${formHtml([{ k: "nova", l: "Nova senha (mínimo 8 caracteres)" }, { k: "conf", l: "Repita a nova senha" }], s.vals)}${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="doTrocarSenha" ${s.busy ? "disabled" : ""}>${s.busy ? "Salvando…" : "Salvar nova senha"}</button>`],
  membro: s => { const m = Mb(s.id); return ["Membro da equipe", `<div class="row"><span class="avatar">${initials(m.nome)}</span><span class="wmain"><b>${esc(m.nome)}</b><small>desde ${fdy(m.entrou)}</small></span></div>
    <label class="field">Papel<select data-f="papel">${Object.entries(PAPEIS).map(([k, l]) => `<option value="${k}" ${s.vals.papel === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field">Comissão sobre vendas (%)<input data-f="comissao" inputmode="decimal" value="${esc(s.vals.comissao)}"></label>
    ${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveMembro">Salvar</button>${m.id !== UID ? `<button class="btn danger block" style="margin-top:8px" data-a="rmMembro">Remover da empresa</button>` : ""}`]; },
  cancelPed: s => { const o = Pe(s.id), c = pedCalc(o); return [`Cancelar ${tipoPed(o.tipo).toLowerCase()} #${o.num}`, `
    <p>${o.tipo === "orcamento" ? "O orçamento será marcado como cancelado." : `As ${o.tipo === "consig" ? sum(o.itens, i => i.q - (i.dev || 0)) : c.qtd} unidades voltam para o estoque e o valor sai do contas a receber.`}</p>
    ${c.pago > 0 ? `<div class="note warn">Este pedido já tem ${fmt(c.pago)} recebido. Ao cancelar, esse valor sai do caixa como devolvido ao cliente.</div>` : ""}
    <label class="field">Motivo<input data-f="motivo" value="${esc(s.vals.motivo || "")}" placeholder="Ex: cliente desistiu"></label>
    <button class="btn danger block" data-a="doCancelPed">Confirmar cancelamento</button>`]; },
  receberCompra: s => { const c = Co(s.id), k = compCalc(c); return [`Receber compra #${c.num}`, `<div class="list">${c.itens.map(i => { const p = P(i.p) || { nome: "Produto", tipo: "outros", estoque: 0 }; return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>estoque ${p.estoque} → ${p.estoque + i.q}</small></span><span class="right"><b>+${i.q}</b></span></div>`; }).join("")}</div>
    <p class="hint">O estoque sobe, o custo médio de cada produto é recalculado e ${fmt(k.total)} entra no contas a pagar (${CONDS[c.cond] || "à vista"}).</p>
    <button class="btn block" data-a="doReceberCompra">Confirmar recebimento</button>`]; }
};
function pickList(s, items, row, key) {
  const q = norm(s.q || ""), list = items.filter(x => !q || norm(key(x)).includes(q));
  return `<label class="search">${ico("search", 18)}<input data-sq="1" type="search" value="${esc(s.q || "")}" placeholder="Buscar" aria-label="Buscar"></label><div class="list" id="sl" style="margin-top:10px">${list.map(row).join("") || empty("Nada encontrado.", "")}</div>`;
}
const SHD = {
  entrada: s => { const p = P(s.id), n = (s.unit === "cx" ? 6 : 1) * (Number(s.qty) || 0); return `<p class="hint center">${n} un. · estoque passa de ${p.estoque} para <b>${p.estoque + n}</b></p>`; },
  baixa: s => { const p = P(s.id), q = Number(s.qty) || 0; return `<p class="hint center">Estoque passa de ${p.estoque} para <b>${p.estoque - q}</b>${p.estoque - q <= (p.min || 0) ? " (abaixo do mínimo)" : ""}</p>`; },
  contagem: s => { const p = P(s.id), d = (Number(s.qty) || 0) - p.estoque; return d === 0 ? '<div class="note good">Bate com o sistema.</div>' : `<div class="note warn">Diferença de ${d > 0 ? "+" : "−"}${Math.abs(d)} un. Será registrada como ajuste de contagem.</div>`; },
  consig: s => { const o = Pe(s.oid), i = o.itens[s.ix], p = P(i.p) || { estoque: 0 }, q = Number(s.qty) || 0; return s.m === "vend" ? `<p class="hint center">Valor a cobrar: <b>${fmt(q * i.preco)}</b></p>` : `<p class="hint center">Estoque passa de ${p.estoque} para <b>${p.estoque + q}</b></p>`; }
};
function payInfo(s) {
  if (s.src === "ped") { const o = Pe(s.id), k = pedCalc(o), c = Cl(o.cli); return { quem: c ? c.nome : "Cliente", desc: `Pedido #${o.num}`, aberto: k.aberto, parcelas: k.parcelas.length }; }
  if (s.src === "comp") { const c = Co(s.id), k = compCalc(c), f = Fo(c.forn); return { quem: f ? f.nome : "Fornecedor", desc: `Compra #${c.num}`, aberto: k.aberto, parcelas: k.parcelas.length }; }
  const f = Fi(s.id), k = finCalc(f); return { quem: f.cat || f.desc, desc: f.desc, aberto: k.aberto, parcelas: 1 };
}
function limits(s) {
  if (s.k === "entrada") return [1, 9999];
  if (s.k === "baixa") return [1, Math.max(1, P(s.id).estoque)];
  if (s.k === "contagem") return [0, 99999];
  if (s.k === "consig") { const i = Pe(s.oid).itens[s.ix]; return [1, i.q - (i.vend || 0) - (i.dev || 0)]; }
  return [0, 99999];
}
function validQty(s) { const [a, z] = limits(s), q = Number(s.qty); if (!Number.isInteger(q) || q < a || q > z) { toast(`Informe uma quantidade entre ${a} e ${z}.`); return false; } return true; }
function renderSheet() {
  const s = ui.sheet, el = $("sheet"), sc = $("scrim");
  if (!s) { el.classList.remove("open"); sc.classList.remove("open"); document.body.style.overflow = ""; return; }
  const [title, body] = SH[s.k](s);
  $("sheetTitle").textContent = title;
  $("sheetBack").innerHTML = s.back ? `<button class="iconbtn" data-a="sheetBack" aria-label="Voltar">${ico("back", 18)}</button>` : "";
  $("sheetBody").innerHTML = body;
  el.classList.add("open"); sc.classList.add("open"); document.body.style.overflow = "hidden";
}
function openSheet(obj, noBack) {
  if (ui.sheet && !noBack) obj.back = ui.sheet;
  obj.vals = obj.vals || {};
  ui.sheet = obj; renderSheet(); $("sheet").scrollTop = 0; $("sheet").focus({ preventScroll: true });
}
function closeSheet() { ui.sheet = null; if ($("sheet")) renderSheet(); }
const novaCatId = () => "c" + rid().replace(/[^a-z0-9]/gi, "").slice(0, 7).toLowerCase();
/* Salva a lista de categorias no cadastro da empresa (msg vazia = só reordenação, sem registro na Atividade) */
function salvarCats(lista, msg, extra) { return commit([Store.putEmp(Object.assign({}, S.emp, { cats: lista })), ...(extra || []), ...(msg ? [logMov("cadastro", msg)] : [])]); }
/* Senha temporária fácil de digitar: 4 letras e 4 números (sem l, o, 0 e 1, que se confundem) */
function senhaTemp() {
  const L = "abcdefghjkmnpqrstuvwxyz", N = "23456789", r = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  let s = ""; for (let i = 0; i < 4; i++) s += L[r(L.length)]; for (let i = 0; i < 4; i++) s += N[r(N.length)]; return s;
}
const textoAcesso = f => `Olá, ${f.nome}! Seu acesso ao ${APP}${S.emp ? " da " + S.emp.nome : ""}:\nE-mail: ${f.email}\nSenha temporária: ${f.senha}\n\nBaixe o app, entre com esses dados e troque a senha em Mais → Minha conta.`;
/* Produto novo começa na primeira categoria, com NCM e mínimo padrão dela */
function novoProdVals() { const c = cats()[0] || catDe("outros"); return { tipo: c.id, vol: ehVinho() ? 750 : "", estoque: 0, min: c.min != null && c.min !== "" ? c.min : 0, forn: "", ncm: c.ncm || "", origem: ehVinho() ? "2" : "0", st: "nao" }; }
function initSheet(k, id, t) {
  const o = { k, id };
  if (k === "entrada") Object.assign(o, { qty: 6, unit: "un" });
  if (k === "baixa") Object.assign(o, { qty: 1, reason: BAIXAS[0] });
  if (k === "contagem") Object.assign(o, { qty: P(id).estoque });
  if (k === "prodForm") { const p = id ? P(id) : null; o.vals = p ? { nome: p.nome, tipo: catDe(p.tipo).id, marca: p.marca, ref: p.ref, material: p.material, medida: p.medida, safra: p.safra, uva: p.uva, vol: p.vol, pais: p.pais, regiao: p.regiao, produtor: p.produtor, teor: p.teor, forn: p.forn || "", custo: money(p.custo), pv: money(preco(p, "varejo")), pa: money(p.precos.atacado), pr: money(p.precos.restaurante), pc: p.precos.consig ? money(p.precos.consig) : "", min: p.min, ean: p.ean, loc: p.loc, temp: p.temp, harmon: p.harmon, ncm: p.ncm || "", cest: p.cest || "", origem: p.origem || (p.pais && p.pais !== "Brasil" ? "2" : "0"), st: p.st ? "sim" : "nao" } : novoProdVals(); }
  if (k === "condCli") { const c = Cl(id); o.vals = { descPct: c.descPct ? dec(c.descPct) : "", tabela: c.tabela || "varejo" }; }
  if (k === "cliForm") { const c = id ? Cl(id) : null; o.vals = c ? Object.assign({ uf: temFiscal() ? "SC" : "", indIE: "9" }, c, { limite: c.limite ? money(c.limite) : "" }) : { tipo: "Restaurante", tabela: "restaurante", uf: temFiscal() ? (fiscalCfg().uf || "SC") : "", indIE: "9" }; }
  if (k === "fornForm") { const f = id ? Fo(id) : null; o.vals = f ? Object.assign({}, f) : { prazo: 30 }; }
  if (k === "empForm") o.vals = Object.assign({}, S.emp, { pais: paisEmp(), ivaSomar: S.emp.ivaSomar === false ? "incluido" : "mais" });
  if (k === "catForm") { const c = id ? catDe(id) : null; o.vals = c ? { l: c.l, c: c.c, ncm: c.ncm || "", min: c.min || "" } : { l: "", c: CAT_CORES.find(x => !cats(true).some(y => y.c === x)) || CAT_CORES[5], ncm: "", min: "" }; o.mover = ""; }
  if (k === "rubroForm") o.vals = { rubro: rubro(), sugeridas: true };
  if (k === "finForm") { o.vals = { cat: id === "receber" ? "Eventos" : "Aluguel", venc: today }; o.forma = formas()[0]; o.pago = false; }
  if (k === "novoMembro") o.vals = { papel: "vendedor", senha: senhaTemp() };
  if (k === "trocarSenha") o.vals = { nova: "", conf: "" };
  if (k === "membro") { const m = Mb(id); o.vals = { papel: m.papel, comissao: dec(m.comissao || 0) }; }
  if (k === "criarEmp" || k === "entrarEmp") o.vals = { rubro: "vinhos", pais: "BR", ivaSomar: "mais", seuNome: SESSION && SESSION.user && SESSION.user.user_metadata ? SESSION.user.user_metadata.nome || "" : "" };
  return o;
}

/* ================= Ações ================= */
/* Atualiza só a linha e o rodapé, sem redesenhar a tela (não tira o foco do campo que está sendo digitado) */
function invAtualiza(pid) {
  const p = P(pid), row = document.querySelector(`.irow[data-row="${pid}"]`);
  if (p && row) {
    const tmp = document.createElement("div"); tmp.innerHTML = invRow(p); const n = tmp.firstElementChild;
    row.className = n.className; row.querySelector(".ist").innerHTML = n.querySelector(".ist").innerHTML; row.querySelector("small").innerHTML = n.querySelector("small").innerHTML;
    const inp = row.querySelector("input"); if (inp && document.activeElement !== inp) inp.value = n.querySelector("input").value;
  }
  const f = $("ifoot"); if (f) f.innerHTML = invFoot();
  const pr = document.querySelector(".invprog"); if (pr) { const l = invLista(), k = l.filter(x => invContado(x.id)).length, fa = l.length - k; pr.innerHTML = `<div><b>${k} de ${l.length}</b> contados${fa ? ` · faltam ${fa}` : " · tudo contado"}</div><div class="bar"><i style="width:${l.length ? Math.round(k / l.length * 100) : 0}%"></i></div>`; }
  document.querySelectorAll('[data-a="invF"]').forEach(b => { const l = invLista(), k = l.filter(x => invContado(x.id)).length; b.textContent = b.dataset.id === "todos" ? `Todos (${l.length})` : b.dataset.id === "faltam" ? `Faltam (${l.length - k})` : `Contados (${k})`; });
}
function go(r, id) { ui.stack.push({ route: ui.route, id: ui.id }); ui.route = r; ui.id = id || null; render(); window.scrollTo(0, 0); }
function goTab(r) { closeSheet(); ui.stack = []; ui.route = r; ui.id = null; render(); window.scrollTo(0, 0); }
function back() { const p = ui.stack.pop(); if (p) { ui.route = p.route; ui.id = p.id; } else { ui.route = "inicio"; ui.id = null; } render(); window.scrollTo(0, 0); }
const putProd = (p, ch) => Store.put("prod", p.id, Object.assign({}, p, ch));

async function confirmPedido() { const d = ui.draft; if (!d || d._salvando) return; d._salvando = true; try { await confirmPedido0(); } finally { d._salvando = false; } }
async function confirmPedido0() {
  const d = ui.draft, t = draftCalc(), cf = d.cli === "CF", cl = cf ? { nome: "Consumidor final" } : Cl(d.cli); if (!cl || !t.n) return;
  const inat = Object.keys(d.qty).filter(pid => d.qty[pid] > 0 && P(pid) && P(pid).ativo === false);
  if (inat.length) { inat.forEach(pid => delete d.qty[pid]); avisoInativo(P(inat[0])); updateDraft(); return; }
  const itens = Object.entries(d.qty).filter(([, q]) => q > 0).map(([pid, q]) => { const p = P(pid); return { p: pid, q, preco: precoDraft(p), custo: p.custo || 0, vend: 0, dev: 0 }; });
  if (d.tipo !== "orcamento") { const bad = itens.find(i => i.q > P(i.p).estoque); if (bad) { toast("Estoque insuficiente: " + P(bad.p).nome); updateDraft(); return; } }
  let numero; try { numero = await Store.nextNum("ped"); } catch (e) { toast("Sem conexão com o servidor. Tente de novo."); return; }
  const id = rid();
  const o = { num: numero, tipo: d.tipo, status: d.tipo === "orcamento" ? "orcamento" : "aberto", cli: cf ? null : d.cli, data: today, tabela: d.tabela, itens, vendedor: UID, pag: [], obs: d.obs || "", criadoEm: isoT(new Date()) };
  if (d.iva && ivaTaxa()) o.iva = ivaTaxa(); // preços sem IVA: o imposto entra no total, nas parcelas e no acerto
  if (d.tipo === "consig") { o.venc = addDays(today, Number(d.prazo) || 30); o.desc = 0; }
  else { o.desc = t.desc; o.cond = d.cond; o.parc = makeParcelas(t.total, d.cond, today); }
  if (cf) { o.consumidor = { cpf: d.cpf || "" }; o.cond = "0"; o.parc = makeParcelas(t.total, "0", today); }
  if (d.tipo === "venda" && d.cond === "0" && d.pagoAgora && can("receber")) o.pag = [{ data: isoT(new Date()), valor: t.total, forma: d.forma, por: UID }];
  const ws = [Store.put("ped", id, o)], chV = d.tipo !== "orcamento" ? itens.map(i => ({ id: i.p, delta: -i.q })) : [], mvV = mvDe(chV);
  if (chV.length) ws.push(Store.stock(chV));
  ws.push(logMov(d.tipo === "consig" ? "consig" : "venda", `${tipoPed(d.tipo)} #${numero} · ${cl.nome} · ${fmt(d.tipo === "consig" ? t.bruto : t.total)}`, { ref: id, ps: itens.map(i => i.p), ...(chV.length ? { tm: d.tipo === "consig" ? "consig" : "venda", mv: mvV } : { tm: "outro" }) }));
  if (o.pag.length) ws.push(logMov("fin", `Recebimento ${fmt(t.total)} · ${cl.nome} · pedido #${numero} · ${d.forma}`, { ref: id }));
  if (d.fromOrc) { const orc = Pe(d.fromOrc); if (orc) ws.push(Store.put("ped", orc.id, Object.assign({}, orc, { status: "convertido", convertidoEm: id }))); }
  if (!(await commit(ws))) return;
  ui.draft = null; ui.stack = [{ route: "vendas", id: null }]; ui.route = "pedido"; ui.id = id; render(); window.scrollTo(0, 0);
  toast(d.tipo === "orcamento" ? `Orçamento #${numero} salvo` : `Pedido #${numero} confirmado · estoque atualizado`);
}
async function doPay(s) {
  const info = payInfo(s), v = r2(parseMoney(s.vals.valor));
  if (!(v > 0) || v > info.aberto + 0.001) { toast(`Informe um valor entre ${fmt(0.01)} e ${fmt(info.aberto)}.`); return; }
  const dt = s.vals.data && s.vals.data !== today ? s.vals.data + "T12:00:00" : isoT(new Date());
  const entry = { data: dt, valor: v, forma: s.forma, por: UID };
  const col = s.src === "ped" ? "ped" : s.src === "comp" ? "comp" : "fin", doc = (col === "ped" ? Pe : col === "comp" ? Co : Fi)(s.id);
  const entradaDinheiro = col === "ped" || (col === "fin" && doc.tipo === "receber");
  if (!(await commit([Store.appendPag(col, s.id, entry), logMov("fin", `${entradaDinheiro ? "Recebimento" : "Pagamento"} ${fmt(v)} · ${info.quem} · ${info.desc} · ${s.forma}`, { ref: s.id })]))) return;
  closeSheet(); toast(`${entradaDinheiro ? "Recebimento" : "Pagamento"} de ${fmt(v)} registrado`);
}
async function doConsig(s) {
  if (!validQty(s)) return;
  const o = Pe(s.oid), no = clone(o), i = no.itens[s.ix], p = P(i.p), q = Number(s.qty), c = Cl(o.cli), ws = [];
  if (s.m === "vend") { i.vend = (i.vend || 0) + q; ws.push(logMov("consig", `Acerto: vendeu ${q} × ${p ? p.nome : ""} · ${c ? c.nome : ""} · #${o.num} · ${fmt(q * i.preco)}`, { ref: o.id, ps: [i.p], tm: "acerto" })); }
  else { i.dev = (i.dev || 0) + q; const mvD = p ? mvDe([{ id: p.id, delta: q }]) : []; if (p) ws.push(Store.stock([{ id: p.id, delta: q }])); ws.push(logMov("consig", `Devolução de consignação: ${q} × ${p ? p.nome : ""} · ${c ? c.nome : ""} · #${o.num}`, { ref: o.id, ps: [i.p], tm: "dev_consig", mv: mvD })); }
  ws.unshift(Store.put("ped", o.id, Object.assign({}, no, { id: o.id })));
  if (!(await commit(ws))) return;
  closeSheet(); toast(s.m === "vend" ? `${q} un. faturadas · ${fmt(q * i.preco)}` : `${q} un. voltaram ao estoque`);
}
function receiveWrites(c, cid) {
  const agg = {};
  c.itens.forEach(i => { const a = agg[i.p] = agg[i.p] || { q: 0, v: 0 }; a.q += i.q; a.v += i.q * i.custo; });
  const ws = [], chR = Object.entries(agg).filter(([pid]) => P(pid)).map(([pid, a]) => ({ id: pid, delta: a.q, custoEntrada: a.q ? a.v / a.q : 0 })), mvR = mvDe(chR);
  ws.push(Store.stock(chR));
  if (c.forn) Object.keys(agg).forEach(pid => { const p = P(pid); if (p && !p.forn) ws.push(Store.patch("prod", pid, { forn: c.forn })); });
  ws.push(logMov("estoque", `Mercadoria recebida · compra #${c.num} · ${sum(c.itens, i => i.q)} un.`, { ref: cid, ps: Object.keys(agg), tm: "receb", mv: mvR }));
  return ws;
}
async function salvarCompra() {
  const d = ui.cdraft, f = Fo(d.forn);
  const itens = d.itens.map(i => ({ p: i.p, q: parseInt(i.q, 10) || 0, custo: r2(parseMoney(i.custo) || 0) })).filter(i => i.q > 0);
  if (!f || !itens.length) { toast("Escolha o fornecedor e ao menos um item com quantidade."); return; }
  let numero; try { numero = await Store.nextNum("comp"); } catch (e) { toast("Sem conexão com o servidor. Tente de novo."); return; }
  const id = rid();
  const c = { num: numero, forn: d.forn, data: today, prev: addDays(today, Number(d.prev) || 7), status: "pedido", cond: d.cond, itens, pag: [], obs: d.obs || "", criadoPor: UID };
  const total = r2(sum(itens, i => i.q * i.custo)), ws = [];
  if (d.jaRecebido && can("ajuste")) { c.status = "recebido"; c.recebidoEm = today; c.parc = makeParcelas(total, d.cond, today); }
  ws.push(Store.put("comp", id, c));
  if (c.status === "recebido") ws.push(...receiveWrites(c, id));
  ws.push(logMov("compra", `Pedido de compra #${numero} · ${f.nome} · ${fmt(total)}`, { ref: id, ps: itens.map(i => i.p), tm: "compra" }));
  if (!(await commit(ws))) return;
  ui.cdraft = null; ui.stack = [{ route: "compras", id: null }]; ui.route = "compra"; ui.id = id; render(); window.scrollTo(0, 0);
  toast(c.status === "recebido" ? `Compra #${numero} recebida · estoque atualizado` : `Compra #${numero} salva`);
}
/* Importação: cria o que é novo e ATUALIZA o que já existe (mesmo código de barras,
   mesmo nome+safra ou mesmo nome), sem duplicar. A coluna "estoque" vira a quantidade atual. */
const impG = (r, ...ks) => { for (const x of ks) if (r[x] != null && String(r[x]).trim() !== "") return String(r[x]).trim(); return ""; };
const impTipoDe = t => {
  const n = norm(t), l = cats(true);
  if (!n) return ehVinho() && l.some(c => c.id === "tinto") ? "tinto" : (cats()[0] || catDe("outros")).id;
  const ex = l.find(c => c.id === n || norm(c.l) === n) || l.find(c => norm(c.l).length >= 4 && (norm(c.l).startsWith(n) || n.startsWith(norm(c.l))));
  if (ex) return ex.id;
  if (ehVinho()) { if (n.startsWith("ros")) return "rose"; if (n.startsWith("bran")) return "branco"; if (n.startsWith("esp")) return "espumante"; if (n.startsWith("sob")) return "sobremesa"; if (n.startsWith("fort") || n.includes("porto")) return "fortificado"; if (n.startsWith("tin")) return "tinto"; }
  return "outros";
};
const impInt = v => { const s = String(v), n = PC().dec === "," ? parseInt(s.replace(/\./g, "").replace(",", "."), 10) : parseInt(s.replace(/,/g, ""), 10); return isNaN(n) ? null : n; };
/* Planilha do tipo errado (ex.: estoque importado como clientes criaria um cliente para cada vinho) */
const IMP_SO = {
  prod: ["categoria", "marca", "referencia", "material", "medida", "ncm", "uva", "pais", "regiao", "safra", "volume", "vol", "produtor", "codigo", "ean", "codigo_de_barras", "custo", "preco", "preco_varejo", "preco_atacado", "preco_restaurante", "preco_consignado", "preco_consignacao", "estoque", "quantidade", "qtd", "minimo", "estoque_minimo", "localizacao"],
  cli: ["razao_social", "razao", "cnpj", "cpf", "documento", "contato", "telefone", "fone", "whatsapp", "email", "cidade", "limite", "tabela"]
};
function impOutroTipo(rows, k) {
  if (!rows.length || !IMP_SO[k]) return null;
  const cols = Object.keys(rows[0]), outro = k === "prod" ? "cli" : "prod";
  const meus = cols.filter(c => IMP_SO[k].includes(c)), deles = cols.filter(c => IMP_SO[outro].includes(c));
  return deles.length >= 2 && deles.length > meus.length * 2 ? { tipo: outro, cols: deles } : null;
}
function impPlano(rows, k) {
  const lista = k === "prod" ? S.prod : S.cli, plano = { novos: [], atual: [], ajustes: 0 }, usados = new Set();
  const porCod = new Map(), porNomeSafra = new Map(), porNome = new Map();
  lista.forEach(x => {
    const cod = digits(k === "prod" ? x.ean : x.doc); if (cod) porCod.set(cod, x);
    const n = norm(x.nome); porNomeSafra.set(n + "|" + (x.safra || ""), x);
    const nomes = [n]; if (x.safra) nomes.push(norm(x.nome + " " + x.safra)); // "Aurora Tardia 2022" = nome + safra
    nomes.forEach(c => porNome.set(c, porNome.has(c) && porNome.get(c) !== x ? null : x)); // nome repetido no cadastro: não adivinha
  });
  const novosVistos = new Set();
  rows.forEach(r => {
    const cod = digits(k === "prod" ? impG(r, "codigo", "ean", "codigo_de_barras") : impG(r, "cnpj", "cpf", "documento")), n = norm(r.nome);
    const x = (cod && porCod.get(cod)) || (k === "prod" && porNomeSafra.get(n + "|" + impG(r, "safra"))) || porNome.get(n) || null;
    if (!x) { // novo: a mesma linha repetida no arquivo entra uma vez só
      const chave = cod || n + "|" + impG(r, "safra");
      if (!novosVistos.has(chave)) { novosVistos.add(chave); plano.novos.push(r); }
      return;
    }
    if (!usados.has(x.id)) {
      usados.add(x.id);
      const q = k === "prod" ? impInt(impG(r, "estoque", "quantidade", "qtd")) : null;
      const delta = q == null ? 0 : q - (x.estoque || 0); if (delta) plano.ajustes++;
      plano.atual.push({ r, x, delta, q });
    }
  });
  return plano;
}
function impProdNovo(r) {
  const g = (...ks) => impG(r, ...ks);
  const tipo = impTipoDe(g("tipo", "categoria")), cat = catDe(tipo), min = impInt(g("minimo", "estoque_minimo"));
  return { nome: r.nome.trim(), tipo, uva: g("uva"), pais: g("pais"), regiao: g("regiao"), safra: g("safra"), vol: parseInt(g("volume", "vol"), 10) || (ehVinho() ? 750 : 0), produtor: g("produtor"), marca: g("marca"), ref: g("referencia", "ref"), material: g("material", "banho"), medida: g("medida", "tamanho", "peso"), ncm: digits(g("ncm")) || digits(cat.ncm), ean: g("codigo", "ean", "codigo_de_barras"), custo: r2(parseMoney(g("custo")) || 0), precos: Object.assign({ varejo: r2(parseMoney(g("preco_varejo", "preco")) || 0), atacado: r2(parseMoney(g("preco_atacado")) || 0), restaurante: r2(parseMoney(g("preco_restaurante")) || 0) }, parseMoney(g("preco_consignado", "preco_consignacao")) > 0 ? { consig: r2(parseMoney(g("preco_consignado", "preco_consignacao"))) } : {}), estoque: impInt(g("estoque", "quantidade", "qtd")) || 0, min: min != null ? min : Number(cat.min) || 0, loc: g("localizacao"), ativo: true };
}
function impProdMudancas(r, p) {
  const g = (...ks) => impG(r, ...ks), m = {};
  const txt = (campo, ...ks) => { const v = g(...ks); if (v && v !== String(p[campo] || "")) m[campo] = v; };
  if (g("tipo", "categoria")) { const t = impTipoDe(g("tipo", "categoria")); if (t !== p.tipo) m.tipo = t; }
  txt("marca", "marca"); txt("ref", "referencia", "ref"); txt("material", "material", "banho"); txt("medida", "medida", "tamanho", "peso");
  txt("uva", "uva"); txt("pais", "pais"); txt("regiao", "regiao"); txt("safra", "safra"); txt("produtor", "produtor"); txt("loc", "localizacao");
  const cod = g("codigo", "ean", "codigo_de_barras"); if (cod && !p.ean) m.ean = cod;
  const vol = parseInt(g("volume", "vol"), 10); if (vol && vol !== p.vol) m.vol = vol;
  const custo = parseMoney(g("custo")); if (custo > 0 && r2(custo) !== p.custo) m.custo = r2(custo);
  const min = impInt(g("minimo", "estoque_minimo")); if (min != null && min !== p.min) m.min = min;
  const precos = Object.assign({}, p.precos || {}); let mudou = false;
  [["varejo", "preco_varejo", "preco"], ["atacado", "preco_atacado"], ["restaurante", "preco_restaurante"], ["consig", "preco_consignado", "preco_consignacao"]].forEach(([t, ...ks]) => { const v = parseMoney(g(...ks)); if (v > 0 && r2(v) !== precos[t]) { precos[t] = r2(v); mudou = true; } });
  if (mudou) m.precos = precos;
  if (p.ativo === false) m.ativo = true;
  return m;
}
function impCliNovo(r) {
  const g = (...ks) => impG(r, ...ks), tab = norm(g("tabela"));
  return { nome: r.nome.trim(), razao: g("razao_social", "razao"), doc: g("cnpj", "cpf", "documento"), tipo: CLI_TIPOS.find(t => norm(t) === norm(g("tipo"))) || "Outro", contato: g("contato"), fone: g("telefone", "whatsapp", "fone"), email: g("email"), cidade: g("cidade"), tabela: TABELAS[tab] ? tab : "varejo", limite: r2(parseMoney(g("limite")) || 0), obs: "", ativo: true };
}
function impCliMudancas(r, c) {
  const n = impCliNovo(r), m = {};
  ["razao", "doc", "contato", "fone", "email", "cidade"].forEach(f => { if (n[f] && n[f] !== (c[f] || "")) m[f] = n[f]; });
  if (impG(r, "tipo") && n.tipo !== c.tipo) m.tipo = n.tipo;
  if (impG(r, "tabela") && n.tabela !== c.tabela) m.tabela = n.tabela;
  if (impG(r, "limite") && n.limite !== c.limite) m.limite = n.limite;
  return m;
}
async function importar() {
  const rows = parseCSV(ui.impTxt).filter(r => r.nome && r.nome.trim()), k = ui.impTipo; if (!rows.length) return;
  if (impOutroTipo(rows, k)) { toast("Esta planilha parece ser de outro tipo. Confira antes de importar."); render(); return; }
  const plano = impPlano(rows, k), ops = [];
  plano.novos.forEach(r => ops.push(() => [Store.put(k, rid(), k === "prod" ? impProdNovo(r) : impCliNovo(r))]));
  const mvI = [];
  plano.atual.forEach(({ r, x, delta }) => ops.push(() => {
    const m = k === "prod" ? impProdMudancas(r, x) : impCliMudancas(r, x), ps = [];
    if (delta && k === "prod") mvI.push(...mvDe([{ id: x.id, delta }]));
    if (Object.keys(m).length) ps.push(Store.patch(k, x.id, m));
    if (delta) ps.push(Store.stock([{ id: x.id, delta }]));
    return ps;
  }));
  let feitos = 0;
  for (let i = 0; i < ops.length; i += 10) {
    const ps = ops.slice(i, i + 10).flatMap(f => f());
    if (ps.length && !(await commit(ps))) break;
    feitos = Math.min(ops.length, i + 10);
  }
  if (!feitos) return;
  const nomeK = k === "prod" ? "produtos" : "clientes", aj = plano.atual.filter(a => a.delta);
  const logs = [logMov("cadastro", `Importação de planilha (${nomeK}): ${plano.novos.length} novo${plano.novos.length === 1 ? "" : "s"}, ${plano.atual.length} atualizado${plano.atual.length === 1 ? "" : "s"}`)];
  if (aj.length) logs.push(logMov("estoque", `Importação · estoque ajustado em ${aj.length} produto${aj.length > 1 ? "s" : ""}: ` + aj.slice(0, 6).map(a => `${a.x.nome} ${a.x.estoque}→${a.q}`).join(", ") + (aj.length > 6 ? "…" : ""), { ps: aj.map(a => a.x.id), tm: "import", mv: mvI }));
  await commit(logs);
  ui.impTxt = ""; toast(`${plano.novos.length} novos · ${plano.atual.length} atualizados`);
  goTab(k === "prod" ? "estoque" : "mais"); if (k === "cli") go("clientes");
}

/* ---- Eventos ---- */
document.addEventListener("click", travarAcao(async e => {
  const t = e.target.closest("[data-a]"); if (!t || t.disabled) return;
  const a = t.dataset.a, id = t.dataset.id, s = ui.sheet;
  switch (a) {
    case "tab": goTab(t.dataset.r); break;
    case "go": closeSheet(); if (t.dataset.r === "movimentos") { ui.movP = id || ""; ui.movT = "todos"; go("movimentos"); break; } go(t.dataset.r, id); break;
    case "movPer": ui.movPer = id; render(); break;
    case "movT": ui.movT = id; render(); break;
    case "exportMov": { const p = ui.movP ? P(ui.movP) : null; saveFile(`movimentos-${p ? norm(p.nome).replace(/\s+/g, "-").slice(0, 40) : "estoque"}-${today}.csv`, csv(movCsv())); break; }
    case "back": back(); break;
    case "sheet": { const o = initSheet(t.dataset.k, id || null); if (t.dataset.t) o.t = t.dataset.t; openSheet(o); break; }
    case "closeSheet": closeSheet(); break;
    case "sheetBack": ui.sheet = s.back; renderSheet(); break;
    case "demo": startDemo(); break;
    case "openEmp": openCompany(id); break;
    case "sair": leaveCompany(); break;
    case "recarregar": if (MODE === "supa" && EID) SupaBE.open(EID); break;
    case "resetDemo": try { localStorage.removeItem(DEMO_KEY); } catch (er) {} startDemo(); toast("Dados de exemplo restaurados"); break;
    case "verComo": UID = id; saveDemo(); ui.stack = []; ui.route = "inicio"; render(); toast("Agora você vê o app como " + nomeDe(id)); break;
    case "vf": ui.vFiltro = id; render(); break;
    case "vendasFiltro": ui.vFiltro = id; goTab("vendas"); break;
    case "ef": ui.fTipo = id; render(); break;
    case "cf": ui.cFiltro = id; render(); break;
    case "kf": ui.kFiltro = id; render(); break;
    case "finTab": ui.finTab = id; render(); break;
    case "finF": ui.finFiltro = id; render(); break;
    case "fin": ui.finTab = id; ui.finFiltro = "abertos"; go("financeiro"); break;
    case "per": ui.per = id; render(); break;
    case "relTab": ui.relTab = id; render(); break;
    case "actF": ui.actF = id; render(); break;
    case "impTipo": ui.impTipo = id; if (!t.dataset.keep) ui.impTxt = ""; render(); break;
    case "prod": openSheet({ k: "prod", id }, true); break;
    /* pedido */
    case "novoPedido": closeSheet(); newDraft(id || "venda"); if (t.dataset.cli) { const c = Cl(t.dataset.cli); ui.draft.cli = c.id; ui.draft.tabela = c.tabela || "varejo"; } go("novoPedido"); break;
    case "dstep": { const p = P(id), max = ui.draft.tipo === "orcamento" ? 9999 : p.estoque; ui.draft.qty[id] = Math.max(0, Math.min(max, (ui.draft.qty[id] || 0) + Number(t.dataset.d))); updateDraft(); break; }
    case "dtipo": { const dc = ui.draft.cli && ui.draft.cli !== "CF" ? Cl(ui.draft.cli) : null; if (id === "consig") ui.draft.tabela = "consig"; else if (ui.draft.tipo === "consig") ui.draft.tabela = dc ? dc.tabela || "varejo" : "varejo"; ui.draft.tipo = id; render(); break; }
    case "dtab": ui.draft.tabela = id; render(); break;
    case "dprazo": ui.draft.prazo = Number(id); render(); break;
    case "dcond": ui.draft.cond = id; if (id !== "0") ui.draft.pagoAgora = false; render(); break;
    case "ddesc": ui.draft.desc = id; render(); break;
    case "dpago": ui.draft.pagoAgora = t.checked; render(); break;
    case "diva": ui.draft.iva = t.checked; render(); break;
    case "idioma": setIdioma(id); break;
    case "dforma": ui.draft.forma = id; render(); break;
    case "limparDraft": ui.draft.qty = {}; render(); break;
    case "setCli": { if (ui.route === "novoPedido" && ui.draft) { if (id === "CF") { ui.draft.cli = "CF"; ui.draft.tabela = "varejo"; ui.draft.cond = "0"; ui.draft.pagoAgora = true; if (ui.draft.tipo === "consig") ui.draft.tipo = "venda"; } else { const c = Cl(id); ui.draft.cli = id; ui.draft.tabela = ui.draft.tipo === "consig" ? "consig" : c.tabela || "varejo"; } } closeSheet(); render(); break; }
    case "confirmPedido": confirmPedido(); break;
    case "converter": { const o = Pe(id), q = {}; o.itens.forEach(i => { q[i.p] = (q[i.p] || 0) + i.q; }); newDraft("venda", { cli: o.cli, tabela: o.tabela, qty: q, cond: o.cond || "30", desc: o.desc ? money(o.desc) : "", obs: o.obs || "", fromOrc: o.id, iva: ivaTaxa() ? o.iva > 0 : false }); go("novoPedido"); toast("Confira o estoque e confirme o pedido"); break; }
    case "repetir": { const o = Pe(id), q = {}; o.itens.forEach(i => { q[i.p] = (q[i.p] || 0) + i.q; }); newDraft(o.tipo === "consig" ? "consig" : "venda", { cli: o.cli, tabela: o.tabela, qty: q, cond: o.cond || "30", iva: ivaTaxa() ? o.iva > 0 : false }); go("novoPedido"); break; }
    case "copyTxt": try { await navigator.clipboard.writeText(pedText(Pe(id))); toast("Texto copiado"); } catch (er) { toast("Não foi possível copiar neste aparelho"); } break;
    case "doCancelPed": {
      const o = Pe(s.id), ws = [Store.put("ped", o.id, Object.assign({}, o, { status: "cancelado", canceladoEm: isoT(new Date()), motivo: s.vals.motivo || "" }))];
      let mvC = [];
      if (o.tipo !== "orcamento") { const agg = {}; o.itens.forEach(i => { agg[i.p] = (agg[i.p] || 0) + (o.tipo === "consig" ? i.q - (i.dev || 0) : i.q); }); const ch = Object.entries(agg).filter(([pid, q]) => P(pid) && q).map(([pid, q]) => ({ id: pid, delta: q })); mvC = mvDe(ch); ws.push(Store.stock(ch)); }
      ws.push(logMov(o.tipo === "consig" ? "consig" : "venda", `${tipoPed(o.tipo)} #${o.num} cancelado${s.vals.motivo ? " · " + s.vals.motivo : ""}`, { ref: o.id, ps: o.itens.map(i => i.p), tm: o.tipo === "orcamento" ? "outro" : o.tipo === "consig" ? "est_consig" : "est_venda", mv: mvC }));
      const devolver = r2(sum(o.pag || [], p => p.valor)); if (devolver > 0) ws.push(logMov("fin", `Devolução ${fmt(devolver)} · ${Cl(o.cli) ? Cl(o.cli).nome : "Consumidor final"} · pedido #${o.num} cancelado`, { ref: o.id }));
      if (await commit(ws)) { closeSheet(); toast("Cancelado e estoque devolvido"); }
      break;
    }
    /* pagamentos */
    case "pay": { const o = { k: "pay", src: t.dataset.src, id, forma: formas()[0] }; o.vals = { valor: money(payInfo(o).aberto), data: today }; openSheet(o); break; }
    case "pforma": s.forma = id; renderSheet(); break;
    case "doPay": doPay(s); break;
    case "titulo": if (t.dataset.src === "ped") go("pedido", id); else if (t.dataset.src === "comp") go("compra", id); else openSheet({ k: "finDet", id }, true); break;
    /* consignação */
    case "consig": openSheet({ k: "consig", oid: id, ix: Number(t.dataset.x), m: t.dataset.m, qty: 1 }, true); break;
    case "consigTudo": { const [, z] = limits(s); s.qty = z; renderSheet(); break; }
    case "doConsig": doConsig(s); break;
    /* estoque */
    case "step": { const [mn, mx] = limits(s); s.qty = Math.max(mn, Math.min(mx, (parseInt(s.qty, 10) || 0) + Number(t.dataset.d))); renderSheet(); break; }
    case "unit": s.unit = id; s.qty = id === "cx" ? 1 : 6; renderSheet(); break;
    case "reason": s.reason = id; renderSheet(); break;
    case "doEntrada": {
      if (!validQty(s)) break;
      const p = P(s.id), n = Number(s.qty) * (s.unit === "cx" ? 6 : 1), cu = parseMoney(s.vals.custo);
      const mvE = mvDe([{ id: p.id, delta: n }]);
      if (await commit([Store.stock([{ id: p.id, delta: n, custoEntrada: cu > 0 && can("custo") ? cu : 0 }]), logMov("estoque", `Entrada · ${p.nome} · +${n}${s.vals.nota ? " · " + s.vals.nota : ""}`, { ps: [p.id], tm: "entrada", mv: mvE })])) { openSheet({ k: "prod", id: p.id }, true); toast(`+${n} un. · ${p.nome}`); }
      break;
    }
    case "doBaixa": {
      if (!validQty(s)) break;
      const p = P(s.id), q = Number(s.qty);
      const mvB = mvDe([{ id: p.id, delta: -q }]);
      if (await commit([Store.stock([{ id: p.id, delta: -q }]), logMov("estoque", `Baixa por ${s.reason.toLowerCase()} · ${p.nome} · −${q}${s.vals.nota ? " · " + s.vals.nota : ""}`, { ps: [p.id], tm: "baixa", mv: mvB, motivo: s.reason })])) { openSheet({ k: "prod", id: p.id }, true); toast(`${s.reason}: −${q} · ${p.nome}`); }
      break;
    }
    case "doContagem": {
      if (!validQty(s)) break;
      const p = P(s.id), q = Number(s.qty);
      const mvK = [{ p: p.id, q: q - p.estoque, de: p.estoque, c: q }], logK = logMov("estoque", `Contagem · ${p.nome} · sistema ${p.estoque}, contado ${q}`, { ps: [p.id], tm: "contagem", mv: mvK });
      const depois = () => { if (ui.route === "inventario") closeSheet(); else openSheet({ k: "prod", id: p.id }, true); };
      if (q === p.estoque) { if (await commit([logK])) { toast("Contagem confere com o sistema"); depois(); } break; }
      if (await commit([Store.stock([{ id: p.id, delta: q - p.estoque }]), logK])) { depois(); toast("Estoque ajustado pela contagem"); }
      break;
    }
    case "invModo": ui.invModo = id; ui.invQ = ""; render(); break;
    case "invF": ui.invF = id; render(); break;
    case "invOk": { const p = P(id); if (!p) break; ui.inv[id] = String(p.estoque); invGuardar(); invAtualiza(id); break; }
    case "invDescartar": openSheet({ k: "invDescartar" }); break;
    case "doInvDescartar": ui.inv = {}; invGuardar(); closeSheet(); render(); toast("Contagem recomeçada"); break;
    case "finInv": { const list = invLista(); if (!list.length || list.some(p => !invContado(p.id))) { toast("Conte todos os produtos antes de finalizar."); break; } openSheet({ k: "finInv" }); break; }
    case "doFinInv": {
      const list = invLista(); if (!list.length || list.some(p => !invContado(p.id) || !(invNum(ui.inv[p.id]) >= 0))) { closeSheet(); toast("Conte todos os produtos antes de finalizar."); break; }
      const mvI = list.map(p => { const c = invNum(ui.inv[p.id]); return { p: p.id, q: r4(c - p.estoque), de: p.estoque, c }; }), diffs = mvI.filter(m => m.q);
      const plus = sum(diffs, m => Math.max(0, m.q)), minus = sum(diffs, m => Math.max(0, -m.q)), ws = [];
      const log = logMov("estoque", `Inventário geral · ${list.length} produtos contados · ${diffs.length} ajustado${diffs.length === 1 ? "" : "s"} (+${plus} / −${minus})`, { ps: list.map(p => p.id), tm: "inventario", mv: mvI });
      if (diffs.length) ws.push(Store.stock(diffs.map(m => ({ id: m.p, delta: m.q }))));
      ws.push(log);
      if (await commit(ws)) { ui.inv = {}; invGuardar(); closeSheet(); back(); toast(diffs.length ? `Inventário finalizado · ${diffs.length} ajuste${diffs.length === 1 ? "" : "s"}` : "Inventário finalizado · tudo conferiu"); }
      break;
    }
    case "toggleAtivo": { const p = P(id); if (await commit([Store.patch("prod", p.id, { ativo: p.ativo === false }), logMov("cadastro", `${p.ativo === false ? "Produto reativado" : "Produto inativado"} · ${p.nome}`, { ps: [p.id] })])) renderSheet(); break; }
    case "saveProd": {
      const v = s.vals, pv = parseMoney(v.pv);
      if (!String(v.nome || "").trim()) { s.err = "Informe o nome do produto."; renderSheet(); break; }
      const insumoF = ehFood() && (v.tipoItem === "insumo" || v.tipoItem === "embalagem");
      if (!(pv > 0) && !insumoF) { s.err = "Informe o preço de varejo, por exemplo 89,90."; renderSheet(); break; }
      let tipo = v.tipo || (cats()[0] || catDe("outros")).id; const ops = [];
      if (tipo === "__nova") { // categoria criada direto do cadastro do produto
        const nome = String(v.novaCat || "").trim(); if (!nome) { s.err = "Informe o nome da nova categoria."; renderSheet(); break; }
        const l = cats(true), ex = l.find(c => norm(c.l) === norm(nome));
        if (ex) { tipo = ex.id; if (ex.arq) { ex.arq = false; ops.push(Store.putEmp(Object.assign({}, S.emp, { cats: l }))); } }
        else { tipo = novaCatId(); const io = l.findIndex(c => c.id === "outros"); l.splice(io < 0 ? l.length : io, 0, { id: tipo, l: nome, c: CAT_CORES.find(x => !l.some(y => y.c === x)) || CAT_CORES[5], ncm: "", min: 0 }); ops.push(Store.putEmp(Object.assign({}, S.emp, { cats: l })), logMov("cadastro", `Nova categoria · ${nome}`)); }
      }
      const cat = catDe(tipo), old = s.id ? P(s.id) : null, pid = s.id || rid();
      const doc = Object.assign({}, { nome: v.nome.trim(), ncm: digits(v.ncm) || (old ? "" : digits(cat.ncm)), cest: digits(v.cest), origem: v.origem || "0", st: v.st === "sim", tipo, forn: v.forn || "", custo: r2(parseMoney(v.custo) || 0), precos: Object.assign({ varejo: r2(pv), atacado: r2(parseMoney(v.pa) || pv), restaurante: r2(parseMoney(v.pr) || pv) }, parseMoney(v.pc) > 0 ? { consig: r2(parseMoney(v.pc)) } : {}), min: v.min === "" || v.min == null ? (old ? 0 : Number(cat.min) || 0) : ehFood() ? r4(parseMoney(v.min) || 0) : parseInt(v.min, 10) || 0, ean: v.ean || "", loc: v.loc || "", harmon: v.harmon || "", ativo: old ? old.ativo !== false : true });
      const naFicha = SPEC.prod({ vals: v }).map(f => f.k);
      SPEC.campos.forEach(k => { if (naFicha.includes(k)) doc[k] = k === "vol" ? parseInt(v.vol, 10) || 0 : v[k] || ""; });
      if (ehFood()) { doc.custo = r4(parseMoney(v.custo) || 0); if (!doc.tipoItem) doc.tipoItem = "venda"; if (!doc.un) doc.un = "un"; }
      if (!old) doc.estoque = ehFood() ? r4(parseMoney(v.estoque) || 0) : parseInt(v.estoque, 10) || 0;
      if (await commit([...ops, old ? Store.patch("prod", pid, doc) : Store.put("prod", pid, doc), logMov("cadastro", `${old ? "Produto editado" : "Novo produto"} · ${doc.nome}`, { ps: [pid] })])) {
        if (!old && s.fromCompra && ui.cdraft) { ui.cdraft.itens.push({ p: pid, q: ehVinho() ? 6 : 1, custo: money(doc.custo) }); if (!ui.cdraft.forn && doc.forn) ui.cdraft.forn = doc.forn; closeSheet(); render(); toast("Produto cadastrado e incluído na compra"); }
        else { openSheet({ k: "prod", id: pid }, true); toast(old ? "Produto atualizado" : "Produto cadastrado"); }
      }
      break;
    }
    /* categorias de produto */
    case "catCor": s.vals.c = id; renderSheet(); break;
    case "saveCat": {
      const v = s.vals, nome = String(v.l || "").trim(), l = cats(true);
      if (!nome) { s.err = "Informe o nome da categoria."; renderSheet(); break; }
      if (l.some(c => c.id !== s.id && norm(c.l) === norm(nome))) { s.err = "Já existe uma categoria com esse nome."; renderSheet(); break; }
      const ncm = digits(v.ncm); if (ncm && ncm.length !== 8) { s.err = "O NCM tem 8 dígitos."; renderSheet(); break; }
      const dados = { l: nome, c: v.c || CAT_CORES[5], ncm, min: parseInt(v.min, 10) || 0 };
      if (s.id) Object.assign(l.find(c => c.id === s.id), dados);
      else { const io = l.findIndex(c => c.id === "outros"); l.splice(io < 0 ? l.length : io, 0, Object.assign({ id: novaCatId() }, dados)); }
      if (await salvarCats(l, `${s.id ? "Categoria editada" : "Nova categoria"} · ${nome}`)) { closeSheet(); toast(s.id ? "Categoria salva" : "Categoria criada"); }
      break;
    }
    case "catArq": {
      const l = cats(true), c = l.find(x => x.id === s.id); if (!c || c.id === "outros") break;
      c.arq = !c.arq;
      if (await salvarCats(l, `Categoria ${c.arq ? "arquivada" : "reativada"} · ${c.l}`)) { closeSheet(); toast(c.arq ? "Categoria arquivada" : "Categoria reativada"); }
      break;
    }
    case "catDel": s.confirmDel = true; if (!s.vals.mover) s.vals.mover = (cats().find(x => x.id !== s.id) || {}).id || "outros"; renderSheet(); break;
    case "catDelOk": {
      const l = cats(true), c = l.find(x => x.id === s.id); if (!c || c.id === "outros") break;
      const ps = S.prod.filter(p => catDe(p.tipo).id === c.id), dest = ps.length ? (cats().find(x => x.id === s.vals.mover && x.id !== c.id) || catDe("outros")).id : null;
      const ops = ps.map(p => Store.patch("prod", p.id, { tipo: dest }));
      if (await salvarCats(l.filter(x => x.id !== c.id), `Categoria excluída · ${c.l}${ps.length ? ` (${ps.length} produto${ps.length === 1 ? "" : "s"} para ${catLabel(dest)})` : ""}`, ops)) { closeSheet(); toast("Categoria excluída"); }
      break;
    }
    case "catMover": {
      const l = cats(true), i = l.findIndex(c => c.id === id), j = i + Number(t.dataset.d);
      if (i < 0 || j < 0 || j >= l.length) break;
      [l[i], l[j]] = [l[j], l[i]];
      await salvarCats(l, null);
      break;
    }
    case "rubroSug": s.vals.sugeridas = t.checked; break;
    case "saveRubro": {
      const r = RUBROS[s.vals.rubro] ? s.vals.rubro : rubro(); let l = cats(true);
      if (s.vals.sugeridas) {
        if (!S.prod.length) l = catsPadrao(r); // empresa ainda sem produtos: troca a lista inteira
        else { const novas = catsPadrao(r).filter(c => c.id !== "outros" && !l.some(x => x.id === c.id || norm(x.l) === norm(c.l))), io = l.findIndex(c => c.id === "outros"); l.splice(io < 0 ? l.length : io, 0, ...novas); }
      }
      if (await commit([Store.putEmp(Object.assign({}, S.emp, { rubro: r, cats: l })), logMov("cadastro", `Ramo da empresa: ${RUBROS[r].l}`)])) { closeSheet(); toast("Ramo atualizado"); }
      break;
    }
    /* cadastros */
    case "saveCli": {
      const v = s.vals; if (!String(v.nome || "").trim()) { s.err = "Informe o nome do cliente."; renderSheet(); break; }
      const docC = docNorm(v.doc); if (paisEmp() === "MX" && docC && !rfcValido(docC)) { s.err = "RFC inválido. São 12 caracteres para empresa (ex.: ABC010203XY1) ou 13 para pessoa física."; renderSheet(); break; }
      const old = s.id ? Cl(s.id) : null, cid = s.id || rid();
      const doc = { nome: v.nome.trim(), razao: v.razao || "", doc: docC, tipo: v.tipo || "Outro", contato: v.contato || "", fone: v.fone || "", email: v.email || "", cidade: v.cidade || "", endereco: v.endereco || "", tabela: v.tabela || "varejo", limite: r2(parseMoney(v.limite) || 0), obs: v.obs || "", ativo: true,
        logradouro: v.logradouro || "", numero: v.numero || "", bairro: v.bairro || "", cep: digits(v.cep), uf: v.uf || "", ie: v.ie || "", indIE: v.indIE || "9" };
      if (old) { if (old.precos) doc.precos = old.precos; if (old.descPct != null) doc.descPct = old.descPct; if (old.ativo === false) doc.ativo = false; }
      if (!(await commit([Store.put("cli", cid, doc), logMov("cadastro", `${old ? "Cliente editado" : "Novo cliente"} · ${doc.nome}`, { ref: cid })]))) break;
      const prev = s.back;
      if (prev && prev.k === "pickCli" && ui.draft) { ui.draft.cli = cid; ui.draft.tabela = doc.tabela; closeSheet(); render(); }
      else { closeSheet(); if (!old) go("cliente", cid); }
      toast(old ? "Cliente atualizado" : "Cliente cadastrado"); break;
    }
    case "inativarCli": { const c = Cl(s.id); if (await commit([Store.put("cli", c.id, Object.assign({}, c, { ativo: false })), logMov("cadastro", `Cliente desativado · ${c.nome}`, { ref: c.id })])) { closeSheet(); goTab("mais"); go("clientes"); toast("Cliente desativado"); } break; }
    case "saveForn": {
      const v = s.vals; if (!String(v.nome || "").trim()) { s.err = "Informe o nome do fornecedor."; renderSheet(); break; }
      const old = s.id ? Fo(s.id) : null, fid = s.id || rid();
      const doc = { nome: v.nome.trim(), doc: docNorm(v.doc), contato: v.contato || "", fone: v.fone || "", email: v.email || "", prazo: parseInt(v.prazo, 10) || 30, obs: v.obs || "" };
      if (!(await commit([Store.put("forn", fid, doc), logMov("cadastro", `${old ? "Fornecedor editado" : "Novo fornecedor"} · ${doc.nome}`, { ref: fid })]))) break;
      if (s.back && s.back.k === "pickForn" && ui.cdraft) { ui.cdraft.forn = fid; closeSheet(); render(); } else closeSheet();
      toast(old ? "Fornecedor atualizado" : "Fornecedor cadastrado"); break;
    }
    case "saveEmp": {
      const v = s.vals; if (!String(v.nome || "").trim()) break;
      const pais = PAISES[v.pais] ? v.pais : "BR", docE = docNorm(v.cnpj, pais);
      if (pais === "MX" && docE && !rfcValido(docE)) { s.err = "RFC inválido. Use 12 caracteres para empresa (ex.: ABC010203XY1) ou 13 para pessoa física."; renderSheet(); break; }
      const mudouPais = pais !== paisEmp();
      if (await commit([Store.putEmp(Object.assign({}, S.emp, { nome: v.nome.trim(), cnpj: docE, cidade: v.cidade || "", fone: v.fone || "", pais, ivaSomar: v.ivaSomar !== "incluido" })), logMov("equipe", mudouPais ? `Dados da empresa atualizados · país: ${PAISES[pais].l}` : "Dados da empresa atualizados")])) {
        if (PROFILE && MODE === "cloud") { PROFILE.empresas = PROFILE.empresas.map(x => x.eid === EID ? { eid: EID, nome: v.nome.trim() } : x); saveProfile(); }
        closeSheet(); toast("Dados salvos");
      }
      break;
    }
    /* compras */
    case "novaCompra": closeSheet(); ui.cdraft = { forn: id || null, itens: [], prev: 7, cond: "30", obs: "", jaRecebido: false }; go("novaCompra"); break;
    case "setForn": ui.cdraft.forn = id; closeSheet(); render(); break;
    case "addItemCompra": { const p = P(id); if (!ui.cdraft.itens.some(i => i.p === id)) ui.cdraft.itens.push({ p: id, q: 6, custo: money(p.custo) }); if (!ui.cdraft.forn && p.forn) ui.cdraft.forn = p.forn; closeSheet(); render(); break; }
    case "rmItemCompra": ui.cdraft.itens.splice(Number(id), 1); render(); break;
    case "kcond": ui.cdraft.cond = id; render(); break;
    case "kprev": ui.cdraft.prev = Number(id); render(); break;
    case "kreceb": ui.cdraft.jaRecebido = t.checked; $("kfoot").innerHTML = cdraftFoot(); break;
    case "salvarCompra": salvarCompra(); break;
    case "sugCompra": { const ps = sugestoes()[id] || []; ui.cdraft = { forn: id, itens: ps.map(p => ({ p: p.id, q: Math.max(6, Math.ceil(Math.max(1, (p.min || 6) * 2 - p.estoque) / 6) * 6), custo: money(p.custo) })), prev: 7, cond: "30", obs: "Reposição de estoque", jaRecebido: false }; go("novaCompra"); break; }
    case "doReceberCompra": {
      const c = Co(s.id), total = compCalc(c).total, nc = Object.assign({}, c, { status: "recebido", recebidoEm: today, parc: makeParcelas(total, c.cond, today), recebidoPor: UID });
      if (await commit([Store.put("comp", c.id, nc), ...receiveWrites(nc, c.id)])) { closeSheet(); toast("Mercadoria recebida e estoque atualizado"); }
      break;
    }
    case "cancelCompra": { const c = Co(id); if (await commit([Store.put("comp", c.id, Object.assign({}, c, { status: "cancelado" })), logMov("compra", `Compra #${c.num} cancelada`, { ref: c.id })])) toast("Compra cancelada"); break; }
    /* financeiro */
    case "finPago": s.pago = t.checked; renderSheet(); break;
    case "saveFin": {
      const v = s.vals, val = r2(parseMoney(v.valor));
      if (!String(v.desc || "").trim() || !(val > 0) || !v.venc) { s.err = "Preencha descrição, valor e vencimento."; renderSheet(); break; }
      const fid = rid(), doc = { tipo: s.id === "receber" ? "receber" : "pagar", desc: v.desc.trim(), cat: v.cat, valor: val, venc: v.venc, data: today, pag: s.pago ? [{ data: isoT(new Date()), valor: val, forma: s.forma, por: UID }] : [] };
      if (await commit([Store.put("fin", fid, doc), logMov("fin", `${doc.tipo === "pagar" ? "Nova despesa" : "Nova receita"} · ${doc.desc} · ${fmt(val)}${s.pago ? " · já " + (doc.tipo === "pagar" ? "paga" : "recebida") : ""}`, { ref: fid })])) { closeSheet(); toast("Lançamento salvo"); }
      break;
    }
    case "delFin": { const f = Fi(id); if (await commit([Store.del("fin", id), logMov("fin", `Lançamento excluído · ${f.desc} · ${fmt(f.valor)}`)])) { closeSheet(); toast("Lançamento excluído"); } break; }
    /* equipe */
    case "saveMembro": {
      const m = Mb(s.id), v = s.vals, admins = S.mem.filter(x => x.papel === "admin");
      if (m.papel === "admin" && v.papel !== "admin" && admins.length <= 1) { s.err = "A empresa precisa de pelo menos um administrador."; renderSheet(); break; }
      const com = Math.min(100, Math.max(0, parseMoney(v.comissao) || 0));
      if (await commit([Store.putMem(m.id, Object.assign({}, m, { papel: v.papel, comissao: com })), logMov("equipe", `${m.nome}: papel ${PAPEIS[v.papel]}, comissão ${com}%`)])) { closeSheet(); toast("Permissões atualizadas"); }
      break;
    }
    case "rmMembro": { const m = Mb(s.id); if (m.papel === "admin" && S.mem.filter(x => x.papel === "admin").length <= 1) { s.err = "Não é possível remover o único administrador."; renderSheet(); break; } if (await commit([Store.delMem(m.id), logMov("equipe", `${m.nome} foi removido da empresa`)])) { closeSheet(); toast("Membro removido"); } break; }
    case "doCriarMembro": {
      const v = s.vals, nome = String(v.nome || "").trim(), email = String(v.email || "").trim().toLowerCase(), senha = String(v.senha || "");
      if (!nome) { s.err = "Informe o nome da pessoa."; renderSheet(); break; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { s.err = "Informe um e-mail válido."; renderSheet(); break; }
      if (senha.length < 8) { s.err = "A senha temporária precisa ter pelo menos 8 caracteres."; renderSheet(); break; }
      if (MODE !== "supa" && MODE !== "demo") { s.err = "Disponível no app Android."; renderSheet(); break; }
      s.busy = true; s.err = ""; renderSheet();
      try {
        let r;
        if (MODE === "supa") r = await SupaBE.fn({ acao: "criar_membro", nome, email, senha, papel: v.papel });
        else { r = { id: "demo-" + rid(), nome, papel: v.papel, entrou: isoT(new Date()) }; await commit([Store.putMem(r.id, { nome, papel: v.papel, comissao: 0, entrou: r.entrou }), logMov("equipe", `${nome} (${email}) foi adicionado à empresa · ${PAPEIS[v.papel]}`)]); }
        upsertLocal("mem", r.id, { nome: r.nome || nome, papel: r.papel || v.papel, comissao: 0, entrou: r.entrou || isoT(new Date()) });
        s.busy = false; s.feito = { nome, email, senha, papel: v.papel }; s.vals = {}; renderSheet(); render();
      } catch (er) {
        s.busy = false;
        s.err = er.codigo === "email_existente" ? "Este e-mail já tem conta no Saus360. Envie o código da empresa para a pessoa entrar com a conta dela."
          : er.codigo === "limite" ? `O plano da empresa permite até ${(er.dados && er.dados.max) || ""} usuários.`
          : er.codigo === "plano_inativo" ? "O plano da empresa está inativo."
          : er.codigo === "sem_permissao" ? "Somente administradores podem adicionar pessoas."
          : er.codigo === "senha" ? "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números."
          : er.codigo === "email" ? "Informe um e-mail válido." : (er.message || "Não foi possível criar o acesso agora. Tente de novo.");
        renderSheet();
      }
      break;
    }
    case "copyAcesso": try { await navigator.clipboard.writeText(textoAcesso(s.feito)); toast("Dados copiados"); } catch (er) { toast("Não foi possível copiar neste aparelho"); } break;
    case "waAcesso": Platform.openUrl("https://wa.me/?text=" + encodeURIComponent(textoAcesso(s.feito))); break;
    case "doTrocarSenha": {
      const v = s.vals, nova = String(v.nova || "");
      if (nova.length < 8) { s.err = "A nova senha precisa ter pelo menos 8 caracteres."; renderSheet(); break; }
      if (nova !== String(v.conf || "")) { s.err = "As duas senhas não são iguais."; renderSheet(); break; }
      s.busy = true; s.err = ""; renderSheet();
      try { const { error } = await SB.auth.updateUser({ password: nova }); if (error) throw error; closeSheet(); toast("Senha alterada"); }
      catch (er) { s.busy = false; s.err = /reauth|recent/i.test(String(er && er.message)) ? "Por segurança, saia e entre de novo na conta antes de trocar a senha." : /same|different/i.test(String(er && er.message)) ? "A nova senha precisa ser diferente da atual." : "Não foi possível trocar a senha agora. Tente de novo."; renderSheet(); }
      break;
    }
    case "copyCode": try { await navigator.clipboard.writeText(S.emp.codigo); toast("Código copiado"); } catch (er) { toast("Código: " + S.emp.codigo); } break;
    /* entrada e empresa */
    case "doCriarEmp": {
      const v = s.vals; if (!String(v.nome || "").trim() || !String(v.seuNome || "").trim()) { s.err = "Informe o nome da empresa e o seu nome."; renderSheet(); break; }
      const pais = PAISES[v.pais] ? v.pais : "BR", docE = docNorm(v.cnpj, pais);
      if (pais === "MX" && docE && !rfcValido(docE)) { s.err = "RFC inválido. Use 12 caracteres para empresa (ex.: ABC010203XY1) ou 13 para pessoa física."; renderSheet(); break; }
      s.busy = true; s.err = ""; renderSheet();
      try { await createCompany({ nome: v.nome.trim(), rubro: v.rubro, pais, ivaSomar: v.ivaSomar !== "incluido", cnpj: docE, cidade: v.cidade, seuNome: v.seuNome.trim() }); toast("Empresa criada. Bem-vindo!"); }
      catch (er) { s.busy = false; s.err = er && er.code === "invalid_argument" ? "Você não tem permissão para criar dados neste app. Peça para ser convidado como Editor." : "Não foi possível criar agora. Tente de novo."; if (ui.sheet === s) renderSheet(); }
      break;
    }
    case "doEntrarEmp": {
      const v = s.vals, code = String(v.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 4 || !String(v.seuNome || "").trim()) { s.err = "Informe o código e o seu nome."; renderSheet(); break; }
      s.busy = true; s.err = ""; renderSheet();
      try { const err = await joinCompany(code, v.seuNome.trim()); if (err) { s.busy = false; s.err = err; renderSheet(); } else toast("Você entrou na empresa"); }
      catch (er) { s.busy = false; s.err = er && er.code === "invalid_argument" ? "Você não tem permissão para salvar neste app. Peça para ser convidado como Editor." : "Não foi possível entrar agora. Tente de novo."; if (ui.sheet === s) renderSheet(); }
      break;
    }
    /* exportação */
    case "exportProd": saveFile(`produtos-${today}.csv`, csv([["nome", "tipo", "uva", "pais", "regiao", "safra", "volume", "produtor", "codigo", "custo", "preco_varejo", "preco_atacado", "preco_restaurante", "preco_consignado", "estoque", "minimo", "localizacao"], ...S.prod.map(p => [p.nome, p.tipo, p.uva, p.pais, p.regiao, p.safra, p.vol, p.produtor, p.ean, can("custo") ? money(p.custo) : "", money(preco(p, "varejo")), money(preco(p, "atacado")), money(preco(p, "restaurante")), p.precos && p.precos.consig ? money(p.precos.consig) : "", p.estoque, p.min, p.loc])])); break;
    case "exportRel": { const R = relTable(relData()); saveFile(`relatorio-${ui.relTab}-${today}.csv`, csv([R.head, ...R.rows.map(r => r.map(x => typeof x === "number" && !Number.isInteger(x) ? money(x) : x))])); break; }
    case "backup": saveFile(`backup-${norm(S.emp ? S.emp.nome : "decanta").replace(/\s+/g, "-")}-${today}.json`, JSON.stringify({ app: APP, exportadoEm: isoT(new Date()), empresa: S.emp, produtos: S.prod, clientes: S.cli, fornecedores: S.forn, pedidos: S.ped, compras: S.comp, financeiro: S.fin, equipe: S.mem, atividade: S.mov }, null, 2)); break;
    case "modeloCSV": { const m = impModelo(ui.impTipo); saveFile(`modelo-${ui.impTipo === "prod" ? "produtos" : "clientes"}.csv`, "﻿" + m.cols.join(";") + "\n" + m.ex + "\n"); break; }
    case "importar": importar(); break;
    default: if (typeof FOOD_A !== "undefined" && FOOD_A[a]) await FOOD_A[a](t, id, s);
  }
}));
document.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (t.id === "vq") { ui.vq = t.value; const el = $("vlist"); if (el) { const tmp = document.createElement("div"); tmp.innerHTML = vVendas(); el.innerHTML = tmp.querySelector("#vlist").innerHTML; } return; }
  if (t.id === "eq") { ui.q = t.value; $("elist").innerHTML = prodList(); return; }
  if (t.id === "cq") { ui.cq = t.value; const tmp = document.createElement("div"); tmp.innerHTML = vClientes(); $("clist").innerHTML = tmp.querySelector("#clist").innerHTML; return; }
  if (t.id === "dq") { ui.draft.q = t.value; $("dlist").innerHTML = draftList(); return; }
  if (t.id === "impTxt") { ui.impTxt = t.value; return; }
  if (d.d && ui.draft) { ui.draft[d.d] = t.value; if (d.d === "desc") { $("dfoot").innerHTML = draftFoot(); $("dcredit").innerHTML = draftCredit(); } return; }
  if (d.ci != null && ui.cdraft) { ui.cdraft.itens[Number(d.ci)][d.cf] = t.value; $("kfoot").innerHTML = cdraftFoot(); return; }
  if (d.kd && ui.cdraft) { ui.cdraft[d.kd] = t.value; return; }
  if (d.l && ui.login) { ui.login[d.l] = t.value; return; }
  if (d.fc && ui.fc) { ui.fc[d.fc] = t.value; return; }
  if (d.xf != null && ui.xml) { ui.xml.itens[Number(d.xf)].fator = t.value; return; }
  if (d.inv) { if (t.value === "") delete ui.inv[d.inv]; else ui.inv[d.inv] = t.value; invGuardar(); invAtualiza(d.inv); return; }
  if (t.id === "invQ") { ui.invQ = t.value; const tmp = document.createElement("div"); tmp.innerHTML = vInventario(); const el = $("invlist"); if (el) el.innerHTML = tmp.querySelector("#invlist").innerHTML; return; }
  if (!ui.sheet) return;
  if (d.f) { ui.sheet.vals[d.f] = t.value; return; }
  if (d.sq) { ui.sheet.q = t.value; const tmp = document.createElement("div"); tmp.innerHTML = SH[ui.sheet.k](ui.sheet)[1]; $("sl").innerHTML = tmp.querySelector("#sl").innerHTML; return; }
  if (d.sh) { const v = parseInt(t.value, 10); ui.sheet.qty = isNaN(v) ? 0 : v; const el = $("shd"); if (el && SHD[ui.sheet.k]) el.innerHTML = SHD[ui.sheet.k](ui.sheet); }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "actU") { ui.actU = t.value; render(); return; }
  if (t.id === "movP") { ui.movP = t.value; render(); return; }
  if (t.id === "impTxt") { render(); return; }
  if (t.id === "impFile" && t.files && t.files[0]) {
    // Excel no Windows costuma salvar CSV em ANSI (Windows-1252): tenta UTF-8 e cai para ele
    const r = new FileReader();
    r.onload = () => { const b = new Uint8Array(r.result); let txt; try { txt = new TextDecoder("utf-8", { fatal: true }).decode(b); } catch (er) { txt = new TextDecoder("windows-1252").decode(b); } ui.impTxt = txt; render(); };
    r.readAsArrayBuffer(t.files[0]); t.value = ""; return;
  }
  if (t.dataset.f && ui.sheet) ui.sheet.vals[t.dataset.f] = t.value;
  if (t.dataset.f === "pais" && ui.sheet && (ui.sheet.k === "criarEmp" || ui.sheet.k === "empForm")) { ui.sheet.err = ""; renderSheet(); }
  if (t.dataset.f === "tipo" && ui.sheet && ui.sheet.k === "prodForm") {
    const v = ui.sheet.vals, c = v.tipo !== "__nova" ? catDe(v.tipo) : null, l = cats(true);
    if (c && !ui.sheet.id) { // produto novo: troca os padrões se o usuário não tinha mudado
      if (!v.ncm || l.some(x => x.ncm && digits(x.ncm) === digits(v.ncm))) v.ncm = c.ncm || "";
      if (v.min === "" || v.min == null || l.some(x => String(x.min || 0) === String(v.min))) v.min = c.min || 0;
    }
    renderSheet();
  }
  if (t.dataset.fc && ui.fc) ui.fc[t.dataset.fc] = t.value;
  if (t.dataset.xf != null && ui.xml) { ui.xml.itens[Number(t.dataset.xf)].fator = t.value; renderSheet(); }
  if (t.id === "xmlFile" && t.files && t.files[0]) { const r = new FileReader(); r.onload = () => xmlCarregado(String(r.result || "")); r.readAsText(t.files[0]); t.value = ""; }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && ui.sheet) closeSheet(); });

/* ---- fiscal.js ---- */
/* ================= Nota fiscal ================= */
function nfRow(n) {
  return `<button class="row nfrow" data-a="sheet" data-k="nfDet" data-id="${n.id}"><span class="dot ${n.status === "autorizado" ? "good" : n.status === "processando" ? "info" : n.status === "cancelado" ? "acc" : "bad"}">${n.modelo === "65" ? "65" : "55"}</span>
    <span class="wmain"><b>${NF_TIPOS[n.tipo] || "Nota fiscal"}${n.numero ? ` nº ${esc(n.numero)}` : ""}</b><small>${fdy(n.emitida_em)} · ${fmt(n.valor)}${n.ambiente === "homologacao" ? " · homologação" : n.ambiente === "simulacao" ? " · simulação" : ""}</small></span><span class="right">${nfStatusPill(n)}</span></button>`;
}
function nfItens(o, tipo) {
  const out = [];
  if (tipo === "nfe_venda" || tipo === "nfce" || tipo === "nfe_remessa") o.itens.forEach((i, ix) => out.push({ ix, p: i.p, q: i.q, preco: i.preco }));
  if (tipo === "nfe_venda_consig") { const ja = qtdNotada(o.id, tipo); o.itens.forEach((i, ix) => { const q = (i.vend || 0) - (ja[ix] || 0); if (q > 0) out.push({ ix, p: i.p, q, preco: i.preco }); }); }
  if (tipo === "nfe_retorno") { const ja = qtdNotada(o.id, tipo); o.itens.forEach((i, ix) => { const q = (i.dev || 0) - (ja[ix] || 0); if (q > 0) out.push({ ix, p: i.p, q, preco: i.preco }); }); }
  return out;
}
function nfAcoes(o) {
  const out = [], nfs = nfsPedido(o.id);
  if (o.tipo === "venda") {
    if (!nfs.some(n => nfAtiva(n) && (n.tipo === "nfe_venda" || n.tipo === "nfce"))) {
      const cl = Cl(o.cli), pj = cl && digits(cl.doc).length === 14;
      if (!cl) out.push({ tipo: "nfce", l: "Emitir NFC-e" });
      else if (pj) out.push({ tipo: "nfe_venda", l: "Emitir NF-e" });
      else { out.push({ tipo: "nfce", l: "Emitir NFC-e" }); out.push({ tipo: "nfe_venda", l: "Emitir NF-e", ghost: true }); }
    }
  }
  if (o.tipo === "consig") {
    if (!nfs.some(n => n.tipo === "nfe_remessa" && nfAtiva(n))) out.push({ tipo: "nfe_remessa", l: "NF de remessa" });
    else {
      if (nfItens(o, "nfe_venda_consig").length) out.push({ tipo: "nfe_venda_consig", l: "NF dos vendidos" });
      if (nfItens(o, "nfe_retorno").length) out.push({ tipo: "nfe_retorno", l: "NF de retorno", ghost: true });
    }
  }
  return out;
}
function nfSection(o) {
  if (o.tipo === "orcamento" || !temFiscal()) return ""; // NF-e/NFC-e só para empresas do Brasil
  const nfs = nfsPedido(o.id), acts = can("fiscal") && o.status !== "cancelado" ? nfAcoes(o) : [];
  if (!nfs.length && !acts.length) return "";
  let h = `<p class="sec">Notas fiscais${nfs.length ? ` <span class="count">${nfs.length}</span>` : ""}</p>`;
  if (nfs.length) h += `<div class="list">${nfs.map(nfRow).join("")}</div>`;
  if (acts.length) h += `<div class="btns">${acts.map(a => `<button class="btn ${a.ghost ? "ghost" : ""}" data-a="sheet" data-k="emitirNF" data-id="${o.id}" data-t="${a.tipo}">${ico("receipt", 18)}${a.l}</button>`).join("")}</div>`;
  return h;
}
function nfProblemas(o, tipo, itens) {
  const f = fiscalCfg(), e = S.emp || {}, out = [];
  const falta = (obj, ks) => ks.filter(([k]) => !String(obj[k] || "").trim()).map(([, l]) => l);
  const fe = falta(Object.assign({ cnpj: e.cnpj }, f), [["razao", "razão social"], ["cnpj", "CNPJ"], ["logradouro", "endereço"], ["numero", "número"], ["bairro", "bairro"], ["municipio", "município"], ["uf", "UF"], ["cep", "CEP"]]);
  if (tipo !== "nfce" && !String(f.ie || "").trim()) fe.push("inscrição estadual");
  if (fe.length) out.push({ t: `Dados da empresa incompletos: ${fe.join(", ")}.`, a: "fiscal" });
  if (tipo !== "nfce") {
    const cl = Cl(o.cli);
    if (!cl) out.push({ t: "NF-e precisa de um cliente cadastrado." });
    else { const fc = falta(cl, [["doc", "CNPJ ou CPF"], ["logradouro", "rua"], ["numero", "número"], ["bairro", "bairro"], ["cidade", "município"], ["uf", "UF"], ["cep", "CEP"]]); if (fc.length) out.push({ t: `Cliente sem ${fc.join(", ")}.`, a: "cli", id: cl.id }); if (cl.indIE === "1" && !cl.ie) out.push({ t: "Cliente contribuinte sem inscrição estadual.", a: "cli", id: cl.id }); }
  }
  const semNcm = itens.map(i => P(i.p)).filter(p => p && digits(p.ncm).length !== 8);
  if (semNcm.length) out.push({ t: `Produto sem NCM: ${semNcm.map(p => p.nome).join(", ")}.`, a: "prod", id: semNcm[0].id });
  if (tipo === "nfe_venda_consig" || tipo === "nfe_retorno") { if (!nfsPedido(o.id).some(n => n.tipo === "nfe_remessa" && n.status === "autorizado")) out.push({ t: "A NF de remessa ainda não foi autorizada." }); }
  if (!itens.length) out.push({ t: "Não há itens pendentes para esta nota." });
  return out;
}
SH.emitirNF = s => {
  const o = Pe(s.id), tipo = s.t, itens = nfItens(o, tipo), probs = nfProblemas(o, tipo, itens), f = fiscalCfg();
  const ufDest = tipo === "nfce" ? f.uf : ((Cl(o.cli) || {}).uf || f.uf), inter = ufDest && f.uf && ufDest !== f.uf;
  const cfop = { nfe_venda: null, nfce: null, nfe_remessa: cfopDe("remessa", inter), nfe_venda_consig: cfopDe("vendaConsig", inter), nfe_retorno: cfopDe("retorno", inter) }[tipo];
  const total = sum(itens, i => i.q * i.preco) - (tipo === "nfe_venda" || tipo === "nfce" ? pedCalc(o).desc : 0);
  const amb = MODE === "demo" ? "Simulação (demonstração)" : ui.fiscalStatus && ui.fiscalStatus.ambiente === "producao" ? "Produção" : "Homologação (teste, sem valor fiscal)";
  return [NF_TIPOS[tipo], `
    <div class="card"><div class="kv"><span>Pedido</span><b>#${o.num} · ${esc(cliNome(o))}</b></div><div class="kv"><span>Itens</span><b>${sum(itens, i => i.q)} un. em ${itens.length} ${itens.length === 1 ? "produto" : "produtos"}</b></div>
    <div class="kv"><span>Valor da nota</span><b>${fmt(total)}</b></div><div class="kv"><span>CFOP</span><b>${cfop || (inter ? "venda interestadual" : "venda no estado") + " (por produto)"}</b></div><div class="kv"><span>Ambiente</span><b>${amb}</b></div></div>
    <div class="list">${itens.map(i => { const p = P(i.p) || { nome: "Produto", tipo: "outros" }; return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>NCM ${esc(p.ncm || "—")} · ${i.q} × ${fmt(i.preco)}</small></span></div>`; }).join("")}</div>
    ${probs.map(p => `<div class="note bad">${esc(p.t)}${p.a ? ` <button class="btn sm ghost" style="margin-left:6px" data-a="fixNF" data-t="${p.a}" data-id="${p.id || ""}">Corrigir</button>` : ""}</div>`).join("")}
    ${MODE === "cloud" ? `<div class="note warn">A emissão real funciona no app Android, com o servidor configurado. Aqui no piloto não é possível emitir.</div>` : ""}
    <button class="btn block" data-a="doEmitirNF" ${probs.length || MODE === "cloud" || s.busy ? "disabled" : ""}>${s.busy ? "Enviando para a SEFAZ…" : "Emitir nota"}</button>
    <p class="hint">Confira os dados com o contador antes da primeira emissão em produção.</p>`];
};
SH.nfDet = s => {
  const n = Nf(s.id); if (!n) return ["Nota fiscal", empty("Não encontrada.", "")];
  const o = Pe(n.pedido), canCancel = n.status === "autorizado" && can("cancelar") && n.emitida_em && (Date.now() - new Date(n.emitida_em).getTime()) < 24 * 3600 * 1000;
  return [NF_TIPOS[n.tipo] || "Nota fiscal", `
    <div class="card"><div class="kv"><span>Situação</span><b>${nfStatusPill(n)}</b></div>${n.numero ? `<div class="kv"><span>Número / série</span><b>${esc(n.numero)} / ${esc(n.serie || "1")}</b></div>` : ""}
    <div class="kv"><span>Pedido</span><b>${o ? "#" + o.num + " · " + esc(cliNome(o)) : "—"}</b></div><div class="kv"><span>Valor</span><b>${fmt(n.valor)}</b></div><div class="kv"><span>Emitida em</span><b>${fdy(n.emitida_em)} ${String(n.emitida_em || "").slice(11, 16)}</b></div>
    <div class="kv"><span>Ambiente</span><b>${n.ambiente === "producao" ? "Produção" : n.ambiente === "simulacao" ? "Simulação" : "Homologação"}</b></div>${n.chave ? `<div class="kv" style="flex-direction:column;align-items:flex-start"><span>Chave de acesso</span><b style="font-family:ui-monospace,monospace;font-size:12px;text-align:left;overflow-wrap:anywhere">${esc(n.chave)}</b></div>` : ""}</div>
    ${n.mensagem ? `<div class="note ${n.status === "autorizado" ? "good" : n.status === "processando" ? "info" : "bad"}">${esc(n.mensagem)}</div>` : ""}
    <div class="btns">${n.danfe_url ? `<button class="btn ghost" data-a="abrirUrl" data-u="${esc(n.danfe_url)}">${ico("file", 18)}DANFE (PDF)</button>` : ""}${n.xml_url ? `<button class="btn ghost" data-a="abrirUrl" data-u="${esc(n.xml_url)}">${ico("download", 18)}XML</button>` : ""}</div>
    ${n.status === "processando" || n.status === "erro" ? `<button class="btn line block" data-a="consultarNF" data-id="${n.id}">Atualizar situação</button>` : ""}
    ${n.status === "erro" && o ? `<button class="btn block" data-a="sheet" data-k="emitirNF" data-id="${o.id}" data-t="${n.tipo}">Corrigir e emitir de novo</button>` : ""}
    ${canCancel ? `<button class="btn danger block" data-a="sheet" data-k="cancelNF" data-id="${n.id}">Cancelar nota</button><p class="hint">O cancelamento é aceito pela SEFAZ até 24 horas depois da autorização.</p>` : ""}`];
};
SH.cancelNF = s => ["Cancelar nota fiscal", `<p>Informe o motivo. A SEFAZ exige no mínimo 15 caracteres.</p><label class="field">Justificativa<textarea data-f="just" placeholder="Ex: pedido cancelado pelo cliente antes da entrega">${esc(s.vals.just || "")}</textarea></label>${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn danger block" data-a="doCancelNF" ${s.busy ? "disabled" : ""}>${s.busy ? "Cancelando…" : "Confirmar cancelamento"}</button>`];
SH.codigoManual = s => ["Digite o código", `<p class="hint" style="margin:0">A câmera não está disponível aqui. Digite o código de barras ou use um leitor USB/Bluetooth.</p><label class="field">Código<input data-f="cod" inputmode="numeric" autocomplete="off" value="${esc(s.vals.cod || "")}"></label><button class="btn block" data-a="codigoOk">Confirmar</button>`];
SH.scanNovo = s => ["Código não cadastrado", `<p>Nenhum produto tem o código <b>${esc(s.code)}</b>.</p>${can("ajuste") ? `<button class="btn block" data-a="cadastrarCodigo" data-id="${esc(s.code)}">Cadastrar produto com este código</button>` : ""}${can("ajuste") ? `<button class="btn line block" data-a="vincularCodigo" data-id="${esc(s.code)}">Vincular a um produto existente</button>` : ""}`];
SH.vincular = s => ["Vincular código " + s.code, pickList(s, S.prod.filter(p => p.ativo !== false && !p.ean), p => `<button class="row" data-a="doVincular" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>sem código cadastrado</small></span>${ico("chev", 18)}</button>`, p => p.nome)];
SH.excluirConta = s => ["Excluir minha conta", `<p>Sua conta e seu acesso a todas as empresas serão apagados. Os dados das empresas continuam com os outros membros.</p><p>Se você for o único administrador de uma empresa, defina outro administrador antes.</p><label class="field">Digite EXCLUIR para confirmar<input data-f="conf" autocomplete="off" value="${esc(s.vals.conf || "")}"></label>${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn danger block" data-a="doExcluirConta" ${s.busy ? "disabled" : ""}>Excluir definitivamente</button>`];

async function emitirNF(s) {
  const o = Pe(s.id), tipo = s.t, itens = nfItens(o, tipo);
  if (nfProblemas(o, tipo, itens).length) return;
  s.busy = true; renderSheet();
  try {
    if (MODE === "demo") {
      const id = "nf" + rid(), total = r2(sum(itens, i => i.q * i.preco) - (tipo === "nfe_venda" || tipo === "nfce" ? pedCalc(o).desc : 0));
      const n = { pedido: o.id, cli: o.cli, tipo, modelo: tipo === "nfce" ? "65" : "55", itens: itens.map(i => ({ ix: i.ix, p: i.p, q: i.q })), valor: total, status: "processando", ambiente: "simulacao", emitida_em: isoT(new Date()), por: UID, mensagem: "Enviando para a SEFAZ (simulação)" };
      await Store.put("nf", id, n);
      setTimeout(() => { const cur = Nf(id); if (!cur) return; Store.put("nf", id, Object.assign({}, cur, { status: "autorizado", numero: String(1000 + S.nf.length), serie: "1", chave: ("42" + today.slice(2, 4) + today.slice(5, 7) + "00000000000100" + (tipo === "nfce" ? "65" : "55") + "001" + String(Date.now()).slice(-9) + "1" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0") + "0").slice(0, 44).padEnd(44, "0"), mensagem: "Simulação: em produção esta nota seria enviada à SEFAZ." })); toast("Nota autorizada (simulação)"); }, 1500);
      logMov("fiscal", `${NF_TIPOS[tipo]} (simulação) · pedido #${o.num} · ${fmt(total)}`, { ref: o.id });
      closeSheet(); openSheet({ k: "nfDet", id }, true); return;
    }
    const r = await SupaBE.fn({ acao: "emitir", tipo, pedido_id: o.id, itens: itens.map(i => ({ ix: i.ix, q: i.q })) });
    closeSheet(); if (r && r.nf) { upsertLocal("nf", r.nf.id, r.nf); openSheet({ k: "nfDet", id: r.nf.id }, true); pollNF(r.nf.id, 0); }
    toast(r && r.nf && r.nf.status === "autorizado" ? "Nota autorizada" : "Nota enviada. Aguardando a SEFAZ…");
  } catch (e) { s.busy = false; renderSheet(); toast(String(e.message || e)); }
}
async function pollNF(id, n) {
  const cur = Nf(id); if (!cur || cur.status !== "processando" || n > 12) return;
  setTimeout(async () => { try { const r = await SupaBE.fn({ acao: "consultar", nf_id: id }); if (r && r.nf) upsertLocal("nf", id, r.nf); } catch (e) {} pollNF(id, n + 1); }, n < 4 ? 2500 : 6000);
}

/* ---- Telas fiscais ---- */
function vNotas() {
  const f = ui.nfF || "todas", list = S.nf.filter(n => f === "todas" || n.status === f).slice().sort((a, b) => String(b.emitida_em || "").localeCompare(String(a.emitida_em || "")));
  let h = head("Notas fiscais", "NF-e, NFC-e e consignação", { back: ui.stack.length > 0 }) + banners();
  const aut = S.nf.filter(n => n.status === "autorizado" && String(n.emitida_em || "").slice(0, 7) === today.slice(0, 7));
  h += `<div class="stats"><div class="stat good"><span>Autorizadas no mês</span><b>${aut.length}</b><small>${fmt0(sum(aut, n => n.valor || 0))}</small></div><div class="stat ${S.nf.some(n => n.status === "erro") ? "bad" : ""}"><span>Com problema</span><b>${S.nf.filter(n => n.status === "erro" || n.status === "processando").length}</b><small>rejeitadas ou aguardando</small></div></div>`;
  h += `<div class="chips">${[["todas", "Todas"], ["autorizado", "Autorizadas"], ["processando", "Processando"], ["erro", "Rejeitadas"], ["cancelado", "Canceladas"]].map(([k, l]) => `<button class="chip" data-a="nfF" data-id="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>`;
  h += `<div class="list">${list.map(nfRow).join("") || empty("Nenhuma nota ainda.", "Emita a partir da tela de um pedido.")}</div>`;
  return h;
}
const SPEC_FISCAL = () => [
  { sec: "Emitente" }, { k: "razao", l: "Razão social" }, { k: "ie", l: "Inscrição estadual", h: 1, t: "tel" }, { k: "regime", l: "Regime tributário", h: 1, t: "select", opts: REGIMES },
  { k: "logradouro", l: "Rua / avenida" }, { k: "numero", l: "Número", h: 1 }, { k: "bairro", l: "Bairro", h: 1 }, { k: "municipio", l: "Município", h: 1 }, { k: "uf", l: "UF", t: "select", h: 1, opts: UFS.map(u => [u, u]) }, { k: "cep", l: "CEP", t: "tel", h: 1 }, { k: "foneFiscal", l: "Telefone", t: "tel", h: 1 },
  { sec: "Tributação padrão" },
  { k: "csosn", l: "CSOSN (Simples)", h: 1, t: "tel", ph: "102" }, { k: "csosnST", l: "CSOSN com ST", h: 1, t: "tel", ph: "500" },
  { k: "cst", l: "CST ICMS (normal)", h: 1, t: "tel", ph: "00" }, { k: "cstST", l: "CST com ST", h: 1, t: "tel", ph: "60" },
  { k: "pisCofins", l: "CST PIS/COFINS", h: 1, t: "tel", ph: "99" }, { k: "presenca", l: "Presença do comprador", h: 1, t: "select", opts: [["1", "Presencial"], ["9", "Não presencial"], ["4", "Entrega em domicílio"]] },
  { k: "aliqIcms", l: "Alíquota ICMS % (CST 00)", h: 1, t: "tel", ph: "17" }, { k: "aliqPis", l: "Alíquota PIS % (CST 01)", h: 1, t: "tel", ph: "0,65" }, { k: "aliqCofins", l: "Alíquota COFINS % (CST 01)", h: 1, t: "tel", ph: "3" },
  { k: "natVenda", l: "Natureza da operação (venda)" }, { k: "info", l: "Informações complementares (saem em todas as notas)", t: "textarea" },
  { sec: "CFOP (dentro do estado / fora do estado)" },
  { k: "cfop_venda_0", l: "Venda", h: 1, t: "tel" }, { k: "cfop_venda_1", l: "Venda (outra UF)", h: 1, t: "tel" },
  { k: "cfop_vendaST_0", l: "Venda com ST", h: 1, t: "tel" }, { k: "cfop_vendaST_1", l: "Venda com ST (outra UF)", h: 1, t: "tel" },
  { k: "cfop_remessa_0", l: "Remessa consignação", h: 1, t: "tel" }, { k: "cfop_remessa_1", l: "Remessa (outra UF)", h: 1, t: "tel" },
  { k: "cfop_vendaConsig_0", l: "Venda do consignado", h: 1, t: "tel" }, { k: "cfop_vendaConsig_1", l: "Venda consig. (outra UF)", h: 1, t: "tel" },
  { k: "cfop_retorno_0", l: "Retorno consignação", h: 1, t: "tel" }, { k: "cfop_retorno_1", l: "Retorno (outra UF)", h: 1, t: "tel" }
];
function fiscalBuffer() {
  const f = fiscalCfg(), b = clone(f);
  Object.keys(CFOP_DEF).forEach(k => { [0, 1].forEach(i => { b[`cfop_${k}_${i}`] = cfopDe(k, i === 1); }); });
  return b;
}
function vFiscal() {
  if (!ui.fc) ui.fc = fiscalBuffer();
  const st = ui.fiscalStatus;
  let h = head("Configuração fiscal", "Dados para NF-e e NFC-e", { back: true }) + banners();
  h += `<div class="note info">Estas são sugestões comuns para comércio de vinhos. Antes de emitir em produção, peça ao contador para conferir regime, CSOSN/CST, CFOP, NCM e a substituição tributária no seu estado.</div>`;
  h += `<div class="card" style="margin-top:12px"><span class="lbl">Conexão com a SEFAZ</span>${MODE === "supa" ? (st ? `<div class="kv"><span>Credenciais Focus NFe</span><b>${st.configurado ? '<span class="pill ok">Configuradas</span>' : '<span class="pill warn">Pendentes</span>'}</b></div><div class="kv"><span>Ambiente</span><b>${st.ambiente === "producao" ? "Produção" : "Homologação (testes)"}</b></div>` : `<p class="hint">Consultando…</p>`)
    : MODE === "demo" ? `<p class="hint" style="margin:0">Na demonstração a emissão é simulada.</p>` : `<p class="hint" style="margin:0">A emissão real funciona no app Android com o servidor configurado.</p>`}
    ${MODE === "supa" ? `<label class="field">Token da Focus NFe (fica só no servidor)<input data-fc="token" type="password" autocomplete="off" value="${esc(ui.fc.token || "")}" placeholder="${st && st.configurado ? "•••••••• (deixe vazio para manter)" : "Cole o token da empresa"}"></label>
    <span class="lbl" style="margin-top:12px">Ambiente</span><div class="seg">${[["homologacao", "Homologação"], ["producao", "Produção"]].map(([k, l]) => `<button data-a="fcAmb" data-id="${k}" aria-pressed="${(ui.fc.ambiente || (st && st.ambiente) || "homologacao") === k}">${l}</button>`).join("")}</div>
    <button class="btn ghost block" data-a="saveCred">Salvar credenciais</button>` : ""}</div>`;
  h += `<dl class="specs"><div><dt>CNPJ</dt><dd>${esc((S.emp && S.emp.cnpj) || "Cadastre em Dados da empresa")}</dd></div><div><dt>Nome fantasia</dt><dd>${esc((S.emp && S.emp.nome) || "")}</dd></div></dl>`;
  h += formHtml(SPEC_FISCAL(), ui.fc, "fc");
  h += `<button class="btn block" data-a="saveFiscal">Salvar configuração fiscal</button>`;
  const semNcm = S.prod.filter(p => p.ativo !== false && p.tipo !== "outros" && digits(p.ncm).length !== 8).length;
  const cliInc = S.cli.filter(c => c.ativo !== false && digits(c.doc).length === 14 && !(c.logradouro && c.cep && c.uf)).length;
  const f = fiscalCfg();
  const chk = [
    ["Dados do emitente completos", !!(f.razao && f.ie && f.logradouro && f.municipio && f.uf && f.cep && S.emp && S.emp.cnpj)],
    ["Produtos com NCM", !semNcm, semNcm ? `${semNcm} sem NCM` : ""],
    ["Clientes PJ com endereço fiscal", !cliInc, cliInc ? `${cliInc} incompletos` : ""],
    ["Certificado A1 e token na Focus NFe", !!(st && st.configurado)],
    ["Primeira nota testada em homologação", S.nf.some(n => n.status === "autorizado" && n.ambiente === "homologacao")]
  ];
  h += `<p class="sec">Antes de emitir</p><div class="card">${chk.map(([t, ok, d]) => `<div class="chk"><span class="wmain"><b>${t}</b>${d ? `<small>${d}</small>` : ""}</span><span class="pill ${ok ? "ok" : "warn"}">${ok ? "OK" : "Pendente"}</span></div>`).join("")}</div>`;
  return h;
}
function vConta() {
  const u = SESSION && SESSION.user;
  let h = head("Minha conta", "", { back: true });
  h += `<div class="card"><div class="kv"><span>E-mail</span><b>${esc(u ? u.email : "—")}</b></div><div class="kv"><span>Nome</span><b>${esc(u && u.user_metadata ? u.user_metadata.nome || "—" : "—")}</b></div><div class="kv"><span>Empresas</span><b>${PROFILE ? PROFILE.empresas.length : 0}</b></div></div>`;
  h += `<div class="menu" style="margin-top:12px"><button data-a="sheet" data-k="trocarSenha">${ico("shield")}<span class="wmain"><b>Trocar senha</b><small>Use uma senha só sua no lugar da temporária</small></span></button><button data-a="sair">${ico("building")}<span class="wmain"><b>Trocar de empresa</b><small>Ver suas empresas ou entrar em outra</small></span></button><button data-a="logout">${ico("logout")}<span class="wmain"><b>Sair da conta</b><small>Você pode entrar de novo quando quiser</small></span></button><button data-a="sheet" data-k="excluirConta">${ico("x")}<span class="wmain"><b style="color:var(--bad)">Excluir minha conta</b><small>Apaga seu login e seus acessos</small></span></button></div>`;
  return h;
}
function vTermos() {
  return head("Termos e privacidade", APP, { back: true }) + `<div class="note warn">Modelo inicial. Revise com um advogado antes de publicar o app.</div><div class="legal">
  <h3>1. O serviço</h3><p>O ${APP} é um aplicativo de gestão para comércio de vinhos: estoque, vendas, consignação, financeiro e emissão de documentos fiscais por meio de parceiro integrado.</p>
  <h3>2. Dados que coletamos</h3><p>Nome e e-mail de quem usa o app; dados que a empresa cadastra (produtos, clientes, fornecedores, pedidos, lançamentos); registros de uso para auditoria (quem fez cada operação e quando).</p>
  <h3>3. Para que usamos</h3><p>Exclusivamente para prestar o serviço: guardar e mostrar as informações da empresa aos membros autorizados, emitir notas fiscais quando solicitado e dar suporte. Não vendemos dados.</p>
  <h3>4. Compartilhamento</h3><p>Com provedores necessários ao funcionamento: hospedagem do banco de dados e emissor de documentos fiscais, que transmite as notas à SEFAZ. Cada empresa só acessa os próprios dados.</p>
  <h3>5. Segurança</h3><p>Acesso por login individual, separação de dados por empresa e permissões por papel. Credenciais fiscais ficam somente no servidor.</p>
  <h3>6. Seus direitos (LGPD)</h3><p>Você pode acessar, corrigir e exportar os dados da empresa pelo próprio app, e excluir sua conta em Mais → Minha conta. Documentos fiscais podem ter guarda obrigatória por lei.</p>
  <h3>7. Responsabilidades</h3><p>A empresa usuária é responsável pelas informações fiscais cadastradas (NCM, CFOP, tributação) e por validá-las com seu contador.</p>
  <h3>8. Contato</h3><p>Dúvidas sobre privacidade: informe aqui o e-mail de suporte do ${APP}.</p></div>`;
}

/* ---- Importação do XML da NF-e de compra ---- */
function parseNFeXML(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const inf = doc.getElementsByTagName("infNFe")[0];
  if (!inf) throw new Error("Este arquivo não parece ser o XML de uma NF-e.");
  const q = (el, tag) => { const x = el && el.getElementsByTagName(tag)[0]; return x ? x.textContent.trim() : ""; };
  const nm = (el, tag) => parseFloat(q(el, tag)) || 0;
  const emit = inf.getElementsByTagName("emit")[0], ide = inf.getElementsByTagName("ide")[0], tot = inf.getElementsByTagName("ICMSTot")[0];
  const itens = Array.from(inf.getElementsByTagName("det")).map(det => {
    const pr = det.getElementsByTagName("prod")[0], imp = det.getElementsByTagName("imposto")[0];
    const ean = q(pr, "cEAN"), uCom = q(pr, "uCom");
    const extra = nm(imp, "vICMSST") + nm(imp, "vIPI") + nm(pr, "vFrete") + nm(pr, "vOutro") + nm(pr, "vSeg") - nm(pr, "vDesc");
    return { cProd: q(pr, "cProd"), ean: /^\d{8,14}$/.test(ean) ? ean : "", nome: q(pr, "xProd"), ncm: q(pr, "NCM"), cest: q(pr, "CEST"), uCom, qCom: nm(pr, "qCom"), vProd: nm(pr, "vProd"), extra, fator: /^c(x|aixa)/i.test(uCom) ? "6" : "1" };
  });
  const dups = Array.from(inf.getElementsByTagName("dup")).map(d => ({ venc: q(d, "dVenc"), valor: nm(d, "vDup") })).filter(d => d.venc && d.valor);
  return { chave: (inf.getAttribute("Id") || "").replace(/^NFe/, ""), numero: q(ide, "nNF"), data: (q(ide, "dhEmi") || q(ide, "dEmi")).slice(0, 10), forn: { cnpj: q(emit, "CNPJ") || q(emit, "CPF"), nome: q(emit, "xFant") || q(emit, "xNome"), razao: q(emit, "xNome"), fone: q(emit, "fone") }, itens, total: nm(tot, "vNF"), dups };
}
function xmlMatch(it) { return (it.ean && byEan(it.ean)) || S.prod.find(p => norm(p.nome) === norm(it.nome)) || null; }
function xmlCarregado(text) {
  try {
    const x = parseNFeXML(text);
    if (x.chave && S.comp.some(c => c.chave === x.chave)) { toast("Esta nota já foi importada."); return; }
    ui.xml = x; openSheet({ k: "xmlPreview" }, true);
  } catch (e) { toast(e.message || "Não foi possível ler o XML."); }
}
SH.xmlPreview = () => {
  const x = ui.xml, fo = S.forn.find(f => digits(f.doc) === digits(x.forn.cnpj));
  return [`NF ${x.numero} · ${esc(x.forn.nome)}`, `
    <div class="card"><div class="kv"><span>Fornecedor</span><b>${esc(x.forn.nome)}${fo ? "" : ' <span class="pill info">novo</span>'}</b></div><div class="kv"><span>Emissão</span><b>${fdy(x.data)}</b></div><div class="kv"><span>Valor da nota</span><b>${fmt(x.total)}</b></div><div class="kv"><span>Parcelas</span><b>${x.dups.length ? x.dups.map(d => fd(d.venc)).join(", ") : "à vista"}</b></div></div>
    <p class="hint">Ajuste quantas garrafas vêm em cada unidade da nota (por exemplo, 6 por caixa). O custo inclui ST, IPI, frete e descontos do item.</p>
    <div class="list">${x.itens.map((it, ix) => { const p = xmlMatch(it), un = it.qCom * (Number(it.fator) || 1), cu = un ? (it.vProd + it.extra) / un : 0; return `<div class="row"><span class="wmain"><b>${esc(it.nome)}</b><small>${p ? "→ " + esc(p.nome) : '<span class="pill info">produto novo</span>'} · ${num(it.qCom)} ${esc(it.uCom)} = ${num(un)} un. · ${fmt(cu)}/un.</small></span><input style="width:64px;text-align:center;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);color:var(--ink);font:600 15px var(--body)" inputmode="numeric" data-xf="${ix}" value="${esc(it.fator)}" aria-label="Unidades por ${esc(it.uCom)}"></div>`; }).join("")}</div>
    <button class="btn block" data-a="doImportXml">Importar e dar entrada no estoque</button>`];
};
async function importarXml() {
  const x = ui.xml; let fo = S.forn.find(f => digits(f.doc) === digits(x.forn.cnpj)); const ws = [];
  if (!fo) { const fid = rid(); fo = { id: fid, nome: x.forn.nome, doc: x.forn.cnpj, contato: "", fone: x.forn.fone, email: "", prazo: 30, obs: x.forn.razao }; ws.push(Store.put("forn", fid, fo)); }
  const itens = [], novos = [];
  x.itens.forEach(it => {
    const un = Math.round(it.qCom * (Number(it.fator) || 1)), cu = un ? r2((it.vProd + it.extra) / un) : 0;
    let p = xmlMatch(it);
    if (!p) { const pid = rid(), tipo = tipoPorNcm(it.ncm); p = { id: pid, nome: it.nome, tipo, uva: "", pais: "", regiao: "", safra: "", vol: ehVinho() ? 750 : 0, produtor: "", ean: it.ean, custo: cu, precos: { varejo: r2(cu * 1.8), atacado: r2(cu * 1.5), restaurante: r2(cu * 1.6) }, estoque: 0, min: Number(catDe(tipo).min) || 0, loc: "", ativo: true, forn: fo.id, ncm: it.ncm, cest: it.cest, origem: "2", st: false, revisar: true }; novos.push(p); }
    itens.push({ p: p.id, q: un, custo: cu });
  });
  for (const p of novos) ws.push(Store.put("prod", p.id, p));
  await Promise.all(ws).catch(() => {});
  let numero; try { numero = await Store.nextNum("comp"); } catch (e) { toast("Sem conexão com o servidor."); return; }
  const id = rid(), total = r2(sum(itens, i => i.q * i.custo));
  const c = { num: numero, forn: fo.id, data: x.data || today, prev: x.data || today, status: "recebido", recebidoEm: today, cond: x.dups.length > 1 ? "30" : "0", itens, pag: [], obs: `NF ${x.numero} importada do XML`, chave: x.chave, nfNumero: x.numero, parc: x.dups.length ? x.dups.map(d => ({ venc: d.venc, valor: d.valor })) : [{ venc: today, valor: x.total || total }], criadoPor: UID };
  const ok = await commit([Store.put("comp", id, c), ...receiveWrites(c, id), logMov("compra", `XML importado · NF ${x.numero} · ${fo.nome} · ${fmt(x.total || total)}${novos.length ? ` · ${novos.length} produtos novos` : ""}`, { ref: id, ps: itens.map(i => i.p) })]);
  if (!ok) return;
  ui.xml = null; closeSheet(); ui.stack = [{ route: "compras", id: null }]; ui.route = "compra"; ui.id = id; render(); window.scrollTo(0, 0);
  toast(novos.length ? `Entrada feita. Revise preço e dados de ${novos.length} produtos novos.` : "Entrada feita e estoque atualizado");
}

/* ---- Leitura de código de barras por tela ---- */
/* Produto inativo não entra em venda nem em contagem: avisa com destaque e vibra */
function avisoInativo(p) {
  toast(`Produto bloqueado: ${p.nome} está inativo. Reative na ficha do produto para vender.`);
  try { if (navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch (e) {}
}
function onScan(code, origem) {
  code = String(code || "").trim(); if (!code || !MODE) return;
  if (ui.sheet && ui.sheet.k === "prodForm") { ui.sheet.vals.ean = code; renderSheet(); toast("Código preenchido"); return; }
  if (ui.sheet && ui.sheet.k === "codigoManual") return;
  const p = byEan(code);
  if (ui.route === "novoPedido" && ui.draft) {
    if (!p) { toast("Código " + code + " não cadastrado"); return; }
    if (p.ativo === false) { avisoInativo(p); return; }
    const max = ui.draft.tipo === "orcamento" ? 9999 : p.estoque, cur = ui.draft.qty[p.id] || 0;
    if (cur >= max) { toast("Sem estoque disponível de " + p.nome); return; }
    ui.draft.qty[p.id] = cur + 1; updateDraft(); toast(`+1 ${p.nome} (${cur + 1})`); return;
  }
  if (ui.route === "inventario") {
    if (!p) { toast("Código " + code + " não cadastrado"); return; }
    if (p.ativo === false) { avisoInativo(p); return; }
    if (ui.invModo === "individual") { openSheet(initSheet("contagem", p.id)); return; }
    invCarregar(); const cur = invContado(p.id) ? Number(ui.inv[p.id]) || 0 : 0;
    ui.inv[p.id] = String(cur + 1); invGuardar(); render();
    const el = document.querySelector(`.irow[data-row="${p.id}"]`); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 900); }
    toast(`${p.nome}: ${cur + 1} contadas`); return;
  }
  if (ui.route === "novaCompra" && ui.cdraft) {
    if (!p) { openSheet({ k: "scanNovo", code }, true); return; }
    const it = ui.cdraft.itens.find(i => i.p === p.id); if (it) it.q = String((parseInt(it.q, 10) || 0) + 1); else ui.cdraft.itens.push({ p: p.id, q: 1, custo: money(p.custo) });
    render(); toast(`+1 ${p.nome}`); return;
  }
  if (p) { closeSheet(); openSheet({ k: "prod", id: p.id }, true); return; }
  openSheet({ k: "scanNovo", code }, true);
}

/* ---- Ações desta parte ---- */
document.addEventListener("click", travarAcao(async e => {
  const t = e.target.closest("[data-a]"); if (!t || t.disabled) return;
  const a = t.dataset.a, id = t.dataset.id, s = ui.sheet;
  switch (a) {
    case "toggleTheme": setTheme(isDark() ? "light" : "dark"); break;
    case "scanStop": Scanner.stop(); break;
    case "tema": setTheme(id); break;
    case "scan": { const code = await Scanner.scan(); if (code) onScan(code, "camera"); break; }
    case "scanField": { const code = await Scanner.scan(); if (code && ui.sheet) { ui.sheet.vals[id] = code; renderSheet(); } break; }
    case "codigoOk": { const r = s.resolve, v = String(s.vals.cod || "").trim(); closeSheet(); if (r) r(v || null); break; }
    case "cadastrarCodigo": closeSheet(); { const o = initSheet("prodForm", null); o.vals.ean = id; openSheet(o, true); } break;
    case "vincularCodigo": openSheet({ k: "vincular", code: id }); break;
    case "doVincular": { const code = s.code; if (await commit([Store.patch("prod", id, { ean: code }), logMov("cadastro", `Código ${code} vinculado a ${P(id).nome}`, { ps: [id] })])) { closeSheet(); toast("Código vinculado"); } break; }
    case "abrirUrl": Platform.openUrl(t.dataset.u); break;
    case "nfF": ui.nfF = id; render(); break;
    case "doEmitirNF": emitirNF(s); break;
    case "fixNF": closeSheet(); if (t.dataset.t === "fiscal") { ui.fc = null; go("fiscal"); } else if (t.dataset.t === "cli") openSheet(initSheet("cliForm", id)); else if (t.dataset.t === "prod") openSheet(initSheet("prodForm", id)); break;
    case "consultarNF": { if (MODE !== "supa") { toast("Disponível no app Android"); break; } try { const r = await SupaBE.fn({ acao: "consultar", nf_id: id }); if (r && r.nf) upsertLocal("nf", id, r.nf); renderSheet(); toast("Situação atualizada"); } catch (er) { toast(er.message); } break; }
    case "doCancelNF": {
      const just = String(s.vals.just || "").trim(); if (just.length < 15) { s.err = "A justificativa precisa ter pelo menos 15 caracteres."; renderSheet(); break; }
      s.busy = true; s.err = ""; renderSheet();
      try {
        if (MODE === "demo") { const n = Nf(s.id); await Store.put("nf", n.id, Object.assign({}, n, { status: "cancelado", mensagem: "Cancelada (simulação): " + just })); }
        else { const r = await SupaBE.fn({ acao: "cancelar", nf_id: s.id, justificativa: just }); if (r && r.nf) upsertLocal("nf", s.id, r.nf); }
        logMov("fiscal", `Nota cancelada · ${just}`, { ref: s.id }); closeSheet(); toast("Nota cancelada");
      } catch (er) { s.busy = false; s.err = er.message; renderSheet(); }
      break;
    }
    case "fcAmb": ui.fc.ambiente = id; render(); break;
    case "saveFiscal": {
      const b = ui.fc, f = {}; ["razao", "ie", "regime", "logradouro", "numero", "bairro", "municipio", "uf", "cep", "foneFiscal", "csosn", "csosnST", "cst", "cstST", "pisCofins", "aliqIcms", "aliqPis", "aliqCofins", "presenca", "natVenda", "info"].forEach(k => { f[k] = String(b[k] == null ? "" : b[k]).trim(); });
      f.cep = digits(f.cep); f.ie = f.ie.replace(/[^0-9A-Za-z]/g, "");
      f.cfop = {}; Object.keys(CFOP_DEF).forEach(k => { f.cfop[k] = [digits(b[`cfop_${k}_0`]) || CFOP_DEF[k][0], digits(b[`cfop_${k}_1`]) || CFOP_DEF[k][1]]; });
      if (await commit([Store.putEmp(Object.assign({}, S.emp, { fiscal: f })), logMov("fiscal", "Configuração fiscal atualizada")])) { ui.fc = fiscalBuffer(); toast("Configuração fiscal salva"); }
      break;
    }
    case "saveCred": {
      if (MODE !== "supa") break;
      try { const r = await SupaBE.fn({ acao: "salvar_credenciais", token: ui.fc.token || "", ambiente: ui.fc.ambiente || (ui.fiscalStatus && ui.fiscalStatus.ambiente) || "homologacao" }); ui.fiscalStatus = r; ui.fc.token = ""; render(); toast("Credenciais salvas no servidor"); logMov("fiscal", `Credenciais fiscais atualizadas · ambiente ${r.ambiente}`); }
      catch (er) { toast(er.message); }
      break;
    }
    case "xmlCompra": { const f = $("xmlFile"); if (f) f.click(); break; }
    case "doImportXml": importarXml(); break;
    /* login */
    case "loginModo": ui.login.modo = id; ui.login.err = ""; ui.login.msg = ""; render(); break;
    case "doLogin": case "doSignup": case "doConfirm": case "reenviar": case "doRecuperar": case "doNovaSenha": loginAcao(a); break;
    case "logout": try { await SB.auth.signOut(); } catch (er) {} try { localStorage.removeItem("decanta-atual"); } catch (er) {} break;
    case "doExcluirConta": {
      const palavra = "EXCLUIR"; if (String(s.vals.conf || "").trim().toUpperCase() !== palavra) { s.err = "Digite EXCLUIR para confirmar."; renderSheet(); break; } // a palavra é traduzida junto com o aviso
      s.busy = true; renderSheet();
      try { await SupaBE.fn({ acao: "excluir_conta" }); closeSheet(); await SB.auth.signOut(); toast("Conta excluída"); }
      catch (er) { s.busy = false; s.err = er.message; renderSheet(); }
      break;
    }
  }
}));
async function loginAcao(a) {
  const L = ui.login, email = String(L.email || "").trim().toLowerCase();
  const fim = (err, msg) => { L.busy = false; L.err = err || ""; L.msg = msg || ""; render(); };
  const traduz = m => /invalid login/i.test(m) ? "E-mail ou senha incorretos." : /not confirmed/i.test(m) ? "Confirme seu e-mail antes de entrar." : /already registered|already exists/i.test(m) ? "Este e-mail já tem conta. Entre ou recupere a senha." : /expired|invalid.*otp|token/i.test(m) ? "Código inválido ou vencido. Peça um novo." : /rate|seconds/i.test(m) ? "Muitas tentativas. Aguarde um minuto." : m;
  if (!/^\S+@\S+\.\S+$/.test(email) && a !== "doConfirm" && a !== "doNovaSenha" && a !== "reenviar") { fim("Informe um e-mail válido."); return; }
  L.busy = true; L.err = ""; render();
  try {
    if (a === "doLogin") { const { data, error } = await SB.auth.signInWithPassword({ email, password: L.senha || "" }); if (error) throw error; L.senha = ""; fim(); await afterLogin(data.session); return; }
    if (a === "doSignup") {
      if (!String(L.nome || "").trim()) { fim("Informe seu nome."); return; }
      if (String(L.senha || "").length < 8) { fim("A senha precisa ter pelo menos 8 caracteres."); return; }
      const { data, error } = await SB.auth.signUp({ email, password: L.senha, options: { data: { nome: L.nome.trim() } } }); if (error) throw error;
      L.senha = ""; if (data.session) { fim(); await afterLogin(data.session); return; }
      L.modo = "confirmar"; fim("", "Conta criada. Enviamos um código para seu e-mail."); return;
    }
    if (a === "doConfirm") { const { data, error } = await SB.auth.verifyOtp({ email, token: String(L.codigo || "").trim(), type: "signup" }); if (error) throw error; fim(); await afterLogin(data.session); return; }
    if (a === "reenviar") { const { error } = await SB.auth.resend({ type: "signup", email }); if (error) throw error; fim("", "Código reenviado."); return; }
    if (a === "doRecuperar") { const { error } = await SB.auth.resetPasswordForEmail(email); if (error) throw error; L.modo = "nova"; fim("", "Enviamos um código para seu e-mail."); return; }
    if (a === "doNovaSenha") {
      if (String(L.nova || "").length < 8) { fim("A nova senha precisa ter pelo menos 8 caracteres."); return; }
      const { data, error } = await SB.auth.verifyOtp({ email, token: String(L.codigo || "").trim(), type: "recovery" }); if (error) throw error;
      const r = await SB.auth.updateUser({ password: L.nova }); if (r.error) throw r.error; L.nova = ""; fim(); await afterLogin(data.session); return;
    }
  } catch (e) { fim(traduz(String((e && e.message) || e))); }
}
/* Carrega o status das credenciais ao abrir a configuração fiscal */
const _renderFiscal = render;
render = function () {
  _renderFiscal();
  if (ui.route === "fiscal" && MODE === "supa" && !ui.fiscalStatus && !ui._fsLoading && can("empresa")) {
    ui._fsLoading = true;
    SupaBE.fn({ acao: "status_credenciais" }).then(r => { ui.fiscalStatus = r; }).catch(() => { ui.fiscalStatus = { configurado: false, ambiente: "homologacao" }; }).finally(() => { ui._fsLoading = false; scheduleRender(); });
  }
};

/* ---- catalogo.js ---- */
/* ================= Condições especiais por cliente ================= */
// Preço que vale para o cliente: preço especial do vinho > tabela com desconto do cliente > tabela.
function precoCli(p, cl, tab) {
  if (cl && cl.precos && Number(cl.precos[p.id]) > 0) return r2(Number(cl.precos[p.id]));
  const base = preco(p, tab || (cl && cl.tabela) || "varejo");
  const d = cl && Number(cl.descPct) > 0 ? Math.min(90, Number(cl.descPct)) : 0;
  return r2(base * (1 - d / 100));
}
const temEspecial = (p, cl) => !!(cl && cl.precos && Number(cl.precos[p.id]) > 0);
const temCondicoes = cl => !!(cl && (Number(cl.descPct) > 0 || Object.keys(cl.precos || {}).some(k => Number(cl.precos[k]) > 0)));
function precoDraft(p) { const d = ui.draft, cl = d && d.cli && d.cli !== "CF" ? Cl(d.cli) : null; return precoCli(p, cl, d ? d.tabela : "varejo"); }
const podeCondicoes = () => can("clientes") && can("custo");

function condicoesHtml(c) {
  const esp = Object.entries(c.precos || {}).filter(([pid, v]) => Number(v) > 0 && P(pid));
  if (!temCondicoes(c) && !podeCondicoes()) return "";
  let h = `<p class="sec">Condições especiais</p><div class="card">`;
  h += `<div class="row" style="padding:0;border:0"><span class="wmain"><b>${Number(c.descPct) > 0 ? `${dec(c.descPct)}% de desconto` : "Sem desconto geral"}</b><small>Tabela ${TABELAS[c.tabela] || "Varejo"} na venda · ${TABELAS.consig} na consignação</small></span>${podeCondicoes() ? `<button class="btn sm ghost" data-a="sheet" data-k="condCli" data-id="${c.id}">Editar</button>` : ""}</div>`;
  if (esp.length) h += `<div class="list" style="margin-top:10px">${esp.map(([pid, v]) => { const p = P(pid), base = preco(p, c.tabela || "varejo"); return `<div class="row"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>Tabela ${fmt(base)} · especial <b>${fmt(Number(v))}</b></small></span>${podeCondicoes() ? `<button class="iconbtn" data-a="peRm" data-id="${c.id}" data-x="${pid}" aria-label="Remover preço especial">×</button>` : ""}</div>`; }).join("")}</div>`;
  if (podeCondicoes()) h += `<button class="btn line block" style="margin-top:10px" data-a="sheet" data-k="precoEsp" data-id="${c.id}">+ Preço especial para um produto</button>`;
  return h + `</div>`;
}

SH.condCli = s => {
  const c = Cl(s.id);
  return ["Condições do cliente", `${prodMini({ nome: c.nome, tipo: "outros" }, "Valem para pedidos, consignações e catálogo")}
    <label class="field">Desconto geral sobre a tabela (%)<input data-f="descPct" inputmode="decimal" value="${esc(s.vals.descPct)}" placeholder="Ex: 8"></label>
    <label class="field">Tabela na venda<select data-f="tabela">${Object.entries(TABELAS).filter(([k]) => k !== "consig").map(([k, l]) => `<option value="${k}" ${s.vals.tabela === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <p class="hint">Na consignação o pedido usa a tabela ${TABELAS.consig}. Preços especiais por produto têm prioridade sobre o desconto.</p>
    ${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="saveCond">Salvar condições</button>`];
};
SH.precoEsp = s => {
  const c = Cl(s.id);
  if (!s.pid) return ["Preço especial", `<p class="hint">Escolha o produto com preço negociado para ${esc(c.nome)}.</p>` + pickList(s, S.prod.filter(p => p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome)), p => `<button class="row" data-a="pePick" data-id="${p.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}${p.safra && p.safra !== "NV" ? " " + esc(p.safra) : ""}</b><small>Tabela ${TABELAS[c.tabela] || "Varejo"} ${fmt(preco(p, c.tabela || "varejo"))}${temEspecial(p, c) ? ` · especial ${fmt(c.precos[p.id])}` : ""}</small></span>${ico("chev", 18)}</button>`, p => [p.nome, p.uva, p.ean, p.safra].join(" "))];
  const p = P(s.pid), base = preco(p, c.tabela || "varejo");
  return ["Preço especial", `${prodMini(p, `Tabela ${TABELAS[c.tabela] || "Varejo"}: ${fmt(base)}${can("custo") && p.custo ? ` · custo ${fmt(p.custo)}` : ""}`)}
    <label class="field">Preço para ${esc(c.nome)} (${SIM()})<input data-f="preco" inputmode="decimal" value="${esc(s.vals.preco)}" placeholder="${money(base)}"></label>
    <div id="shd">${peHint(s)}</div>${s.err ? `<div class="note bad">${esc(s.err)}</div>` : ""}<button class="btn block" data-a="savePe">Salvar preço especial</button>`];
};
function peHint(s) {
  const c = Cl(s.id), p = P(s.pid), v = parseMoney(s.vals.preco), base = preco(p, c.tabela || "varejo");
  if (!(v > 0)) return "";
  const dif = r2((1 - v / base) * 100), cm = can("custo") && p.custo ? r2((1 - p.custo / v) * 100) : null;
  return `<p class="hint center">${dif > 0 ? `${dec(dif)}% abaixo da tabela` : dif < 0 ? `${dec(-dif)}% acima da tabela` : "Igual à tabela"}${cm != null ? ` · margem ${dec(cm)}%` : ""}</p>${cm != null && v < p.custo ? `<div class="note bad">Abaixo do custo.</div>` : ""}`;
}

/* ================= PDF simples (sem bibliotecas) ================= */
// Larguras da Helvetica/Helvetica-Bold (WinAnsi, caracteres 32 a 255), em milésimos do corpo.
const PDF_W = {r:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],b:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]};
const WINANSI = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133, 8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138, 8249: 139, 338: 140, 381: 142, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151, 732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156, 382: 158, 376: 159 };
function Pdf() {
  const W = 595.28, H = 841.89, pages = []; let cur = null;
  const enc = s => { let o = ""; for (const ch of String(s == null ? "" : s)) { let c = ch.codePointAt(0); if (WINANSI[c]) c = WINANSI[c]; else if (c > 255 || (c < 32 && c !== 9)) c = 63; o += String.fromCharCode(c); } return o; };
  const lit = t => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const n = v => (Math.round(v * 100) / 100).toString();
  const rgb = hex => { const x = parseInt(hex.replace("#", ""), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255].map(v => (v / 255).toFixed(3)).join(" "); };
  const width = (s, size, bold) => { const t = enc(s), tb = bold ? PDF_W.b : PDF_W.r; let w = 0; for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); w += c >= 32 ? (tb[c - 32] || 556) : 0; } return w * size / 1000; };
  const fit = (s, size, bold, max) => { s = String(s || ""); if (width(s, size, bold) <= max) return s; while (s.length > 1 && width(s + "…", size, bold) > max) s = s.slice(0, -1); return s.trimEnd() + "…"; };
  const wrap = (s, size, bold, max) => { const out = []; let ln = ""; String(s || "").split(/\s+/).filter(Boolean).forEach(w => { const t = ln ? ln + " " + w : w; if (width(t, size, bold) > max && ln) { out.push(ln); ln = w; } else ln = t; }); if (ln) out.push(ln); return out; };
  return {
    W, H, width, fit, wrap,
    page() { cur = []; pages.push(cur); return pages.length; },
    goto(i) { cur = pages[i]; }, count: () => pages.length,
    text(x, y, s, size, bold, color) { cur.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color || "#221A1D")} rg ${n(x)} ${n(H - y)} Td (${lit(enc(s))}) Tj ET`); },
    textR(xr, y, s, size, bold, color) { this.text(xr - width(s, size, bold), y, s, size, bold, color); },
    rect(x, y, w, h, color) { cur.push(`${rgb(color)} rg ${n(x)} ${n(H - y - h)} ${n(w)} ${n(h)} re f`); },
    line(x1, y1, x2, y2, color, lw) { cur.push(`${rgb(color)} RG ${lw || 0.5} w ${n(x1)} ${n(H - y1)} m ${n(x2)} ${n(H - y2)} l S`); },
    circle(cx, cy, r, color) { const k = 0.5523 * r, y = H - cy; cur.push(`${rgb(color)} rg ${n(cx + r)} ${n(y)} m ${n(cx + r)} ${n(y + k)} ${n(cx + k)} ${n(y + r)} ${n(cx)} ${n(y + r)} c ${n(cx - k)} ${n(y + r)} ${n(cx - r)} ${n(y + k)} ${n(cx - r)} ${n(y)} c ${n(cx - r)} ${n(y - k)} ${n(cx - k)} ${n(y - r)} ${n(cx)} ${n(y - r)} c ${n(cx + k)} ${n(y - r)} ${n(cx + r)} ${n(y - k)} ${n(cx + r)} ${n(y)} c f`); },
    build(title) {
      const objs = [null, "<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
      pages.forEach((ops, i) => { const c = ops.join("\n"); objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`; objs[6 + i * 2] = `<< /Length ${c.length} >>\nstream\n${c}\nendstream`; });
      const info = objs.length; objs[info] = `<< /Title (${lit(enc(title))}) /Producer (${APP}) >>`;
      let out = "%PDF-1.4\n%âãÏÓ\n"; const offs = [];
      for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
      const xref = out.length;
      out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
      return out + `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    }
  };
}

/* ================= Catálogo de produtos ================= */
const dataBR = s => { const p = s.slice(0, 10).split("-"); return PC().mdy ? [p[1], p[2], p[0]].join("/") : [p[2], p[1], p[0]].join("/"); }; // dd/mm/aaaa (mm/dd/aaaa nos EUA)
function catalogItens(s) {
  const ordem = cats(true).map(c => c.id), k = p => catDe(p.tipo).id;
  return S.prod.filter(p => p.ativo !== false && (s.semEstoque || p.estoque > 0) && (!s.tipos.length || s.tipos.includes(k(p))))
    .sort((a, b) => ordem.indexOf(k(a)) - ordem.indexOf(k(b)) || a.nome.localeCompare(b.nome, "pt-BR", { numeric: true, sensitivity: "base" }));
}
function catalogPreco(s, p) { const cl = s.cli ? Cl(s.cli) : null; return precoCli(p, cl, s.tabela); }
function abrirCatalogo(cid) {
  const cl = cid ? Cl(cid) : null;
  openSheet({ k: "catalogo", cli: cl ? cl.id : "", tabela: cl ? cl.tabela || "varejo" : "varejo", tipos: [], qtd: false, semEstoque: false, validade: 7, obs: "" });
}
SH.catalogo = s => {
  const cls = S.cli.filter(c => c.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome)), cl = s.cli ? Cl(s.cli) : null;
  const tiposPresentes = cats(true).map(c => c.id).filter(k => S.prod.some(p => p.ativo !== false && catDe(p.tipo).id === k));
  const n = catalogItens(s).length;
  return ["Catálogo de produtos", `<p class="hint" style="margin-top:0">Monta um PDF com os produtos em estoque e os preços do cliente, pronto para enviar pelo WhatsApp.</p>
    <label class="field">Para quem<select data-ct="cli"><option value="">Sem cliente (escolher tabela)</option>${cls.map(c => `<option value="${c.id}" ${s.cli === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></label>
    ${cl && temCondicoes(cl) ? `<div class="note info">As condições especiais de ${esc(cl.nome)} já entram nos preços.</div>` : ""}
    <span class="lbl" style="margin-top:12px">Tabela de preço</span><div class="chips wrap tight">${Object.entries(TABELAS).map(([k, l]) => `<button class="chip" data-a="ctTab" data-id="${k}" aria-pressed="${s.tabela === k}">${l}</button>`).join("")}</div>
    <span class="lbl" style="margin-top:12px">Categorias</span><div class="chips wrap tight"><button class="chip" data-a="ctTipo" data-id="" aria-pressed="${!s.tipos.length}">Todos</button>${tiposPresentes.map(k => `<button class="chip" data-a="ctTipo" data-id="${k}" aria-pressed="${s.tipos.includes(k)}"><i style="background:${esc(catDe(k).c)}"></i>${esc(catPlural(k))}</button>`).join("")}</div>
    <label class="toggle">Mostrar quantidade disponível<input type="checkbox" data-ct="qtd" ${s.qtd ? "checked" : ""}></label>
    <label class="toggle">Incluir produtos sem estoque<input type="checkbox" data-ct="semEstoque" ${s.semEstoque ? "checked" : ""}></label>
    <span class="lbl" style="margin-top:12px">Preços válidos por</span><div class="chips wrap tight">${[7, 15, 30].map(d => `<button class="chip" data-a="ctVal" data-id="${d}" aria-pressed="${Number(s.validade) === d}">${d} dias</button>`).join("")}</div>
    <label class="field">Mensagem no topo (opcional)<textarea data-ct="obs" placeholder="Ex: Novidades de outubro e condições para o seu restaurante">${esc(s.obs)}</textarea></label>
    <div class="note ${n ? "info" : "warn"}" id="ctCount">${n ? `${n} ${n === 1 ? "produto" : "produtos"} no catálogo` : "Nenhum produto com esses filtros."}</div>
    <button class="btn block" data-a="catPdf" ${n ? "" : "disabled"}>Gerar PDF e compartilhar</button>
    <button class="btn line block" style="margin-top:8px" data-a="catTxt" ${n ? "" : "disabled"}>Enviar como texto</button>`];
};
function catalogoPdf(s) {
  const cl = s.cli ? Cl(s.cli) : null, itens = catalogItens(s), pdf = Pdf(), emp = S.emp || {}, nomeEmp = emp.nome || APP;
  const M = 42, W = pdf.W, H = pdf.H, wine = "#464B71", ink = "#1F2340", muted = "#676C82", rule = "#E1E2DB", rose = "#CFE9F1", azul = "#0E7C9F";
  const validade = addDays(today, Number(s.validade) || 7), bottom = H - 70;
  let y = 0;
  const novaPagina = () => {
    const nro = pdf.page();
    if (nro === 1) {
      pdf.rect(0, 0, W, 104, wine);
      pdf.text(M, 48, pdf.fit(nomeEmp, 24, true, W - 2 * M - 120), 24, true, "#FFFFFF");
      pdf.text(M, 74, "Catálogo de produtos", 13, false, rose);
      pdf.textR(W - M, 48, dataBR(today), 11, false, rose);
      y = 136;
      pdf.text(M, y, pdf.fit(cl ? "Preços para " + cl.nome : "Nossa seleção de produtos", 15, true, W - 2 * M), 15, true, ink); y += 18;
      pdf.text(M, y, `Tabela ${TABELAS[s.tabela] || "Varejo"}${cl && temCondicoes(cl) ? " · condições especiais aplicadas" : ""} · ${itens.length} ${ehVinho() ? (itens.length === 1 ? "vinho" : "vinhos") : (itens.length === 1 ? "produto" : "produtos")}`, 10, false, muted); y += 20;
      if (s.obs && s.obs.trim()) { pdf.wrap(s.obs.trim(), 11, false, W - 2 * M).slice(0, 6).forEach(l => { pdf.text(M, y, l, 11, false, ink); y += 15; }); y += 6; }
    } else {
      pdf.text(M, 42, pdf.fit(nomeEmp + " · Catálogo de produtos", 10, true, W - 2 * M - 80), 10, true, wine);
      pdf.textR(W - M, 42, cl ? pdf.fit(cl.nome, 10, false, 180) : "", 10, false, muted);
      pdf.line(M, 52, W - M, 52, rule, 0.6); y = 76;
    }
  };
  let topo = true;
  novaPagina();
  cats(true).forEach(({ id: k }) => {
    const grupo = itens.filter(p => catDe(p.tipo).id === k); if (!grupo.length) return;
    if (y + 40 + 60 > bottom) { novaPagina(); topo = true; }
    y += topo ? 10 : 24; topo = false; pdf.text(M, y, `${catPlural(k)} (${grupo.length})`, 13, true, wine); y += 8; pdf.line(M, y, W - M, y, wine, 0.8); y += 6;
    grupo.forEach(p => {
      if (y + 40 > bottom) { novaPagina(); pdf.text(M, y, `${catPlural(k)} (continuação)`, 11, true, wine); y += 10; }
      const pr = catalogPreco(s, p), esp = temEspecial(p, cl), nome = p.nome + (p.safra && p.safra !== "NV" ? " " + p.safra : "");
      const det = (ehVinho() ? [p.uva, p.pais, p.regiao, p.vol ? p.vol + " ml" : ""] : [p.marca, p.ref && "ref. " + p.ref, p.material, p.medida]).filter(Boolean).join(" · ");
      pdf.circle(M + 6, y + 15, 5, catDe(p.tipo).c || "#8A7F7A");
      pdf.text(M + 20, y + 15, pdf.fit(nome, 11.5, true, W - 2 * M - 160), 11.5, true, ink);
      if (det) pdf.text(M + 20, y + 29, pdf.fit(det, 9.5, false, W - 2 * M - 160), 9.5, false, muted);
      pdf.textR(W - M, y + 16, fmt(pr), 12.5, true, esp ? azul : ink);
      const sub = p.estoque <= 0 ? "Sob consulta" : [esp ? "Preço especial" : "", s.qtd ? `${p.estoque} ${p.estoque === 1 ? "disponível" : "disponíveis"}` : ""].filter(Boolean).join(" · ");
      if (sub) pdf.textR(W - M, y + 29, sub, 8.5, false, muted);
      y += 38; pdf.line(M + 20, y - 3, W - M, y - 3, rule, 0.4);
    });
  });
  const total = pdf.count(), contato = [emp.fone && "Pedidos: " + emp.fone, emp.cidade].filter(Boolean).join(" · ");
  for (let i = 0; i < total; i++) {
    pdf.goto(i);
    pdf.line(M, H - 52, W - M, H - 52, rule, 0.6);
    pdf.text(M, H - 36, `Preços válidos até ${dataBR(validade)}, sujeitos à disponibilidade de estoque.${ivaPadrao() ? " Preços sem IVA." : ""}`, 8.5, false, muted);
    if (contato) pdf.text(M, H - 24, pdf.fit(contato, 8.5, true, W - 2 * M - 80), 8.5, true, ink);
    pdf.textR(W - M, H - 36, `Página ${i + 1} de ${total}`, 8.5, false, muted);
  }
  return pdf.build(`Catálogo de produtos · ${nomeEmp}`);
}
function catalogoTexto(s) {
  const cl = s.cli ? Cl(s.cli) : null, itens = catalogItens(s);
  let t = `*Catálogo de produtos · ${S.emp ? S.emp.nome : APP}*\n${cl ? `Preços para ${cl.nome} · ` : ""}${fdy(today)}\n`;
  if (s.obs && s.obs.trim()) t += `\n${s.obs.trim()}\n`;
  cats(true).forEach(({ id: k }) => { const ps = itens.filter(p => catDe(p.tipo).id === k); if (!ps.length) return; t += `\n*${catPlural(k)}*\n`; ps.forEach(p => { const d = ehVinho() ? p.uva : [p.marca, p.medida].filter(Boolean).join(", "); t += `• ${p.nome}${p.safra && p.safra !== "NV" ? " " + p.safra : ""}${d ? " (" + d + ")" : ""} · ${fmt(catalogPreco(s, p))}${p.estoque <= 0 ? " · sob consulta" : ""}\n`; }); });
  return t + `\nPreços válidos até ${dataBR(addDays(today, Number(s.validade) || 7))}.${ivaPadrao() ? " Preços sem IVA." : ""}`;
}
const slugArq = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "vinhos";

document.addEventListener("click", travarAcao(async e => {
  const t = e.target.closest("[data-a]"); if (!t || t.disabled) return;
  const a = t.dataset.a, id = t.dataset.id, s = ui.sheet;
  if (a === "abrirCatalogo") { abrirCatalogo(id || ""); return; }
  if (a === "ctTab" && s) { s.tabela = id; renderSheet(); return; }
  if (a === "ctVal" && s) { s.validade = Number(id); renderSheet(); return; }
  if (a === "ctTipo" && s) { if (!id) s.tipos = []; else s.tipos = s.tipos.includes(id) ? s.tipos.filter(x => x !== id) : s.tipos.concat(id); renderSheet(); return; }
  if (a === "catPdf" && s) {
    const cl = s.cli ? Cl(s.cli) : null, nome = `catalogo-${slugArq(cl ? cl.nome : (S.emp && S.emp.nome) || "vinhos")}-${today}.pdf`;
    t.disabled = true; t.textContent = "Gerando…";
    try { await Platform.saveBytes(nome, catalogoPdf(s), "application/pdf"); await commit([logMov("vendas", `Catálogo em PDF gerado${cl ? " para " + cl.nome : ""} · ${catalogItens(s).length} produtos`)]); }
    finally { if (ui.sheet === s) renderSheet(); }
    return;
  }
  if (a === "catTxt" && s) {
    const cl = s.cli ? Cl(s.cli) : null, txt = catalogoTexto(s);
    if (cl && cl.fone) { Platform.openUrl(waLink(cl.fone, txt)); return; }
    if (!(await Platform.share(txt))) { try { await navigator.clipboard.writeText(txt); toast("Catálogo copiado. Cole no WhatsApp."); } catch (er) { toast("Não foi possível compartilhar."); } }
    return;
  }
  if (a === "pePick" && s) { s.pid = id; s.q = ""; s.vals.preco = temEspecial(P(id), Cl(s.id)) ? money(Cl(s.id).precos[id]) : ""; renderSheet(); return; }
  if (a === "savePe" && s) {
    const c = Cl(s.id), p = P(s.pid), v = r2(parseMoney(s.vals.preco));
    if (!(v > 0)) { s.err = "Informe o preço, por exemplo 72,00."; renderSheet(); return; }
    const precos = Object.assign({}, c.precos || {}, { [p.id]: v });
    if (await commit([Store.patch("cli", c.id, { precos }), logMov("cadastro", `Preço especial · ${c.nome} · ${p.nome} · ${fmt(v)}`, { ref: c.id, ps: [p.id] })])) { closeSheet(); toast("Preço especial salvo"); }
    return;
  }
  if (a === "peRm") {
    const c = Cl(id), pid = t.dataset.x, p = P(pid), precos = Object.assign({}, c.precos || {}); delete precos[pid];
    if (await commit([Store.patch("cli", c.id, { precos }), logMov("cadastro", `Preço especial removido · ${c.nome}${p ? " · " + p.nome : ""}`, { ref: c.id })])) toast("Preço especial removido");
    return;
  }
  if (a === "saveCond" && s) {
    const c = Cl(s.id), d = String(s.vals.descPct || "").trim() === "" ? 0 : parseMoney(String(s.vals.descPct).replace("%", ""));
    if (isNaN(d) || d < 0 || d > 90) { s.err = "Use um desconto entre 0 e 90%."; renderSheet(); return; }
    if (await commit([Store.patch("cli", c.id, { descPct: r2(d), tabela: s.vals.tabela || c.tabela || "varejo" }), logMov("cadastro", `Condições do cliente · ${c.nome} · desconto ${dec(r2(d))}%`, { ref: c.id })])) { closeSheet(); toast("Condições salvas"); }
    return;
  }
  if (a === "novoProdForn" || a === "novoProdCompra") {
    const o = initSheet("prodForm", null); o.vals.forn = a === "novoProdForn" ? id : (ui.cdraft && ui.cdraft.forn) || "";
    if (a === "novoProdCompra") o.fromCompra = true;
    openSheet(o, a === "novoProdForn"); return;
  }
}));
document.addEventListener("change", e => {
  const t = e.target, s = ui.sheet; if (!s || s.k !== "catalogo" || t.dataset.ct == null) return;
  const k = t.dataset.ct; s[k] = t.type === "checkbox" ? t.checked : t.value;
  if (k === "cli") { const cl = s.cli ? Cl(s.cli) : null; s.tabela = cl ? cl.tabela || "varejo" : "varejo"; }
  if (k !== "obs") renderSheet();
});
document.addEventListener("input", e => {
  const t = e.target, s = ui.sheet; if (!s) return;
  if (s.k === "catalogo" && t.dataset.ct === "obs") { s.obs = t.value; return; }
  if (s.k === "precoEsp" && t.dataset.f === "preco") { const el = $("shd"); if (el) el.innerHTML = peHint(s); }
});

/* ---- food.js ---- */
/* ================= Saus360 Food: receitas, custo real, produção e preço ================= */
/* Motor de transformação: insumos (com aproveitamento) → receita (com rendimento e perda) → produto acabado.
   Sub-receita = um ingrediente que também tem receita (ex.: massa base, recheio). */
const UNIDADES = ["un", "kg", "g", "l", "ml"];
const UN_NOME = { un: "Unidade (un)", kg: "Quilo (kg)", g: "Grama (g)", l: "Litro (l)", ml: "Mililitro (ml)" };
const UN_BASE = { un: ["un", 1], kg: ["massa", 1000], g: ["massa", 1], l: ["vol", 1000], ml: ["vol", 1] };
const unCompat = u => UNIDADES.filter(x => UN_BASE[x][0] === UN_BASE[u || "un"][0]);
/* Converte q de "de" para "para"; null se as unidades não combinam (peso × volume depende da densidade do ingrediente) */
function conv(q, de, para) {
  const a = UN_BASE[de || "un"], b = UN_BASE[para || "un"];
  if (!a || !b || a[0] !== b[0]) return null;
  return Number(q) * a[1] / b[1];
}
const qtdTxt = (q, u) => `${dec(r4(q))} ${u || "un"}`;
const pnum = v => { const n = parseMoney(v); return isNaN(n) ? 0 : n; };
const RC = id => S.rec.find(r => r.id === id);
const recDoProd = pid => S.rec.find(r => r.prod === pid && r.ativo !== false);

/* Custo de 1 unidade (na unidade do estoque) de um ingrediente: se tem receita, usa a receita (preços atuais); senão o custo médio */
function custoUn(p, prof) {
  if (!p) return 0;
  const r = recDoProd(p.id);
  if (r && (prof || 0) < 5) { const c = custoReceita(r, (prof || 0) + 1); if (c.unit > 0) return c.unit; }
  return Number(p.custo) || 0;
}
/* Custo completo da receita: por linha, consumo bruto (com aproveitamento) e custo; total, rendimento útil e custo unitário */
function custoReceita(r, prof) {
  const linhas = (r.itens || []).map(it => {
    const p = P(it.p), aprov = Math.min(100, Math.max(1, Number(it.aprov) || 100));
    const qProd = p ? conv(Number(it.q) || 0, it.u || unDe(p), unDe(p)) : null;
    const consumo = qProd == null ? null : qProd / (aprov / 100);
    const custo = consumo == null ? 0 : consumo * custoUn(p, prof);
    return { it, p, aprov, consumo, custo, erro: !p ? "Ingrediente removido" : qProd == null ? `Unidade ${it.u} não combina com ${unDe(p)}` : "" };
  });
  const extra = Number(r.extra) || 0, total = sum(linhas, l => l.custo) + extra;
  const rend = Number(r.rend) || 0, perda = Math.min(90, Math.max(0, Number(r.perda) || 0)), util = rend * (1 - perda / 100);
  return { linhas, extra, total, rend, perda, util, unit: util > 0 ? total / util : 0 };
}
/* Preço que cobre custo + custos indiretos e deixa taxas e margem como % do preço: P = C / (1 − T − M) */
function precoSugerido(c, ind, taxa, marg) {
  const den = 1 - (taxa + marg) / 100;
  return den > 0 ? (c + ind) / den : 0;
}

/* ---------- Telas ---------- */
function vReceitas() {
  const list = S.rec.filter(r => r.ativo !== false).map(r => ({ r, p: P(r.prod), c: custoReceita(r) })).filter(x => x.p).sort((a, b) => a.p.nome.localeCompare(b.p.nome));
  const novo = can("ajuste") ? `<button class="btn sm" data-a="recNova">+ Receita</button>` : "";
  let h = head("Receitas", "Ficha técnica, custo real e produção", { back: ui.stack.length > 0, action: novo }) + banners();
  if (!list.length) return h + empty("Nenhuma receita ainda.", "Cadastre os ingredientes como produtos do tipo “Ingrediente”, com o custo e a unidade de compra. Depois crie a receita do produto que você vende.");
  h += `<p class="hint" style="margin:0 2px 12px">Custo por unidade com os preços atuais dos ingredientes, já contando o aproveitamento e a perda prevista.</p>`;
  if (DESK()) return h + dtable([["Produto"], ["Rende", "num"], ["Custo/un.", "num"], ["Preço varejo", "num"], ["Margem", "num"], ["Em estoque", "num"]],
    list.map(({ r, p, c }) => { const pv = preco(p, "varejo"), m = pv > 0 ? (pv - c.unit) / pv * 100 : null; return dtr(`data-a="go" data-r="receita" data-id="${r.id}"`, [td(`<b>${esc(p.nome)}</b>`), td(qtdTxt(c.util, unDe(p)), "num"), td(fmt(c.unit), "num"), td(fmt(pv), "num"), td(m == null ? "—" : `<span class="${m < 20 ? "neg" : "pos"}">${dec(Math.round(m))}%</span>`, "num"), td(qtdTxt(p.estoque || 0, unDe(p)), "num")]); }), "", "t-rec");
  return h + `<div class="list">${list.map(({ r, p, c }) => { const pv = preco(p, "varejo"), m = pv > 0 ? (pv - c.unit) / pv * 100 : null;
    return `<button class="row" data-a="go" data-r="receita" data-id="${r.id}"><span class="bt">${bottle(p.tipo)}</span><span class="wmain"><b>${esc(p.nome)}</b><small>rende ${qtdTxt(c.util, unDe(p))} · custo ${fmt(c.unit)}/${unDe(p)}</small></span><span class="right">${m == null ? "" : `<b class="${m < 20 ? "neg" : "pos"}">${dec(Math.round(m))}%</b><small class="mvsaldo">margem</small>`}</span></button>`; }).join("")}</div>`;
}

function vReceita() {
  const r = RC(ui.id), p = r && P(r.prod);
  if (!r || !p) return head("Receita", "", { back: true }) + empty("Receita não encontrada.", "");
  const c = custoReceita(r), cst = can("custo");
  if (!ui.calc || ui.calc.id !== r.id) ui.calc = { id: r.id, ind: "", taxa: "", marg: "30" };
  let h = head(p.nome, `Receita · rende ${qtdTxt(c.util, unDe(p))}`, { back: true, action: can("ajuste") ? `<button class="btn sm line" data-a="recEditar" data-id="${r.id}">Editar</button>` : "" }) + banners();
  h += `<div class="stats"><div class="stat"><span>Custo da receita</span><b>${cst ? fmt(c.total) : "—"}</b><small>${c.linhas.length} ingredientes</small></div><div class="stat good"><span>Custo por ${unDe(p)}</span><b>${cst ? fmt(c.unit) : "—"}</b><small>com perdas</small></div><div class="stat"><span>Em estoque</span><b>${dec(r4(p.estoque || 0))}</b><small>${unDe(p)}</small></div></div>`;
  if (can("ajuste")) h += `<button class="btn block" style="margin:12px 0" data-a="sheet" data-k="produzir" data-id="${r.id}">${ico("plus", 18)}Registrar produção</button>`;
  h += `<p class="sec">Ingredientes</p><div class="list">${c.linhas.map(l => `<div class="row"><span class="wmain"><b>${esc(l.p ? l.p.nome : "Ingrediente removido")}</b><small>${qtdTxt(l.it.q, l.it.u)}${l.aprov < 100 ? ` · aproveitamento ${dec(l.aprov)}% → compra ${l.consumo == null ? "—" : qtdTxt(l.consumo, unDe(l.p))}` : ""}${recDoProd(l.it.p) ? " · sub-receita" : ""}${l.erro ? ` · <span class="neg">${esc(l.erro)}</span>` : ""}</small></span>${cst ? `<b>${fmt(l.custo)}</b>` : ""}</div>`).join("")}${c.extra ? `<div class="row"><span class="wmain"><b>Outros custos da receita</b><small>gás, energia, mão de obra</small></span>${cst ? `<b>${fmt(c.extra)}</b>` : ""}</div>` : ""}</div>`;
  h += `<p class="hint">Rende ${qtdTxt(c.rend, unDe(p))}${c.perda ? `, com ${dec(c.perda)}% de perda prevista: ${qtdTxt(c.util, unDe(p))} aproveitáveis` : ""}.${p.validade ? ` Validade: ${p.validade} dias.` : ""}${p.alerg ? ` Alérgenos: ${esc(p.alerg)}.` : ""}</p>`;
  if (r.obs) h += `<p class="sec">Modo de preparo</p><div class="card" style="white-space:pre-wrap">${esc(r.obs)}</div>`;
  if (cst) {
    h += `<p class="sec">Calculadora de preço</p><section class="card">
      <div class="grid2"><label class="field">Custos indiretos por ${unDe(p)} (${SIM()})<input data-calc="ind" inputmode="decimal" value="${esc(ui.calc.ind)}" placeholder="${money(0)}"></label>
      <label class="field">Taxas e comissões (%)<input data-calc="taxa" inputmode="decimal" value="${esc(ui.calc.taxa)}" placeholder="Cartão, app de delivery"></label></div>
      <label class="field">Margem desejada sobre o preço (%)<input data-calc="marg" inputmode="decimal" value="${esc(ui.calc.marg)}"></label>
      <div id="calcRes">${calcRes(r)}</div></section>
      <p class="hint">Taxas e margem são porcentagens do preço de venda, por isso o cálculo é custo ÷ (1 − taxas − margem), não custo + porcentagens. Simule cada canal (balcão, WhatsApp, delivery) com a taxa dele.</p>`;
  }
  h += `<button class="btn line block" style="margin-top:12px" data-a="go" data-r="movimentos" data-id="${p.id}">${ico("list", 16)}Histórico de produção e vendas</button>`;
  return h;
}
function calcRes(r) {
  const c = custoReceita(r), p = P(r.prod), k = ui.calc || {}, ind = pnum(k.ind), taxa = pnum(k.taxa), marg = pnum(k.marg), pv = precoSugerido(c.unit, ind, taxa, marg);
  if (!(pv > 0)) return `<div class="note warn">Taxas + margem precisam somar menos de 100%.</div>`;
  const atual = preco(p, "varejo"), lucro = atual - c.unit - ind - atual * taxa / 100;
  return `<div class="stats" style="margin-top:6px"><div class="stat good"><span>Preço sugerido</span><b>${fmt(pv)}</b><small>por ${unDe(p)}</small></div><div class="stat"><span>Preço atual</span><b>${fmt(atual)}</b><small>${atual > 0 ? `sobra ${fmt(lucro)} (${dec(Math.round(lucro / atual * 100))}%)` : "sem preço"}</small></div></div>
    ${can("ajuste") ? `<button class="btn line block" style="margin-top:10px" data-a="recUsarPreco" data-id="${r.id}" data-v="${r2(pv)}">Usar ${fmt(pv)} como preço de varejo</button>` : ""}`;
}

/* Edição da receita (tela inteira, com rascunho em ui.rdraft) */
function vReceitaEdit() {
  const d = ui.rdraft; if (!d) return head("Receita", "", { back: true }) + empty("Nada em edição.", "");
  const vendaveis = S.prod.filter(p => p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome));
  const ings = vendaveis.filter(p => p.id !== d.prod);
  let h = head(d.id ? "Editar receita" : "Nova receita", "Ficha técnica", { back: true }) + banners();
  h += `<section class="card"><label class="field">Produto que a receita produz<select data-rd="prod"><option value="">Escolha…</option>${vendaveis.filter(p => !recDoProd(p.id) || recDoProd(p.id).id === d.id).map(p => `<option value="${p.id}" ${d.prod === p.id ? "selected" : ""}>${esc(p.nome)} (${unDe(p)})</option>`).join("")}</select></label>
    <p class="hint" style="margin:4px 0 10px">Pode ser um produto de venda ou um preparo usado em outra receita (massa, recheio, calda).</p>
    <div class="grid2"><label class="field">Rendimento (${d.prod ? unDe(P(d.prod)) : "un"})<input data-rd="rend" inputmode="decimal" value="${esc(d.rend)}" placeholder="Ex: 30"></label>
    <label class="field">Perda prevista (%)<input data-rd="perda" inputmode="decimal" value="${esc(d.perda)}" placeholder="0"></label></div>
    <label class="field">Outros custos por receita (${SIM()})<input data-rd="extra" inputmode="decimal" value="${esc(d.extra)}" placeholder="Gás, energia, mão de obra"></label></section>`;
  h += `<p class="sec">Ingredientes</p><div class="list">${d.itens.map((it, i) => { const p = P(it.p), us = p ? unCompat(unDe(p)) : UNIDADES;
    return `<div class="card ring" style="padding:10px 12px"><label class="field" style="margin:0 0 8px">Ingrediente<select data-ri="${i}" data-rk="p"><option value="">Escolha…</option>${ings.map(x => `<option value="${x.id}" ${it.p === x.id ? "selected" : ""}>${esc(x.nome)}${ehInsumo(x) ? "" : " · preparo"}</option>`).join("")}</select></label>
      <div class="grid3"><label class="field" style="margin:0">Quantidade<input data-ri="${i}" data-rk="q" inputmode="decimal" value="${esc(it.q)}"></label>
      <label class="field" style="margin:0">Unidade<select data-ri="${i}" data-rk="u">${us.map(u => `<option ${it.u === u ? "selected" : ""}>${u}</option>`).join("")}</select></label>
      <label class="field" style="margin:0">Aproveit. (%)<input data-ri="${i}" data-rk="aprov" inputmode="decimal" value="${esc(it.aprov)}" placeholder="100"></label></div>
      <button class="btn sm ghost" style="margin-top:6px" data-a="recDelItem" data-id="${i}">Remover</button></div>`; }).join("")}</div>
    <button class="btn line block" style="margin-top:8px" data-a="recAddItem">+ Ingrediente</button>
    <p class="hint">Quantidade = o que a receita leva já limpo. Aproveitamento = quanto sobra depois de limpar: 1 kg de morango que rende 850 g é 85%. O sistema baixa do estoque o bruto (850 g ÷ 85% = 1 kg).</p>`;
  h += `<label class="field">Modo de preparo<textarea data-rd="obs" rows="5" placeholder="Passos, tempo de forno, temperatura">${esc(d.obs)}</textarea></label>`;
  h += `<div id="rdres" class="card" style="margin-top:12px">${rdResumo()}</div>`;
  if (d.err) h += `<div class="note warn">${esc(d.err)}</div>`;
  h += `<button class="btn block" style="margin-top:12px" data-a="recSalvar">Salvar receita</button>`;
  if (d.id) h += `<button class="btn ghost block" style="margin-top:6px" data-a="recArquivar">Arquivar receita</button>`;
  return h;
}
function rdDoc() {
  const d = ui.rdraft;
  return { prod: d.prod, rend: pnum(d.rend), perda: pnum(d.perda), extra: pnum(d.extra), obs: String(d.obs || "").trim(),
    itens: d.itens.filter(it => it.p && pnum(it.q) > 0).map(it => ({ p: it.p, q: pnum(it.q), u: it.u || unDe(P(it.p)), aprov: pnum(it.aprov) || 100 })) };
}
function rdResumo() {
  const doc = rdDoc(), p = P(doc.prod); if (!p || !(doc.rend > 0)) return `<small class="muted">Escolha o produto e o rendimento para ver o custo.</small>`;
  const c = custoReceita(doc);
  return `<b>Custo da receita: ${fmt(c.total)}</b><br><small>Por ${unDe(p)}: <b>${fmt(c.unit)}</b> · rende ${qtdTxt(c.util, unDe(p))} aproveitáveis</small>${c.linhas.some(l => l.erro) ? `<div class="note warn" style="margin-top:8px">${esc(c.linhas.filter(l => l.erro).map(l => l.erro).join("; "))}</div>` : ""}`;
}
/* Uma receita não pode usar a si mesma, nem por meio de sub-receitas */
function temCiclo(prod, itens, vistos) {
  vistos = vistos || new Set([prod]);
  for (const it of itens) {
    if (vistos.has(it.p)) return true;
    const r = recDoProd(it.p); if (r) { const v = new Set(vistos); v.add(it.p); if (temCiclo(prod, r.itens || [], v)) return true; }
  }
  return false;
}

/* ---------- Produção ---------- */
function prodPlano(s) {
  const r = RC(s.id), p = r && P(r.prod), n = pnum(s.vals.n) || 0;
  if (!r || !p) return null;
  const c = custoReceita(r), linhas = c.linhas.map(l => ({ ...l, precisa: l.consumo == null ? null : l.consumo * n }));
  const falta = linhas.filter(l => l.p && l.precisa != null && l.precisa > (l.p.estoque || 0) + 1e-9);
  const previsto = c.util * n, obtido = s.vals.obtido === "" || s.vals.obtido == null ? previsto : pnum(s.vals.obtido);
  return { r, p, c, n, linhas, falta, previsto, obtido, total: c.total * n };
}
function prodDet(s) {
  const pl = prodPlano(s); if (!pl) return "";
  const { p, linhas, falta, previsto, obtido, total } = pl, cst = can("custo");
  return `<div class="list">${linhas.map(l => `<div class="row"><span class="wmain"><b>${esc(l.p ? l.p.nome : "—")}</b><small>usa ${l.precisa == null ? "—" : qtdTxt(l.precisa, unDe(l.p))} · tem ${l.p ? qtdTxt(l.p.estoque || 0, unDe(l.p)) : "—"}</small></span>${l.p && l.precisa != null && l.precisa > (l.p.estoque || 0) + 1e-9 ? `<b class="neg">falta ${qtdTxt(l.precisa - (l.p.estoque || 0), unDe(l.p))}</b>` : `<b class="pos">ok</b>`}</div>`).join("")}</div>
    <div class="stats" style="margin-top:10px"><div class="stat"><span>Previsto</span><b>${dec(r4(previsto))}</b><small>${unDe(p)}</small></div><div class="stat ${obtido < previsto ? "warn" : "good"}"><span>Obtido</span><b>${dec(r4(obtido))}</b><small>${previsto > 0 && obtido < previsto ? `perda extra ${dec(Math.round((1 - obtido / previsto) * 100))}%` : unDe(p)}</small></div>${cst ? `<div class="stat"><span>Custo/${unDe(p)}</span><b>${obtido > 0 ? fmt(total / obtido) : "—"}</b><small>total ${fmt(total)}</small></div>` : ""}</div>
    ${falta.length ? `<div class="note warn" style="margin-top:10px">Falta ingrediente no estoque. Registre a compra ou a entrada antes de produzir.</div>` : ""}`;
}

Object.assign(SH, {
  produzir: s => {
    const r = RC(s.id), p = r && P(r.prod); if (!p) return ["Produção", empty("Receita não encontrada.", "")];
    if (s.vals.n == null) s.vals.n = "1";
    return [`Produzir ${p.nome}`, `<div class="grid2"><label class="field">Quantas receitas<input data-f="n" inputmode="decimal" value="${esc(s.vals.n)}"></label>
      <label class="field">Quantidade obtida (${unDe(p)})<input data-f="obtido" inputmode="decimal" value="${esc(s.vals.obtido || "")}" placeholder="igual ao previsto"></label></div>
      <p class="hint" style="margin:0 0 8px">Se saiu menos que o previsto, informe o real: a diferença fica registrada como perda.</p>
      <div id="prodDet">${prodDet(s)}</div>${s.err ? `<div class="note warn">${esc(s.err)}</div>` : ""}
      <button class="btn block" style="margin-top:12px" data-a="doProduzir">Confirmar produção</button>`];
  }
});

const FOOD_A = {
  recNova: () => { ui.rdraft = { id: null, prod: "", rend: "", perda: "", extra: "", obs: "", itens: [{ p: "", q: "", u: "g", aprov: "" }] }; go("receitaEdit"); },
  recEditar: (t, id) => { const r = RC(id); if (!r) return; ui.rdraft = { id, prod: r.prod, rend: dec(r.rend || ""), perda: r.perda ? dec(r.perda) : "", extra: r.extra ? money(r.extra) : "", obs: r.obs || "", itens: (r.itens || []).map(it => ({ p: it.p, q: dec(it.q), u: it.u, aprov: it.aprov && it.aprov !== 100 ? dec(it.aprov) : "" })) }; go("receitaEdit"); },
  recAddItem: () => { ui.rdraft.itens.push({ p: "", q: "", u: "g", aprov: "" }); render(); },
  recDelItem: (t, id) => { ui.rdraft.itens.splice(Number(id), 1); render(); },
  recSalvar: async () => {
    const d = ui.rdraft, doc = rdDoc(), p = P(doc.prod);
    d.err = !p ? "Escolha o produto que a receita produz." : !(doc.rend > 0) ? "Informe o rendimento, por exemplo 30." : !doc.itens.length ? "Inclua pelo menos um ingrediente com quantidade." : doc.perda >= 90 ? "A perda prevista precisa ser menor que 90%." : temCiclo(doc.prod, doc.itens) ? "Um ingrediente usa esta mesma receita. Revise as sub-receitas." : custoReceita(doc).linhas.find(l => l.erro) ? custoReceita(doc).linhas.find(l => l.erro).erro : "";
    if (d.err) { render(); return; }
    const old = d.id ? RC(d.id) : null, id = d.id || rid(), full = Object.assign({ ativo: true, ver: ((old && old.ver) || 0) + 1, hist: ((old && old.hist) || []).concat(old ? [{ ts: old.ts || "", custo: r2(custoReceita(old).unit), rend: old.rend }] : []).slice(-20) }, doc, { ts: isoT(new Date()), por: UID });
    if (await commit([Store.put("rec", id, full), logMov("cadastro", `${old ? "Receita editada" : "Nova receita"} · ${p.nome} · custo ${fmt(custoReceita(doc).unit)}/${unDe(p)}`, { ps: [p.id, ...doc.itens.map(i => i.p)] })])) { ui.rdraft = null; back(); if (!old) go("receita", id); toast(old ? "Receita atualizada" : "Receita criada"); }
  },
  recArquivar: async () => { const d = ui.rdraft, r = RC(d.id); if (!r) return; if (await commit([Store.put("rec", r.id, Object.assign({}, r, { ativo: false }))])) { ui.rdraft = null; go("receitas"); toast("Receita arquivada"); } },
  recUsarPreco: async (t, id) => { const r = RC(id), p = r && P(r.prod), v = Number(t.dataset.v); if (!p || !(v > 0)) return; if (await commit([Store.patch("prod", p.id, { precos: Object.assign({}, p.precos || {}, { varejo: v }) }), logMov("cadastro", `Preço de ${p.nome} → ${fmt(v)} (calculadora da receita)`, { ps: [p.id] })])) { render(); toast("Preço de varejo atualizado"); } },
  doProduzir: async (t, id, s) => {
    const pl = prodPlano(s); if (!pl) return;
    s.err = !(pl.n > 0) ? "Informe quantas receitas, por exemplo 1 ou 0,5." : pl.linhas.some(l => l.erro) ? pl.linhas.find(l => l.erro).erro : pl.falta.length ? `Falta ${pl.falta.map(l => l.p.nome).join(", ")} no estoque.` : !(pl.obtido > 0) ? "Informe a quantidade obtida." : "";
    if (s.err) { renderSheet(); return; }
    const ch = pl.linhas.filter(l => l.p && l.precisa > 0).map(l => ({ id: l.p.id, delta: -r4(l.precisa) }));
    ch.push({ id: pl.p.id, delta: r4(pl.obtido), custoEntrada: r4(pl.total / pl.obtido) });
    const mv = mvDe(ch), perdaReal = pl.previsto > 0 ? Math.max(0, (1 - pl.obtido / pl.previsto) * 100) : 0;
    const log = logMov("estoque", `Produção · ${pl.p.nome} · ${qtdTxt(pl.obtido, unDe(pl.p))} (${dec(pl.n)} receita${pl.n === 1 ? "" : "s"})${perdaReal >= 0.5 ? ` · perda extra ${dec(Math.round(perdaReal))}%` : ""}`, { ps: ch.map(c => c.id), tm: "producao", mv, ref: pl.r.id, previsto: r4(pl.previsto), obtido: r4(pl.obtido), custo: r2(pl.total) });
    if (await commit([Store.stock(ch), log])) { closeSheet(); render(); toast(`Produção registrada: ${qtdTxt(pl.obtido, unDe(pl.p))}`); }
  }
};

Object.assign(ROUTES, {
  receitas: { v: vReceitas, tab: "estoque", p: "estoque" },
  receita: { v: vReceita, tab: "estoque", p: "estoque" },
  receitaEdit: { v: vReceitaEdit, tab: "estoque", p: "ajuste" }
});

/* Campos da receita e da calculadora: atualiza só o resumo (não tira o foco do campo) */
document.addEventListener("input", e => {
  const t = e.target, d = t.dataset;
  if (d.rd && ui.rdraft) { ui.rdraft[d.rd] = t.value; const el = $("rdres"); if (el) el.innerHTML = rdResumo(); return; }
  if (d.ri != null && ui.rdraft) { const it = ui.rdraft.itens[Number(d.ri)]; it[d.rk] = t.value; const el = $("rdres"); if (el) el.innerHTML = rdResumo(); return; }
  if (d.calc && ui.calc) { ui.calc[d.calc] = t.value; const r = RC(ui.calc.id), el = $("calcRes"); if (r && el) el.innerHTML = calcRes(r); return; }
  if (ui.sheet && ui.sheet.k === "produzir" && (d.f === "n" || d.f === "obtido")) { const el = $("prodDet"); if (el) el.innerHTML = prodDet(ui.sheet); }
});
document.addEventListener("change", e => {
  const t = e.target, d = t.dataset;
  /* trocar produto ou ingrediente redesenha: a lista de unidades depende da unidade do produto */
  if (d.rd === "prod" && ui.rdraft) { ui.rdraft.prod = t.value; render(); }
  if (d.ri != null && d.rk === "p" && ui.rdraft) { const it = ui.rdraft.itens[Number(d.ri)], p = P(t.value); it.p = t.value; if (p && !unCompat(unDe(p)).includes(it.u)) it.u = unDe(p) === "kg" ? "g" : unDe(p) === "l" ? "ml" : unDe(p); render(); }
});

boot();
