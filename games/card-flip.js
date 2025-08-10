// games/card-flip.js
export function startGame(config, container) {
  // Title
  const title = document.createElement('h2');
  title.textContent = config.title || 'Card Flip';
  title.style.textAlign = 'center';
  container.appendChild(title);

  // Cards wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'cards-wrapper';

  // create cards (use frontImage path if you later want to show)
  config.cards.forEach(cardData => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', cardData.id);

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    // optional: could set background-image of front/back using provided images

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.innerHTML = `<div class="card-text">${escapeHtml(cardData.message)}</div>`;

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener('click', () => {
      // flip visually
      card.classList.add('flipped');
      // optional: fire callback / analytics
      // allow user to read and then unflip after a delay
      const stay = (config.settings && config.settings.stayOpen) || false;
      if (!stay) {
        setTimeout(() => card.classList.remove('flipped'), (config.settings && config.settings.displayMs) || 2500);
      }
    });

    wrapper.appendChild(card);
  });

  container.appendChild(wrapper);
}

// simple html escape
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
