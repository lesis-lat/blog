(function () {
  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function uniqueId(base, used) {
    var cleanBase = base || 'section';
    if (!used[cleanBase]) {
      used[cleanBase] = 1;
      return cleanBase;
    }

    var index = used[cleanBase];
    used[cleanBase] += 1;
    return cleanBase + '-' + index;
  }

  function buildToc() {
    var content = document.querySelector('.post-content');
    var toc = document.querySelector('.post-toc');
    var tocList = document.getElementById('post-toc-list');

    if (!content || !toc || !tocList) {
      return;
    }

    var headings = Array.prototype.slice.call(
      content.querySelectorAll('h2, h3')
    ).filter(function (heading) {
      return heading.textContent && heading.textContent.trim().length > 0;
    });

    if (headings.length === 0) {
      return;
    }

    var usedIds = {};
    headings.forEach(function (heading) {
      if (!heading.id) {
        heading.id = uniqueId(slugify(heading.textContent), usedIds);
      } else if (usedIds[heading.id]) {
        heading.id = uniqueId(heading.id, usedIds);
      } else {
        usedIds[heading.id] = 1;
      }

      var item = document.createElement('li');
      item.className = 'post-toc-item level-' + heading.tagName.toLowerCase();

      var link = document.createElement('a');
      link.className = 'post-toc-link';
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();

      item.appendChild(link);
      tocList.appendChild(item);
    });

    var links = Array.prototype.slice.call(
      tocList.querySelectorAll('.post-toc-link')
    );

    function setActiveHeading() {
      var currentId = headings[0].id;
      var offset = window.scrollY + 145;

      headings.forEach(function (heading) {
        if (heading.offsetTop <= offset) {
          currentId = heading.id;
        }
      });

      links.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + currentId;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var ticking = false;
    function handleScroll() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(function () {
        setActiveHeading();
        ticking = false;
      });
    }

    toc.classList.remove('is-hidden');
    setActiveHeading();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
  }

  document.addEventListener('DOMContentLoaded', buildToc);
})();
