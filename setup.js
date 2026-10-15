(function (root) {
  const limits = Object.freeze({wolf:2, minion:1, seer:1, robber:1, trouble:1, insomniac:1, villager:8});

  function recommendedDeck(playerCount) {
    if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 8) {
      throw new RangeError('플레이어 수는 3명부터 8명까지 선택하세요.');
    }
    const deck = ['wolf', 'wolf', 'seer', 'robber', 'trouble', 'villager'];
    if (playerCount >= 4) deck.push('insomniac');
    if (playerCount >= 5) deck.push('minion');
    while (deck.length < playerCount + 3) deck.push('villager');
    return deck;
  }

  function validateDeck(playerCount, deck) {
    const required = playerCount + 3;
    const counts = {};
    let valid = Number.isInteger(playerCount) && playerCount >= 3 && playerCount <= 8;
    for (const role of deck) {
      counts[role] = (counts[role] || 0) + 1;
      if (!Object.hasOwn(limits, role) || counts[role] > limits[role]) valid = false;
    }
    return {valid:valid && deck.length === required, required, selected:deck.length, remaining:required - deck.length};
  }

  const api = Object.freeze({limits, recommendedDeck, validateDeck});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GameSetup = api;
})(globalThis);
