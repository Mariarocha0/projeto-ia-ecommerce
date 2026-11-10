

(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CARD = '[data-hook="review"]';

  if (!document.querySelector(CARD)) {
    return console.warn('⚠️ Nenhuma avaliação neste contexto. Abra a lista de avaliações (ou a modal) primeiro. Se for um iframe, selecione o contexto dele no seletor do topo do Console (onde aparece "top").');
  }

  // 1) Rola o container até carregar tudo (modal / lista com carregamento dinâmico)
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

    // A) texto oculto "5,0 de 5 estrelas" (textContent funciona mesmo com o texto escondido)
    const txt = (ratingEl.querySelector('.a-icon-alt')?.textContent || ratingEl.textContent || '')
      .replace(/\u00a0/g, ' ');
    const m = txt.match(/(\d+(?:[.,]\d+)?)\s*de\s*5/i);
    if (m) return Number(m[1].replace(',', '.'));

    // B) classe da estrela: a-star-5, a-star-4-5 etc.
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
      stars: nota,          // número, ou null se realmente não achou
      review_text: texto,
    });
  });

  console.log(`📊 ${reviews.length} avaliações | ${semNota.length} sem nota`);
  if (semNota.length) {
    console.warn('Cards sem nota (índices):', semNota);
    console.log('HTML do primeiro sem nota:', cards[semNota[0]].outerHTML);
  }

  // 5) Download
  const a = document.createElement('a');
  a.download = 'reviews_amazon.json';
  a.href = URL.createObjectURL(new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' }));
  a.click();
})();