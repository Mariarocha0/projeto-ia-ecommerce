(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CARD = '.ui-review-capability-comments__comment';

  if (!document.querySelector(CARD)) {
    return console.warn('⚠️ Nenhuma avaliação neste contexto. Se a modal for um iframe, selecione o contexto dele no seletor do topo do Console (onde aparece "top").');
  }

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

    // A) texto oculto "Avaliação X de 5"
    const txt = (ratingEl.querySelector('.andes-visually-hidden')?.textContent || ratingEl.textContent || '')
      .replace(/\u00a0/g, ' ');
    const m = txt.match(/(\d+(?:[.,]\d+)?)\s*de\s*5/i);
    if (m) return Number(m[1].replace(',', '.'));

    // B) conta estrelas preenchidas SÓ dentro do bloco de nota
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

    // prefere o bloco de conteúdo; senão, o maior <p>
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
      stars: nota,          // número, ou null se realmente não achou
      review_text: texto,
    });
  });

  console.log(`📊 ${reviews.length} avaliações | ${semNota.length} sem nota`);
  if (semNota.length) {
    console.warn('Cards sem nota (índices):', semNota);
    console.log('HTML do primeiro sem nota:', document.querySelectorAll(CARD)[semNota[0]].outerHTML);
  }

  // 5) Download
  const a = document.createElement('a');
  a.download = 'reviews_mercadolivre.json';
  a.href = URL.createObjectURL(new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' }));
  a.click();
})();