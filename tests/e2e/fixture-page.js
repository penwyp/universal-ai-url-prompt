'use strict';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildSlateLikeEditableMarkup(attributes, placeholderText) {
    const escapedPlaceholder = escapeHtml(placeholderText || 'Ask anything');
    return `<div data-e2e-input contenteditable="true" ${attributes}>
      <div data-slate-node="element">
        <span data-slate-node="text">
          <span data-slate-leaf="true">
            <span data-slate-zero-width="n" data-slate-length="0">\uFEFF<br></span>
            <span data-slate-placeholder="true" contenteditable="false">${escapedPlaceholder}</span>
          </span>
        </span>
      </div>
    </div>`;
}

function buildInputMarkup(siteCase) {
    if (siteCase.inputMode === 'contenteditable') {
        if (siteCase.requiresBeforeInputSync === true) {
            return buildSlateLikeEditableMarkup(siteCase.inputAttributes, siteCase.inputPlaceholder || '和文心一言聊聊');
        }
        return `<div data-e2e-input contenteditable="true" ${siteCase.inputAttributes}></div>`;
    }

    return `<textarea data-e2e-input ${siteCase.inputAttributes}></textarea>`;
}

function buildSendControlMarkup(siteCase) {
    const sendControlTag = siteCase.sendControlTag || 'button';
    const sendButtonAttributes = siteCase.sendButtonAttributes || 'aria-label="Send"';
    const sendButtonText = siteCase.sendButtonText || 'Send';

    if (sendControlTag === 'button') {
        return `<button data-e2e-send ${sendButtonAttributes}>${sendButtonText}</button>`;
    }

    return `<${sendControlTag} data-e2e-send ${sendButtonAttributes}>${sendButtonText}</${sendControlTag}>`;
}

function buildFixtureHtml(siteCase) {
    const beforeInputMarkup = typeof siteCase.beforeInputMarkup === 'string' ? siteCase.beforeInputMarkup : '';
    const inputMarkup = buildInputMarkup(siteCase);
    const sendControlMarkup = buildSendControlMarkup(siteCase);
    const useForm = siteCase.useForm !== false;
    const stripQueryOnLoad = siteCase.stripQueryOnLoad === true;
    const containerTag = useForm ? 'form' : 'div';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${siteCase.platform} Fixture</title>
  ${stripQueryOnLoad ? `<script>
    (function() {
      if (!window.location.search) return;
      const cleanUrl = window.location.pathname + window.location.hash;
      history.replaceState(history.state, '', cleanUrl);
    })();
  </script>` : ''}
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: sans-serif;
    }

    #chat-form {
      max-width: 720px;
    }

    textarea,
    [contenteditable="true"] {
      display: block;
      width: 100%;
      min-height: 140px;
      padding: 8px;
      border: 1px solid #bbb;
      border-radius: 8px;
      line-height: 1.4;
      box-sizing: border-box;
    }

    button {
      margin-top: 12px;
      padding: 10px 16px;
      border: 1px solid #333;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <${containerTag} id="chat-form">
    ${beforeInputMarkup}
    ${inputMarkup}
    ${sendControlMarkup}
  </${containerTag}>
  <script>
    (function() {
      const input = document.querySelector('[data-e2e-input]');
      const sendButton = document.querySelector('[data-e2e-send]');
      const form = document.querySelector('#chat-form');
      const toggleStopAfterSubmit = ${siteCase.toggleStopAfterSubmit === true};
      const preserveInputAfterSubmit = ${siteCase.preserveInputAfterSubmit === true};
      const abortOnResubmit = ${siteCase.abortOnResubmit === true};
      const ignoreSyntheticClick = ${siteCase.ignoreSyntheticClick === true};
      const requiresBeforeInputSync = ${siteCase.requiresBeforeInputSync === true};
      const sendEnableDelayMs = Math.max(0, Number(${JSON.stringify(siteCase.sendEnableDelayMs || 0)}) || 0);
      const slatePlaceholder = ${JSON.stringify(siteCase.inputPlaceholder || '和文心一言聊聊')};
      let hasSubmitted = false;
      let modelText = '';
      let delayedEnableReady = sendEnableDelayMs === 0;

      function setSendControlEnabled(enabled) {
        if (!sendButton) return;

        if ('disabled' in sendButton) {
          sendButton.disabled = !enabled;
        }

        if (enabled) {
          sendButton.removeAttribute('disabled');
          sendButton.setAttribute('aria-disabled', 'false');
          sendButton.setAttribute('data-disabled', 'false');
          sendButton.classList.remove('is-disabled', 'disabled');
          return;
        }

        sendButton.setAttribute('disabled', 'true');
        sendButton.setAttribute('aria-disabled', 'true');
        sendButton.setAttribute('data-disabled', 'true');
        sendButton.classList.add('is-disabled', 'disabled');
      }

      function syncSlateDomFromModel() {
        if (!requiresBeforeInputSync) return;
        if (!(input instanceof HTMLElement) || input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) return;

        if (modelText) {
          input.textContent = modelText;
          return;
        }

        input.innerHTML = '<div data-slate-node="element"><span data-slate-node="text"><span data-slate-leaf="true"><span data-slate-zero-width="n" data-slate-length="0">\\uFEFF<br></span><span data-slate-placeholder="true" contenteditable="false">' + slatePlaceholder + '</span></span></span></div>';
      }

      function updateSendButtonState() {
        if (!sendButton) return;
        const text = requiresBeforeInputSync ? modelText : readInputText();
        const hasText = String(text || '').trim().length > 0;
        const enabled = hasText && delayedEnableReady;
        setSendControlEnabled(enabled);
      }

      function readInputText() {
        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
          return input.value || '';
        }
        if (requiresBeforeInputSync) {
          return modelText;
        }
        return input.textContent || '';
      }

      function clearInput() {
        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
          input.value = '';
          return;
        }
        modelText = '';
        if (requiresBeforeInputSync) {
          syncSlateDomFromModel();
          updateSendButtonState();
          return;
        }
        input.textContent = '';
      }

      function getButtonActionLabel(button) {
        if (!button) return '';
        return [
          button.getAttribute('aria-label'),
          button.getAttribute('title'),
          button.textContent
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
      }

      function isStopActionButton(button) {
        const label = getButtonActionLabel(button);
        return /stop|cancel|abort|停止|终止|取消/.test(label);
      }

      function switchButtonToStopState() {
        if (!sendButton) return;
        sendButton.setAttribute('aria-label', 'Stop generating');
        sendButton.setAttribute('title', 'Stop generating');
        sendButton.textContent = 'Stop';
      }

      function recordSubmit(source) {
        if (hasSubmitted) {
          if (abortOnResubmit) {
            window.__e2e.resubmitAbortCount += 1;
            window.__e2e.conversationStopped = true;
          }
          return;
        }
        hasSubmitted = true;
        window.__e2e.sentCount += 1;
        window.__e2e.lastSource = source;
        window.__e2e.lastSubmittedText = readInputText();
        if (!preserveInputAfterSubmit) {
          clearInput();
        }
        if (toggleStopAfterSubmit) {
          switchButtonToStopState();
        }
      }

      window.__e2e = {
        sentCount: 0,
        lastSource: '',
        lastSubmittedText: '',
        sendButtonClickCount: 0,
        disabledClickIgnoredCount: 0,
        resubmitAbortCount: 0,
        stopButtonClickCount: 0,
        syntheticClickIgnoredCount: 0,
        sendEnabledAt: sendEnableDelayMs > 0 ? 0 : Date.now(),
        conversationStopped: false
      };

      if (sendEnableDelayMs > 0) {
        setSendControlEnabled(false);
        setTimeout(function() {
          delayedEnableReady = true;
          window.__e2e.sendEnabledAt = Date.now();
          updateSendButtonState();
        }, sendEnableDelayMs);
      }

      if (requiresBeforeInputSync) {
        updateSendButtonState();
      } else if (sendEnableDelayMs > 0) {
        input.addEventListener('input', function() {
          updateSendButtonState();
        });
      }

      if (requiresBeforeInputSync) {
        input.addEventListener('beforeinput', function(event) {
          if (event.inputType && event.inputType.startsWith('delete')) {
            modelText = '';
          } else if (typeof event.data === 'string' && event.data.length > 0) {
            modelText = event.data;
          }
          syncSlateDomFromModel();
          updateSendButtonState();
        });
      }

      sendButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (ignoreSyntheticClick && event.isTrusted === false) {
          window.__e2e.syntheticClickIgnoredCount += 1;
          return;
        }
        if (
          sendButton.getAttribute('aria-disabled') === 'true'
          || sendButton.getAttribute('data-disabled') === 'true'
          || sendButton.disabled === true
        ) {
          window.__e2e.disabledClickIgnoredCount += 1;
          return;
        }
        if (isStopActionButton(sendButton)) {
          window.__e2e.stopButtonClickCount += 1;
          window.__e2e.conversationStopped = true;
          return;
        }
        window.__e2e.sendButtonClickCount += 1;
        recordSubmit('button');
      });

      if (form.tagName === 'FORM') {
        form.addEventListener('submit', function(event) {
          event.preventDefault();
          recordSubmit('form');
        });
      }

      input.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        recordSubmit('enter');
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = {
    buildFixtureHtml
};
