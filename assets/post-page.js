(function () {
  function readI18n() {
    var node = document.getElementById('post-i18n');
    try {
      return node ? JSON.parse(node.textContent) : {};
    } catch (error) {
      return {};
    }
  }

  function wrapTables() {
    document.querySelectorAll('.post-content table').forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains('table-scroll')) {
        return;
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function setupNewsletter(i18n) {
    var form = document.querySelector('[data-newsletter-form]');
    if (!form) {
      return;
    }

    var successMessage = form.querySelector('[data-newsletter-success]');
    var errorMessage = form.querySelector('[data-newsletter-error]');
    var submitButton = form.querySelector('.post-newsletter-submit');
    var buttonLabel = submitButton ? submitButton.textContent : '';

    function setBusy(busy) {
      if (!submitButton) return;
      submitButton.disabled = busy;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (errorMessage) errorMessage.hidden = true;
      setBusy(true);

      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      }).then(function (response) {
        if (!response.ok) {
          throw new Error(String(response.status));
        }
        return response.json().catch(function () {
          return {};
        });
      }).then(function (data) {
        if (data && data.status && data.status !== 'success') {
          throw new Error(data.status);
        }
        form.classList.add('is-success');
        if (submitButton) {
          submitButton.textContent = i18n.newsletterSuccess || buttonLabel;
        }
        if (successMessage) {
          successMessage.hidden = false;
        }
      }).catch(function () {
        setBusy(false);
        if (submitButton) {
          submitButton.textContent = i18n.newsletterButton || buttonLabel;
        }
        if (errorMessage) {
          errorMessage.hidden = false;
        }
      });
    });
  }

  function copyWithSelection(value) {
    var field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'absolute';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(field);
    return copied ? Promise.resolve() : Promise.reject();
  }

  function copyLink(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).catch(function () {
        return copyWithSelection(value);
      });
    }

    return copyWithSelection(value);
  }

  function setupCopyButton() {
    var button = document.querySelector('[data-share-copy]');
    if (!button) {
      return;
    }

    var text = button.querySelector('[data-share-copy-text]');
    var defaultLabel = text.textContent;
    var resetTimer;

    button.addEventListener('click', function () {
      copyLink(button.getAttribute('data-share-url')).then(function () {
        text.textContent = button.getAttribute('data-share-copied');
        button.classList.add('is-copied');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          text.textContent = defaultLabel;
          button.classList.remove('is-copied');
        }, 2000);
      });
    });
  }

  function loadApplause(share) {
    if (share.dataset.applauseLoaded) {
      return;
    }
    share.dataset.applauseLoaded = 'true';

    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = share.dataset.applauseCss;
    document.head.appendChild(stylesheet);

    var script = document.createElement('script');
    script.src = share.dataset.applauseJs;
    script.defer = true;
    document.head.appendChild(script);
  }

  function setupApplause() {
    var share = document.querySelector('[data-post-share]');
    if (!share || !share.dataset.applauseJs) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      loadApplause(share);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.disconnect();
          loadApplause(share);
        }
      });
    }, { rootMargin: '400px 0px' });
    observer.observe(share);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var i18n = readI18n();
    wrapTables();
    setupNewsletter(i18n);
    setupCopyButton();
    setupApplause();
  });
})();
