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
    var categoryTags = Array.prototype.slice.call(
      document.querySelectorAll('.home-category-tag')
    );
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
        text: normalizeText(card.textContent),
        category: normalizeText(card.getAttribute('data-category'))
      };
    });

    function getSelectedCategory() {
      var activeTag = categoryTags.filter(function (tag) {
        return tag.classList.contains('is-active');
      })[0];
      return activeTag ? normalizeText(activeTag.getAttribute('data-category')) : '';
    }

    function setActiveTag(tag) {
      categoryTags.forEach(function (item) {
        var isActive = item === tag;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function applyFilter() {
      var query = normalizeText(input.value);
      var selectedCategory = getSelectedCategory();
      var visibleCount = 0;

      indexedCards.forEach(function (cardItem) {
        var matchesQuery = query === '' || cardItem.text.indexOf(query) !== -1;
        var matchesCategory = selectedCategory === '' || cardItem.category === selectedCategory;
        var matches = matchesQuery && matchesCategory;
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
    categoryTags.forEach(function (tag) {
      tag.addEventListener('click', function () {
        setActiveTag(tag);
        applyFilter();
      });
    });
    applyFilter();
  }

  document.addEventListener('DOMContentLoaded', initHomeSearch);
})();
