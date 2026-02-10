(function () {
  function normalizeText(value) {
    return (value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function initHomeSearch() {
    var container = document.querySelector('[data-home-search]');
    var input = document.getElementById('home-post-search');
    var list = document.querySelector('.post-list');
    var emptyState = document.getElementById('home-post-search-empty');

    if (!container || !input || !list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll('.post-card'));
    if (cards.length === 0) {
      return;
    }

    var indexedCards = cards.map(function (card) {
      return {
        element: card,
        text: normalizeText(card.textContent)
      };
    });

    function applyFilter() {
      var query = normalizeText(input.value);
      var visibleCount = 0;

      indexedCards.forEach(function (cardItem) {
        var matches = query === '' || cardItem.text.indexOf(query) !== -1;
        cardItem.element.hidden = !matches;
        if (matches) {
          visibleCount += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    }

    input.addEventListener('input', applyFilter);
    input.addEventListener('search', applyFilter);
    applyFilter();
  }

  document.addEventListener('DOMContentLoaded', initHomeSearch);
})();
