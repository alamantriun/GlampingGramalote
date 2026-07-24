/**
 * Utilidades de seguridad — Glamping Culumpulos
 * Protección contra XSS, inyección en filtros PostgREST y datos inválidos.
 */
(function (global) {
  'use strict';

  const ALLOWED_ACCOMMODATIONS = Object.freeze([
    'Domo Glamping',
    'Zona Camping',
    'Plan Romántico'
  ]);

  const ALLOWED_ESTADOS = Object.freeze(['pendiente', 'pagado', 'cancelado']);

  const ALLOWED_PERSONAS = Object.freeze(['1', '2', '3', '4', '5+']);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeText(str, maxLen) {
    if (str == null) return '';
    let s = String(str).trim();
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
    return s;
  }

  function isValidUuid(id) {
    return typeof id === 'string' && UUID_RE.test(id);
  }

  function isValidIsoDate(dateStr) {
    if (!ISO_DATE_RE.test(dateStr)) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function isValidAccommodation(name) {
    return ALLOWED_ACCOMMODATIONS.includes(name);
  }

  function isValidEstado(estado) {
    return ALLOWED_ESTADOS.includes(estado);
  }

  function isValidPersonas(value) {
    return ALLOWED_PERSONAS.includes(String(value));
  }

  function isValidName(name) {
    const n = sanitizeText(name, 100);
    return n.length >= 2 && n.length <= 100 && /^[\p{L}\p{M}\s'.-]+$/u.test(n);
  }

  function isValidPhone(phone) {
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  }

  function normalizePhone(phone) {
    return String(phone).replace(/\D/g, '').slice(0, 12);
  }

  /** Construye un filtro PostgREST seguro (evita inyección de operadores). */
  function buildEqFilter(field, value) {
    const safeFields = {
      hospedaje: ALLOWED_ACCOMMODATIONS,
      estado: ALLOWED_ESTADOS,
      id: null
    };
    if (!Object.prototype.hasOwnProperty.call(safeFields, field)) {
      throw new Error('Campo de filtro no permitido: ' + field);
    }
    if (field === 'id') {
      if (!isValidUuid(value)) throw new Error('ID inválido');
      return 'id=eq.' + value;
    }
    const allowed = safeFields[field];
    if (!allowed.includes(value)) throw new Error('Valor de filtro no permitido');
    return field + '=eq.' + encodeURIComponent(value);
  }

  function buildDateFilter(field, op, dateStr) {
    const safeDateFields = ['fecha_llegada', 'fecha_salida'];
    const safeOps = ['lt', 'gt', 'eq', 'lte', 'gte'];
    if (!safeDateFields.includes(field) || !safeOps.includes(op)) {
      throw new Error('Filtro de fecha no permitido');
    }
    if (!isValidIsoDate(dateStr)) throw new Error('Fecha inválida');
    return field + '=' + op + '.' + dateStr;
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function setSafeHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text == null ? '' : String(text);
  }

  function appendSafeParagraph(container, label, value) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = label + ': ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(value));
    container.appendChild(p);
  }

  global.GlampingSecurity = {
    ALLOWED_ACCOMMODATIONS,
    ALLOWED_ESTADOS,
    ALLOWED_PERSONAS,
    escapeHtml,
    sanitizeText,
    isValidUuid,
    isValidIsoDate,
    isValidAccommodation,
    isValidEstado,
    isValidPersonas,
    isValidName,
    isValidPhone,
    normalizePhone,
    buildEqFilter,
    buildDateFilter,
    sha256,
    setSafeHtml,
    setText,
    appendSafeParagraph
  };
})(typeof window !== 'undefined' ? window : globalThis);
