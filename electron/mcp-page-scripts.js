const serialize = (value) => JSON.stringify(value);

const buildDomScript = (mode, payload = {}) => `
(() => {
  const mode = ${serialize(mode)};
  const input = ${serialize(payload)};
  const uidAttr = 'data-blackmind-mcp-id';

  const ensureUid = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }
    let uid = element.getAttribute(uidAttr);
    if (!uid) {
      uid = 'mcp-' + Math.random().toString(36).slice(2, 10);
      element.setAttribute(uidAttr, uid);
    }
    return uid;
  };

  const resolveElement = (descriptor = {}) => {
    if (descriptor.uid) {
      const byUid = document.querySelector('[' + uidAttr + '="' + descriptor.uid + '"]');
      if (byUid) return byUid;
    }
    if (descriptor.selector) {
      return document.querySelector(descriptor.selector);
    }
    return null;
  };

  const isVisible = (element) => {
    if (!(element instanceof Element)) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0
      && rect.height > 0
      && style.visibility !== 'hidden'
      && style.display !== 'none';
  };

  const getText = (element) => {
    if (!(element instanceof Element)) {
      return '';
    }
    const value = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim();
    return value.slice(0, 400);
  };

  const getLabel = (element) => {
    if (!(element instanceof Element)) {
      return '';
    }
    const aria = element.getAttribute('aria-label');
    if (aria) return aria.trim();
    if (element instanceof HTMLInputElement && element.labels?.length) {
      return Array.from(element.labels).map((label) => label.innerText.trim()).filter(Boolean).join(' ');
    }
    return '';
  };

  const summarizeElement = (element) => {
    if (!(element instanceof Element)) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    const attrs = ['id', 'name', 'type', 'role', 'placeholder', 'href', 'src', 'value']
      .reduce((acc, key) => {
        const value = element.getAttribute(key);
        if (value) acc[key] = value;
        return acc;
      }, {});
    const summary = {
      uid: ensureUid(element),
      tag: element.tagName.toLowerCase(),
      text: getText(element),
      label: getLabel(element),
      visible: isVisible(element),
      attributes: attrs,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        centerX: Math.round(rect.left + rect.width / 2),
        centerY: Math.round(rect.top + rect.height / 2),
      },
    };
    window.__blackmindMcpSelectedElement = summary;
    return summary;
  };

  const getInteractiveElements = () => {
    const selector = [
      'a',
      'button',
      'input',
      'textarea',
      'select',
      'option',
      '[role="button"]',
      '[role="link"]',
      '[role="textbox"]',
      '[role="tab"]',
      '[contenteditable="true"]',
      'summary',
      'label',
    ].join(',');
    return Array.from(document.querySelectorAll(selector))
      .filter((element) => isVisible(element))
      .slice(0, Number.isFinite(input.limit) ? input.limit : 300)
      .map((element) => summarizeElement(element));
  };

  if (mode === 'point-select') {
    const element = document.elementFromPoint(Number(input.x) || 0, Number(input.y) || 0);
    return summarizeElement(element);
  }

  if (mode === 'snapshot') {
    return {
      title: document.title,
      url: location.href,
      selectedElement: window.__blackmindMcpSelectedElement || null,
      elements: getInteractiveElements(),
    };
  }

  if (mode === 'element-summary') {
    const element = resolveElement(input);
    if (!element) {
      return null;
    }
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    return summarizeElement(element);
  }

  if (mode === 'fill') {
    const element = resolveElement(input);
    if (!element) {
      throw new Error('Element not found');
    }
    element.focus();
    if (element instanceof HTMLSelectElement) {
      element.value = String(input.value ?? '');
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return summarizeElement(element);
    }
    if ('value' in element) {
      element.value = String(input.value ?? '');
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return summarizeElement(element);
    }
    throw new Error('Element does not support fill');
  }

  if (mode === 'fill-form') {
    const results = [];
    for (const field of Array.isArray(input.fields) ? input.fields : []) {
      const element = resolveElement(field);
      if (!element) {
        results.push({ ok: false, selector: field.selector || null, uid: field.uid || null });
        continue;
      }
      element.focus();
      if (element instanceof HTMLSelectElement) {
        element.value = String(field.value ?? '');
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if ('value' in element) {
        element.value = String(field.value ?? '');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      results.push({ ok: true, element: summarizeElement(element) });
    }
    return results;
  }

  if (mode === 'type-text') {
    const target = document.activeElement;
    if (!(target instanceof Element) || !('value' in target)) {
      throw new Error('No active input element');
    }
    target.value = String(target.value || '') + String(input.text || '');
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return summarizeElement(target);
  }

  if (mode === 'wait-for') {
    const timeoutMs = Number(input.timeoutMs) || 10000;
    const pollMs = Number(input.pollMs) || 100;
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (input.selector) {
          const element = document.querySelector(input.selector);
          if (element && (!input.text || getText(element).includes(String(input.text)))) {
            clearInterval(timer);
            resolve(summarizeElement(element));
            return;
          }
        }
        if (input.text && document.body && getText(document.body).includes(String(input.text))) {
          clearInterval(timer);
          resolve({ textFound: String(input.text) });
          return;
        }
        if (Date.now() - startedAt > timeoutMs) {
          clearInterval(timer);
          reject(new Error('Timeout waiting for selector/text'));
        }
      }, pollMs);
    });
  }

  if (mode === 'get-selected-element') {
    return window.__blackmindMcpSelectedElement || null;
  }

  throw new Error('Unsupported DOM script mode: ' + mode);
})()
`;

module.exports = {
  buildDomScript,
};
