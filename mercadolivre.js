(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CARD = '.ui-review-capability-comments__comment';

  if (!document.querySelector(CARD)) {
    return console.warn('⚠️ Nenhuma avaliação neste contexto. Se a modal for um iframe, selecione o contexto dele no seletor do topo do Console (onde aparece "top").');
  }

  // 0) Produto
  const getProduto = () => {
    const docs = [document];
    try { if (window.parent && window.parent.document !== document) docs.push(window.parent.document); } catch (e) {}
    try { if (window.top && window.top.document !== document) docs.push(window.top.document); } catch (e) {}

    for (const d of docs) {
      const h1 = d.querySelector('h1.ui-pdp-title, h1[class*="ui-pdp-title"]')?.textContent.trim();
      if (h1) return h1;
      const og = d.querySelector('meta[property="og:title"]')?.content?.trim();
      if (og) return og.replace(/\s*[|\-–]\s*Mercado\s*Livre.*$/i, '').trim();
    }
    return document.title.replace(/\s*[|\-–]\s*Mercado\s*Livre.*$/i, '').trim() || null;
  };
  const produto = getProduto();
  if (!produto) console.warn('⚠️ Não foi possível identificar o produto.');
  console.log('🛒 Produto:', produto);

  // 1) Rola a modal até carregar tudo
  let scroller = document.querySelector(CARD).parentElement;
  while (scroller && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
  scroller = scroller || document.scrollingElement;

  let prev = 0, semNovos = 0;
  while (semNovos < 3) {
    scroller.scrollTop = scroller.scrollHeight;
    await sleep(1200);
    const n = document.querySelectorAll(CARD).length;
    semNovos = n === prev ? semNovos + 1 : 0;
    prev = n;
  }

  // 2) Nota
  const getRating = card => {
    const ratingEl = card.querySelector('[class*="comment__rating"]') || card;

    const txt = (ratingEl.querySelector('.andes-visually-hidden')?.textContent || ratingEl.textContent || '')
      .replace(/\u00a0/g, ' ');
    const m = txt.match(/(\d+(?:[.,]\d+)?)\s*de\s*5/i);
    if (m) return Number(m[1].replace(',', '.'));

    const filled = [...ratingEl.querySelectorAll('use')].filter(u =>
      /#poly_star_fill/.test(u.getAttribute('href') || u.getAttribute('xlink:href') || '')
    ).length;
    return filled || null;
  };

  // 3) Texto do comentário
  const getText = card => {
    const clone = card.cloneNode(true);
    clone.querySelectorAll('[class*="comment__rating"], .andes-visually-hidden, svg, button, [class*="date"], [class*="useful"], [class*="report"]')
      .forEach(el => el.remove());

    const content = clone.querySelector('[class*="comment__content"], [class*="comment__text"]');
    if (content) return content.innerText.trim();

    const ps = [...clone.querySelectorAll('p')].map(p => p.innerText.trim()).filter(Boolean);
    return (ps.sort((a, b) => b.length - a.length)[0] || clone.innerText).trim();
  };

  const limpar = t => t
    .replace(/\u00a0/g, ' ')
    .replace(/Avaliação\s*\d+\s*de\s*5/gi, '')
    .replace(/Classificado com \d.*/gi, '')
    .replace(/Brasil\s*Há mais de \d+ (ano|anos|mês|meses|dia|dias)/gi, '')
    .replace(/Denunciar/gi, '')
    .trim();

  // 4) Monta o resultado
  const reviews = [];
  const semNota = [];

  document.querySelectorAll(CARD).forEach((card, i) => {
    const bruto = (card.innerText || '').toLowerCase();
    if (bruto.includes('opinião gerada por ia') || bruto.includes('resumo de opiniões')) return;

    const nota = getRating(card);
    const texto = limpar(getText(card));

    if (nota === null) semNota.push(i);
    reviews.push({
      fonte: 'Mercado Livre',
      produto,
      stars: nota,
      review_text: texto,
    });
  });

  console.log(`📊 ${reviews.length} avaliações | ${semNota.length} sem nota`);
  if (semNota.length) {
    console.warn('Cards sem nota (índices):', semNota);
    console.log('HTML do primeiro sem nota:', document.querySelectorAll(CARD)[semNota[0]].outerHTML);
  }

  // 5) Download
  const slug = (produto || 'produto').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
  const a = document.createElement('a');
  a.download = `reviews_mercadolivre_${slug}.json`;
  a.href = URL.createObjectURL(new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' }));
  a.click();
})();
