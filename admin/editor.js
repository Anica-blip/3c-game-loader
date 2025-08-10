document.getElementById('generateConfig').addEventListener('click', () => {
  const messages = document.getElementById('cardMessages').value.split('\n').filter(Boolean);
  
  const config = {
    gameType: "card-flip",
    theme: "theme1",
    title: "Pick Your 3C Card",
    cards: messages.map((msg, index) => ({
      id: index + 1,
      frontImage: `card${index + 1}.png`,
      message: msg
    })),
    settings: { cardFlipSpeed: 500, allowReplay: true }
  };

  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "card-flip.json";
  a.click();
});
