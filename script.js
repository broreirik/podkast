// Besøkstall: lag en gratis konto på goatcounter.com og skriv inn koden her, f.eks. "podkasten".
// Står den tom, lastes ingen telling.
const GOATCOUNTER_KODE = "";

function lesLager(nokkel) {
  try { return localStorage.getItem(nokkel); } catch (e) { return null; }
}
function skrivLager(nokkel, verdi) {
  try { localStorage.setItem(nokkel, verdi); } catch (e) { /* privat modus e.l. */ }
}
const $ = (id) => document.getElementById(id);

/* Tema */
const rot = document.documentElement;
const bryter = document.querySelector(".tema-bryter");
const systemMork = window.matchMedia("(prefers-color-scheme: dark)");

function erMork() {
  return rot.dataset.theme ? rot.dataset.theme === "dark" : systemMork.matches;
}
function oppdaterBryter() {
  bryter.setAttribute("aria-label", erMork() ? "Bytt til lyst tema" : "Bytt til mørkt tema");
}
bryter.addEventListener("click", () => {
  const nytt = erMork() ? "light" : "dark";
  rot.dataset.theme = nytt;
  skrivLager("tema", nytt);
  oppdaterBryter();
});
systemMork.addEventListener("change", oppdaterBryter);
oppdaterBryter();

/* Video: kapitler og tidspunkter i teksten */
const video = $("video");
const kapitler = [...document.querySelectorAll(".kapittel")];

function markerKapittel(tid) {
  let aktiv = null;
  kapitler.forEach((k) => { if (tid >= Number(k.dataset.t)) aktiv = k; });
  kapitler.forEach((k) => k.setAttribute("aria-current", k === aktiv ? "true" : "false"));
}
function hoppTil(sekunder) {
  video.currentTime = sekunder;
  markerKapittel(sekunder);
  video.play().catch(() => {});
  video.scrollIntoView({ behavior: "smooth", block: "center" });
}
document.querySelectorAll("[data-t]").forEach((knapp) => {
  knapp.addEventListener("click", () => hoppTil(Number(knapp.dataset.t)));
});
video.addEventListener("timeupdate", () => markerKapittel(video.currentTime));

/* Teksting: lages fra «Hele samtalen», så det trengs ingen egen fil */
const VIDEO_SLUTT = 395;
const navn = { "taler-p": "Gleb", "taler-s": "Sofia", "taler-b": "Bror" };

function delOpp(tekst, maks = 64) {
  // Del i like lange biter, så ingen bit blir et kort restord
  const ord = tekst.split(" ");
  const antall = Math.ceil(tekst.length / maks);
  const mal = tekst.length / antall;
  const biter = [];
  let bit = "";
  for (const o of ord) {
    if (bit && biter.length < antall - 1 && (bit + " " + o).length > mal) { biter.push(bit); bit = o; }
    else bit = bit ? bit + " " + o : o;
  }
  biter.push(bit);
  return biter;
}

function lagTeksting() {
  if (!("VTTCue" in window) || !video.addTextTrack) return;
  const spor = video.addTextTrack("captions", "Norsk", "nb");
  const replikker = [...document.querySelectorAll(".transkripsjon li[class^='taler-']")].map((li) => ({
    start: Number(li.querySelector("button").dataset.t),
    taler: navn[li.className],
    tekst: li.querySelector("span").textContent
  }));
  let forrigeTaler = null;
  replikker.forEach((r, i) => {
    const slutt = i + 1 < replikker.length ? replikker[i + 1].start : VIDEO_SLUTT;
    const biter = delOpp(r.tekst);
    const tegn = biter.reduce((sum, b) => sum + b.length, 0);
    let tid = r.start;
    biter.forEach((b, n) => {
      const lengde = (slutt - r.start) * (b.length / tegn);
      const visning = n === 0 && r.taler !== forrigeTaler ? `${r.taler}: ${b}` : b;
      spor.addCue(new VTTCue(tid, Math.min(tid + lengde, slutt), visning));
      tid += lengde;
    });
    forrigeTaler = r.taler;
  });
  spor.mode = "showing";
}
lagTeksting();


/* Quiz */
const sporsmal = [
  {
    tekst: "Hvor mange ungdommer chatter med venner hver dag, ifølge undersøkelsen vi snakker om?",
    alternativer: ["Rundt halvparten", "82 prosent", "Nesten alle, 98 prosent"],
    riktig: 1,
    forklaring: "82 prosent. Mye av vennskapet skjer på Snapchat, TikTok og andre apper."
  },
  {
    tekst: "Hvor mange ville følt seg utenfor hvis de ikke var på de samme appene som vennene sine?",
    alternativer: ["12 prosent", "42 prosent", "82 prosent"],
    riktig: 1,
    forklaring: "42 prosent. I episoden kaller vi det sosialt press: er du ikke med i gruppechatten, går du glipp av ting."
  },
  {
    tekst: "Hvor mange mener selv at de bruker for mye tid på sosiale medier?",
    alternativer: ["18 prosent", "38 prosent", "68 prosent"],
    riktig: 1,
    forklaring: "38 prosent. Og nesten 30 prosent skulle ønske de klarte å logge av oftere."
  },
  {
    tekst: "Når går vanlig bruk over til å bli et problem, ifølge samtalen?",
    alternativer: [
      "Når du har mer enn tre apper",
      "Når det begynner å gå ut over andre ting, som søvn og skole",
      "Når du bruker telefonen i friminuttet"
    ],
    riktig: 1,
    forklaring: "Søvn kom opp som eksempelet: sitter du på telefonen hver kveld, merker du det på læring og helse."
  },
  {
    tekst: "Hvem har ansvaret for at ungdom er trygge på nett, mente de i studio?",
    alternativer: [
      "Bare foreldrene",
      "Bare appene, som TikTok og Snapchat",
      "Alle: foreldre, skolen, plattformene og ungdom selv"
    ],
    riktig: 2,
    forklaring: "Ingen kan gjøre det alene. Og de mente det er bedre å snakke åpent sammen enn at foreldre overvåker."
  },
  {
    tekst: "Hvor mange har blokkert noen på Snapchat, TikTok, Instagram eller Facebook?",
    alternativer: ["25 prosent", "50 prosent", "75 prosent"],
    riktig: 2,
    forklaring: "Tre av fire. Mange vet altså hvordan de beskytter seg, men det betyr ikke at alle gjør det hver gang."
  }
];

const startDel = $("quiz-start");
const sporsmalDel = $("quiz-sporsmal");
const resultatDel = $("quiz-resultat");
const alternativerEl = $("alternativer");
const forklaringEl = $("forklaring");
const nesteKnapp = $("neste");
let indeks = 0;
let poeng = 0;

function visBeste() {
  const beste = lesLager("quiz-beste");
  const el = $("beste");
  if (beste !== null) {
    el.textContent = `Forrige gang fikk du ${beste} av ${sporsmal.length} riktige.`;
    el.hidden = false;
  }
}

function startQuiz() {
  indeks = 0;
  poeng = 0;
  startDel.hidden = true;
  resultatDel.hidden = true;
  sporsmalDel.hidden = false;
  visSporsmal();
}

function visSporsmal() {
  const s = sporsmal[indeks];
  $("teller").textContent = `Spørsmål ${indeks + 1} av ${sporsmal.length}`;
  $("poeng-underveis").textContent = indeks ? `${poeng} riktige så langt` : "";
  const tittel = $("sporsmal-tekst");
  tittel.textContent = s.tekst;
  alternativerEl.replaceChildren();
  forklaringEl.replaceChildren();
  nesteKnapp.hidden = true;

  s.alternativer.forEach((tekst, i) => {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.className = "alternativ";
    knapp.textContent = tekst;
    knapp.addEventListener("click", () => svar(i));
    alternativerEl.append(knapp);
  });
  tittel.focus({ preventScroll: true });
}

function svar(valgt) {
  const s = sporsmal[indeks];
  alternativerEl.querySelectorAll(".alternativ").forEach((k, i) => {
    k.disabled = true;
    if (i === s.riktig) k.classList.add("riktig");
    else if (i === valgt) k.classList.add("feil");
  });
  const riktig = valgt === s.riktig;
  if (riktig) poeng++;

  const overskrift = document.createElement("strong");
  overskrift.textContent = riktig ? "Riktig." : `Feil. Riktig svar: ${s.alternativer[s.riktig]}.`;
  forklaringEl.replaceChildren(overskrift, document.createTextNode(s.forklaring));

  nesteKnapp.textContent = indeks === sporsmal.length - 1 ? "Se resultatet" : "Neste spørsmål";
  nesteKnapp.hidden = false;
  nesteKnapp.focus({ preventScroll: true });
}

function visResultat() {
  sporsmalDel.hidden = true;
  resultatDel.hidden = false;
  const poengEl = $("poeng");
  poengEl.textContent = `${poeng} av ${sporsmal.length}`;

  let tekst;
  if (poeng === sporsmal.length) tekst = "Alle riktige. Du har fulgt godt med.";
  else if (poeng >= 4) tekst = "Bra. Du fikk med deg det meste.";
  else if (poeng >= 2) tekst = "Noen riktige. Se episoden en gang til, den er under sju minutter.";
  else tekst = "Ikke så mange denne gangen. Tallene står over quizen hvis du vil prøve igjen.";
  $("resultat-tekst").textContent = tekst;

  const forrige = Number(lesLager("quiz-beste") ?? -1);
  if (poeng > forrige) skrivLager("quiz-beste", String(poeng));
  poengEl.focus({ preventScroll: true });
}

$("start-quiz").addEventListener("click", startQuiz);
$("igjen").addEventListener("click", startQuiz);
nesteKnapp.addEventListener("click", () => {
  indeks++;
  if (indeks < sporsmal.length) visSporsmal();
  else visResultat();
});
visBeste();

/* Besøkstall (GoatCounter, uten informasjonskapsler) */
if (GOATCOUNTER_KODE) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${GOATCOUNTER_KODE}.goatcounter.com/count`;
  document.body.append(s);
}
