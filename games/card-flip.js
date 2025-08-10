export function startGame(config, container) {
  container.innerHTML = '';
  const cardsWrapper = document.createElement('div');
  cardsWrapper.style.display = 'flex';
  cardsWrapper.style.flexWrap = 'wrap';
  cardsWrapper.style.justifyContent = 'center';

  config.cards.forEach(cardData => {
    const card = document.createElement('div');
    card.classList.add('card');

    card.addEventListener('click', () => {
      alert(cardData.message);
    });

    cardsWrapper.appendChild(card);
  });

  container.appendChild(cardsWrapper);
}
