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

  function collectHeadings(content) {
    return Array.prototype.slice
      .call(content.querySelectorAll('h2, h3'))
      .filter(function (heading) {
        return heading.textContent && heading.textContent.trim().length > 0;
      });
  }

  function ensureHeadingIds(headings) {
    var usedIds = {};
    headings.forEach(function (heading) {
      if (!heading.id) {
        heading.id = uniqueId(slugify(heading.textContent), usedIds);
      } else if (usedIds[heading.id]) {
        heading.id = uniqueId(heading.id, usedIds);
      } else {
        usedIds[heading.id] = 1;
      }
    });
  }

  function buildToc(content, headings) {
    var toc = document.querySelector('.post-toc');
    var tocList = document.getElementById('post-toc-list');

    if (!toc || !tocList || headings.length === 0) {
      return;
    }

    headings.forEach(function (heading) {
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

  function findPreviousHeading(element) {
    var current = element.previousElementSibling;
    while (current) {
      if (current.matches && current.matches('h2, h3')) {
        return current;
      }
      current = current.previousElementSibling;
    }

    var parent = element.parentElement;
    while (parent && parent.classList && !parent.classList.contains('post-content')) {
      current = parent.previousElementSibling;
      while (current) {
        if (current.matches && current.matches('h2, h3')) {
          return current;
        }
        var nestedHeading = current.querySelector
          ? current.querySelector('h2:last-of-type, h3:last-of-type')
          : null;
        if (nestedHeading) {
          return nestedHeading;
        }
        current = current.previousElementSibling;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  function buildSectionNotes(content) {
    var sideNotes = document.querySelector('.post-side-notes');
    var sideNotesList = document.getElementById('post-side-notes-list');
    var footerNotes = document.querySelector('.post-footer-notes');
    var footerNotesList = document.getElementById('post-footer-notes-list');
    var i18n = window.POST_NOTE_I18N || {};
    var noteLabel = i18n.noteLabel || 'Note';
    var backLabel = i18n.backToSection || 'Back to section';

    if (!sideNotes || !sideNotesList || !footerNotes || !footerNotesList) {
      return;
    }

    var rawNotes = Array.prototype.slice.call(
      content.querySelectorAll('.section-footer-note')
    );

    if (rawNotes.length === 0) {
      return;
    }

    var noteIndex = 0;
    rawNotes.forEach(function (note) {
      var heading = findPreviousHeading(note);
      if (!heading) {
        return;
      }

      noteIndex += 1;
      var sectionId = heading.id || slugify(heading.textContent);
      heading.id = sectionId;
      var markerId = 'post-note-marker-' + noteIndex;
      var noteId = 'post-note-' + noteIndex;

      var marker = document.createElement('sup');
      marker.className = 'post-note-marker';
      var markerLink = document.createElement('a');
      markerLink.className = 'post-note-marker-link';
      markerLink.id = markerId;
      markerLink.href = '#' + noteId;
      markerLink.setAttribute('aria-label', noteLabel + ' ' + noteIndex);
      markerLink.textContent = '[' + noteIndex + ']';
      marker.appendChild(markerLink);
      heading.appendChild(marker);

      var sideItem = document.createElement('article');
      sideItem.className = 'post-side-note-item';
      sideItem.innerHTML =
        '<p class="post-side-note-title">' +
        noteLabel +
        ' ' +
        noteIndex +
        '</p>' +
        '<div class="post-side-note-content">' +
        note.innerHTML +
        '</div>';
      sideNotesList.appendChild(sideItem);

      var footerItem = document.createElement('li');
      footerItem.className = 'post-footer-note-item';
      footerItem.id = noteId;

      var footerContent = document.createElement('div');
      footerContent.innerHTML = note.innerHTML;
      footerItem.appendChild(footerContent);

      var backLink = document.createElement('a');
      backLink.className = 'post-footer-note-backlink';
      backLink.href = '#' + markerId;
      backLink.textContent = backLabel;
      footerItem.appendChild(backLink);

      footerNotesList.appendChild(footerItem);
      note.parentNode.removeChild(note);
    });

    if (noteIndex > 0) {
      sideNotes.classList.remove('is-hidden');
      footerNotes.classList.remove('is-hidden');
    }
  }

  function buildReadingHelpers() {
    var content = document.querySelector('.post-content');
    if (!content) {
      return;
    }

    var headings = collectHeadings(content);
    if (headings.length > 0) {
      ensureHeadingIds(headings);
      buildToc(content, headings);
    }
    buildSectionNotes(content);
  }

  document.addEventListener('DOMContentLoaded', buildReadingHelpers);
})();
