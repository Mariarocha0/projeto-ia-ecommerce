(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CARD = '[data-hook="review"]';

  if (!document.querySelector(CARD)) {
    return console.warn('⚠️ Nenhuma avaliação neste contexto. Abra a lista de avaliações (ou a modal) primeiro. Se for um iframe, selecione o contexto dele no seletor do topo do Console (onde aparece "top").');
  }

  // 0) Produto
  const getProduto = () => {
    const docs = [document];
    try { if (window.parent && window.parent.document !== document) docs.push(window.parent.document); } catch (e) {}
    try { if (window.top && window.top.document !== document) docs.push(window.top.document); } catch (e) {}

    for (const d of docs) {
      // página /product-reviews/...
      const link = d.querySelector('[data-hook="product-link"]')?.textContent.trim();
      if (link) return link;
      // página do produto
      const title = d.querySelector('#productTitle')?.textContent.trim();
      if (title) return title;
      const og = d.querySelector('meta[property="og:title"]')?.content?.trim();
      if (og) return og;
    }
    // fallback: <title> ("Amazon.com.br: Avaliações de clientes: Nome do produto")
    return document.title
      .replace(/^Amazon\.[a-z.]+\s*:\s*/i, '')
      .replace(/^(Avaliações de clientes|Customer reviews)\s*:\s*/i, '')
      .trim() || null;
  };
  const produto = getProduto();
  if (!produto) console.warn('⚠️ Não foi possível identificar o produto.');
  console.log('🛒 Produto:', produto);

  // 1) Rola o container até carregar tudo
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
    const ratingEl =
      card.querySelector('[data-hook="review-star-rating"], [data-hook="cmps-review-star-rating"]') || card;

    const txt = (ratingEl.querySelector('.a-icon-alt')?.textContent || ratingEl.textContent || '')
      .replace(/\u00a0/g, ' ');
    const m = txt.match(/(\d+(?:[.,]\d+)?)\s*de\s*5/i);
    if (m) return Number(m[1].replace(',', '.'));

    const cls = ratingEl.querySelector('[class*="a-star-"]')?.className || ratingEl.className || '';
    const m2 = cls.match(/a-star-(?:small-)?(\d)(?:-(\d))?/);
    if (m2) return Number(m2[2] ? `${m2[1]}.${m2[2]}` : m2[1]);

    return null;
  };

  // 3) Texto do comentário
  const getText = card => {
    const body = card.querySelector('[data-hook="review-body"]');
    if (!body) return '';
    const clone = body.cloneNode(true);
    clone.querySelectorAll('.a-expander-prompt, [data-hook="review-voting-widget"], button, script, style')
      .forEach(el => el.remove());
    return (clone.textContent || '').trim();
  };

  const limpar = t => t
    .replace(/\u00a0/g, ' ')
    .replace(/\s*Ler mais\s*$/i, '')
    .replace(/Avaliação\s*\d+\s*de\s*5/gi, '')
    .replace(/\d+(?:[.,]\d+)?\s*de\s*5\s*estrelas/gi, '')
    .replace(/Denunciar/gi, '')
    .replace(/\s+\n/g, '\n')
    .trim();

  // 4) Monta o resultado
  const reviews = [];
  const semNota = [];
  const cards = document.querySelectorAll(CARD);

  cards.forEach((card, i) => {
    const bruto = (card.innerText || '').toLowerCase();
    if (bruto.includes('opinião gerada por ia') || bruto.includes('resumo de opiniões')) return;

    const nota = getRating(card);
    const texto = limpar(getText(card));

    if (nota === null) semNota.push(i);
    reviews.push({
      fonte: 'Amazon',
      produto,
      stars: nota,
      review_text: texto,
    });
  });

  console.log(`📊 ${reviews.length} avaliações | ${semNota.length} sem nota`);
  if (semNota.length) {
    console.warn('Cards sem nota (índices):', semNota);
    console.log('HTML do primeiro sem nota:', cards[semNota[0]].outerHTML);
  }

  // 5) Download
  const slug = (produto || 'produto').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
  const a = document.createElement('a');
  a.download = `reviews_amazon_${slug}.json`;
  a.href = URL.createObjectURL(new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' }));
  a.click();
})();
