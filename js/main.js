/* Vrána Response v3 – reflexní pruh: hlavička, menu, kde pracujete, nástěnný kalendář, hledání témat, formulář */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var d2 = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------- hlavička: modrá nad hero, bílá po odscrollování ---------- */
  var hlavicka = $('[data-hlavicka]');
  var hero = $('.hero');
  var cekam = false;
  function stavHlavicky() {
    cekam = false;
    if (!hlavicka) return;
    var hranice = hero ? hero.offsetHeight - 90 : 40;
    hlavicka.classList.toggle('pevna', window.scrollY > hranice);
    hlavicka.classList.toggle('posunuta', window.scrollY > 10);
  }
  window.addEventListener('scroll', function () { if (!cekam) { cekam = true; requestAnimationFrame(stavHlavicky); } }, { passive: true });
  window.addEventListener('resize', stavHlavicky);
  stavHlavicky();

  /* ---------- mobilní menu ---------- */
  var menuTl = $('.menu-tl');
  var menu = $('#menu');
  function zavriMenu() {
    if (!menu) return;
    document.body.classList.remove('menu-otevrene');
    menuTl.setAttribute('aria-expanded', 'false');
  }
  if (menuTl && menu) {
    menuTl.addEventListener('click', function () {
      var ot = document.body.classList.toggle('menu-otevrene');
      menuTl.setAttribute('aria-expanded', ot ? 'true' : 'false');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', zavriMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menu-otevrene')) { zavriMenu(); menuTl.focus(); } });
  }

  /* ---------- zájem z tlačítek → formulář ---------- */
  function zaskrtni(hodnota) {
    $$('input[name="zajem"]').forEach(function (i) { if (i.value === hodnota) i.checked = true; });
  }
  $$('[data-zajem]').forEach(function (a) {
    a.addEventListener('click', function () { zaskrtni(a.getAttribute('data-zajem')); });
  });

  /* ---------- Kde pracujete? ---------- */
  var kde = $('[data-kde]');
  if (kde) {
    var taby = $$('[role="tab"]', kde);
    var vyber = function (t, fokus) {
      taby.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (fokus) t.focus();
      var seznam = t.parentElement;
      if (seznam.scrollWidth > seznam.clientWidth + 2) seznam.scrollTo({ left: t.offsetLeft - 16, behavior: 'smooth' });
    };
    taby.forEach(function (t, i) {
      t.addEventListener('click', function () { vyber(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = taby[(i + 1) % taby.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = taby[(i - 1 + taby.length) % taby.length];
        else if (e.key === 'Home') n = taby[0];
        else if (e.key === 'End') n = taby[taby.length - 1];
        if (n) { e.preventDefault(); vyber(n, true); }
      });
    });
  }
  $$('[data-pracoviste]').forEach(function (a) {
    a.addEventListener('click', function () {
      var z = $('textarea[name="zprava"]');
      if (!z) return;
      var radek = 'Typ pracoviště: ' + a.getAttribute('data-pracoviste');
      var bez = z.value.split('\n').filter(function (r) { return r.indexOf('Typ pracoviště: ') !== 0; }).join('\n').replace(/^\n+/, '');
      z.value = radek + (bez ? '\n' + bez : '\n');
    });
  });

  /* ---------- nástěnný kalendář ročního programu ---------- */
  var MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
  var MESICE_2 = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
  var planovac = $('[data-planovac]');
  if (planovac) {
    var okruhy = [];
    try { okruhy = JSON.parse($('#okruhy-data').textContent); } catch (e) { okruhy = []; }
    var okruh = function (c) { for (var i = 0; i < okruhy.length; i++) if (okruhy[i].c === c) return okruhy[i]; return null; };
    var dlazdice = $$('[data-mesic]', planovac);
    var napoveda = $('[data-napoveda]', planovac);
    var souhrn = $('[data-souhrn]', planovac);
    var startSel = $('[data-start]', planovac);
    var prepinace = $$('.prepinac [role="radio"]', planovac);
    var chipy = $$('.chip', planovac);
    var vyberBox = $('[data-okruhy-vyber]', planovac);
    var detC = $('[data-detail-c]', planovac), detN = $('[data-detail-n]', planovac), detP = $('[data-detail-p]', planovac);
    var rezim = 12, vybrane6 = [1, 2, 3, 4, 5, 6], zvoleny = 0;
    var start = (new Date().getMonth() + 1) % 12;
    if (startSel) startSel.value = String(start);

    var plan = function () {
      var vysl = [];
      var serazene = vybrane6.slice().sort(function (a, b) { return a - b; });
      for (var i = 0; i < 12; i++) {
        var m = (start + i) % 12;
        if (rezim === 12) vysl.push({ m: m, kurz: i + 1, o: i + 1 });
        else if (i % 2 === 0) vysl.push({ m: m, kurz: i / 2 + 1, o: serazene[i / 2] || null });
        else vysl.push({ m: m, volno: true });
      }
      return vysl;
    };
    var sklon = function (n) { return n === 1 ? 'okruh' : (n >= 2 && n <= 4 ? 'okruhy' : 'okruhů'); };

    var ukazDetail = function (i) {
      var p = plan()[i];
      zvoleny = i;
      dlazdice.forEach(function (d, k) { d.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      if (p.volno) {
        detC.textContent = MESICE[p.m] + ' · volný měsíc';
        detN.textContent = 'Pauza mezi kurzy';
        detP.textContent = 'Při tempu každý druhý měsíc mají lidé čas vyzkoušené věci použít a probrat je v týmu.';
        return;
      }
      var o = p.o ? okruh(p.o) : null;
      detC.textContent = MESICE[p.m] + ' · ' + p.kurz + '. kurz' + (o ? ' · okruh ' + d2(o.c) : '');
      detN.textContent = o ? o.nazev : 'Okruh zatím nevybrán';
      detP.textContent = o ? o.popis : 'Vyberte okruh níže, kalendář se doplní sám.';
    };

    var vykresli = function () {
      planovac.setAttribute('data-rezim', String(rezim));
      var pl = plan();
      pl.forEach(function (p, i) {
        var d = dlazdice[i];
        var li = d.parentElement;
        li.className = 'mesic' + (p.volno ? ' volno' : (p.o ? '' : ' prazdny')) + (i === 0 ? ' prvni' : '');
        $('.mesic-n', d).textContent = MESICE[p.m];
        $('.mesic-c', d).textContent = p.volno ? '–' : (p.o ? d2(p.o) : '?');
        var o = p.o ? okruh(p.o) : null;
        $('.mesic-o', d).textContent = p.volno ? 'volný měsíc' : (o ? o.nazev : 'vyberte okruh');
        d.setAttribute('aria-label', MESICE[p.m] + ': ' + (p.volno ? 'volný měsíc' : (o ? p.kurz + '. kurz, okruh ' + o.c + ' ' + o.nazev : p.kurz + '. kurz, okruh nevybrán')));
      });
      chipy.forEach(function (b) {
        b.setAttribute('aria-pressed', vybrane6.indexOf(+b.getAttribute('data-c')) >= 0 ? 'true' : 'false');
      });
      prepinace.forEach(function (b) {
        var on = +b.getAttribute('data-rezim') === rezim;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      if (vyberBox) vyberBox.hidden = rezim === 12;
      napoveda.classList.remove('varovani');
      if (rezim === 12) {
        souhrn.innerHTML = '<b>12 kurzů</b> · všech 12 okruhů · od ' + MESICE_2[start] + ' · cena na dotaz';
      } else {
        var zbyva = 6 - vybrane6.length;
        napoveda.textContent = zbyva > 0 ? 'Vyberte ještě ' + zbyva + ' ' + sklon(zbyva) + '.' : 'Máte vybráno 6 okruhů. Jiný vyměníte tak, že nejdřív jeden odškrtnete.';
        souhrn.innerHTML = '<b>6 kurzů</b> · ' + vybrane6.length + ' / 6 okruhů vybráno · od ' + MESICE_2[start] + ' · cena na dotaz';
      }
      ukazDetail(Math.min(zvoleny, 11));
    };

    dlazdice.forEach(function (d, i) { d.addEventListener('click', function () { ukazDetail(i); }); });
    chipy.forEach(function (b) {
      var c = +b.getAttribute('data-c');
      b.addEventListener('click', function () {
        var k = vybrane6.indexOf(c);
        if (k >= 0) vybrane6.splice(k, 1);
        else if (vybrane6.length < 6) vybrane6.push(c);
        else {
          napoveda.textContent = 'Už máte 6 okruhů. Nejdřív jeden odškrtněte.';
          napoveda.classList.add('varovani');
          return;
        }
        vykresli();
      });
    });
    var nastavRezim = function (r) { rezim = r; zvoleny = 0; vykresli(); };
    prepinace.forEach(function (b, i) {
      b.addEventListener('click', function () { nastavRezim(+b.getAttribute('data-rezim')); });
      b.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var dalsi = prepinace[(i + 1) % prepinace.length];
        nastavRezim(+dalsi.getAttribute('data-rezim'));
        dalsi.focus();
      });
    });
    if (startSel) startSel.addEventListener('change', function () { start = +startSel.value; vykresli(); });

    var poptat = $('[data-poptat-plan]', planovac);
    if (poptat) poptat.addEventListener('click', function () {
      var ta = $('textarea[name="plan"]');
      if (!ta) return;
      var radky = ['Roční program – ' + (rezim === 12 ? 'každý měsíc (12 kurzů)' : 'každý druhý měsíc (6 kurzů)') + ', začátek: ' + MESICE[start]];
      plan().forEach(function (p) {
        if (p.volno) return;
        var o = p.o ? okruh(p.o) : null;
        radky.push(MESICE[p.m] + ': ' + (o ? d2(o.c) + ' ' + o.nazev : 'okruh upřesníme'));
      });
      ta.value = radky.join('\n');
      ta.rows = Math.min(radky.length, 13);
      var pole = ta.closest('.pole-plan');
      if (pole) pole.hidden = false;
      $$('input[name="zajem"][data-plan]').forEach(function (i) { i.checked = +i.getAttribute('data-plan') === rezim; });
    });
    vykresli();
  }
  var zrusit = $('.plan-zrusit');
  if (zrusit) zrusit.addEventListener('click', function () {
    var pole = zrusit.closest('.pole-plan');
    var ta = pole && $('textarea', pole);
    if (ta) ta.value = '';
    if (pole) pole.hidden = true;
    $$('input[name="zajem"][data-plan]').forEach(function (i) { i.checked = false; });
  });

  /* ---------- hledání v tématech ---------- */
  var hledat = $('[data-hledat]');
  if (hledat) {
    var temata = $$('[data-temata] .tema');
    var pocet = $('[data-pocet]');
    var nic = $('[data-nic]');
    var bezDiak = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var texty = temata.map(function (t) { return bezDiak(t.textContent); });
    var sklonT = function (n) { return n === 1 ? 'téma' : (n >= 2 && n <= 4 ? 'témata' : 'témat'); };
    hledat.addEventListener('input', function () {
      var q = bezDiak(hledat.value.trim());
      var slova = q.split(/\s+/).filter(Boolean);
      var n = 0;
      temata.forEach(function (t, i) {
        var ok = slova.every(function (s) { return texty[i].indexOf(s) >= 0; });
        t.hidden = !ok;
        if (ok) n++;
        if (slova.length && ok && n <= 1) t.open = true;
        if (!slova.length) t.open = false;
      });
      if (pocet) pocet.textContent = slova.length ? 'Nalezeno ' + n + ' ' + sklonT(n) : temata.length + ' témat';
      if (nic) nic.hidden = n > 0;
    });
  }

  /* ---------- formulář (demo) ---------- */
  $$('form.formular').forEach(function (f) {
    var stav = $('.formular-stav', f);
    f.addEventListener('submit', function (e) {
      var past = $('input[name="_gotcha"]', f);
      if (past && past.value) { e.preventDefault(); return; }
      if (f.getAttribute('data-demo') === '1') {
        e.preventDefault();
        if (stav) stav.textContent = 'Ukázka formuláře: nic se neodesílá. Po spuštění webu bude zpráva doručena na e-mail firmy.';
        return;
      }
      var endpoint = f.getAttribute('data-endpoint');
      if (!endpoint || !window.fetch) return;
      e.preventDefault();
      if (stav) stav.textContent = 'Odesílám…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          f.reset();
          if (stav) stav.textContent = 'Děkujeme, poptávka dorazila. Brzy se Vám ozveme.';
        })
        .catch(function () { if (stav) stav.textContent = 'Odeslání se nepovedlo. Napište nám prosím na e-mail.'; });
    });
  });
})();
