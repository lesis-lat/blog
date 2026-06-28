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
    var pagination = document.querySelector('[data-home-pagination]');
    var previousButton = document.querySelector('[data-pagination-prev]');
    var nextButton = document.querySelector('[data-pagination-next]');
    var paginationStatus = document.querySelector('[data-pagination-status]');
    var paginationStatusTemplate = paginationStatus
      ? paginationStatus.getAttribute('data-pagination-status-template')
      : '';

    if (!container || !input || !list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll('.post-card'));
    var postsPerPage = parseInt(list.getAttribute('data-posts-per-page'), 10);
    var currentPage = 1;

    if (!postsPerPage || postsPerPage < 1) {
      postsPerPage = 6;
    }

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

    function formatPaginationStatus(current, total) {
      return (paginationStatusTemplate || 'Page %{current} of %{total}')
        .replace('%{current}', String(current))
        .replace('%{total}', String(total));
    }

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

    function applyFilter(resetPage) {
      var query = normalizeText(input.value);
      var selectedCategory = getSelectedCategory();
      var matchingCards = [];

      if (resetPage) {
        currentPage = 1;
      }

      indexedCards.forEach(function (cardItem) {
        var matchesQuery = query === '' || cardItem.text.indexOf(query) !== -1;
        var matchesCategory = selectedCategory === '' || cardItem.category === selectedCategory;
        var matches = matchesQuery && matchesCategory;

        if (matches) {
          matchingCards.push(cardItem.element);
        }
      });

      var totalPages = Math.max(1, Math.ceil(matchingCards.length / postsPerPage));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      var startIndex = (currentPage - 1) * postsPerPage;
      var endIndex = startIndex + postsPerPage;

      cards.forEach(function (card) {
        card.hidden = true;
      });

      matchingCards.slice(startIndex, endIndex).forEach(function (card) {
        card.hidden = false;
      });

      if (emptyState) {
        emptyState.hidden = matchingCards.length !== 0;
      }

      if (pagination) {
        pagination.hidden = matchingCards.length <= postsPerPage;
      }

      if (paginationStatus) {
        paginationStatus.textContent = formatPaginationStatus(currentPage, totalPages);
      }

      if (previousButton) {
        previousButton.disabled = currentPage <= 1;
      }

      if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
      }
    }

    input.addEventListener('input', function () {
      applyFilter(true);
    });
    input.addEventListener('search', function () {
      applyFilter(true);
    });
    categoryTags.forEach(function (tag) {
      tag.addEventListener('click', function () {
        setActiveTag(tag);
        applyFilter(true);
      });
    });
    if (previousButton) {
      previousButton.addEventListener('click', function () {
        if (currentPage > 1) {
          currentPage -= 1;
          applyFilter(false);
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        currentPage += 1;
        applyFilter(false);
      });
    }

    applyFilter(true);
  }

  document.addEventListener('DOMContentLoaded', initHomeSearch);
})();
