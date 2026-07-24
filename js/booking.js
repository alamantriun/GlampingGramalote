// ══════════════════════════════════════════════════════════════
//  BOOKING WIZARD — Sistema de reservas paso a paso
// ══════════════════════════════════════════════════════════════
let bkState = {
  step: 1,
  accommodation: '',
  checkin: null,
  checkout: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  selecting: 'checkin', // 'checkin' or 'checkout'
};

// ─── INTEGRACIÓN SUPABASE (API REST) & WOMPI ──────────────────────────────
const SEC = GlampingSecurity;
const SUPABASE_URL = 'https://jezkrdxmpkttckzxfayq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemtyZHhtcGt0dGNrenhmYXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjM5MzksImV4cCI6MjEwMDM5OTkzOX0.6xTM-NGS-P_yVhbMrg6M8yJvBAwCtSk4A75u2Ev6Flc';

function getSupabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

let bookedDates = []; // Se llenará desde Supabase

// Cargar SDK de Wompi (Opcional, para el futuro)
try {
  const wompiScript = document.createElement('script');
  wompiScript.src = 'https://checkout.wompi.co/widget.js';
  document.head.appendChild(wompiScript);
} catch (e) {
  console.error("Error cargando Wompi", e);
}

// Se llama automáticamente cuando el usuario selecciona un hospedaje
async function fetchBookedDates() {
  if (!bkState.accommodation || !SEC.isValidAccommodation(bkState.accommodation)) return;
  try {
    const filters = [
      'select=fecha_llegada,fecha_salida',
      'estado=neq.cancelado',
      SEC.buildEqFilter('hospedaje', bkState.accommodation)
    ].join('&');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas?${filters}`,
      { headers: getSupabaseHeaders() }
    );
      
    if (!res.ok) throw new Error('Error al consultar disponibilidad');
    const data = await res.json();
    
    // Procesar todos los rangos de fechas ocupados
    const newBookedDates = new Set();
    data.forEach(reserva => {
      let current = new Date(reserva.fecha_llegada + 'T00:00:00');
      const end = new Date(reserva.fecha_salida + 'T00:00:00');
      // No bloqueamos la fecha de salida exacta para que otro usuario pueda entrar ese mismo día
      while (current < end) {
        newBookedDates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });
    
    bookedDates = Array.from(newBookedDates);
    // Si estamos en el paso 2, re-renderizar calendario
    if (bkState.step === 2) renderCalendar();
    
  } catch (err) {
    console.error("Error obteniendo reservas:", err);
  }
}


function selectAccommodation(el, name) {
  if (!SEC.isValidAccommodation(name)) return;
  document.querySelectorAll('.bk-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  bkState.accommodation = name;
  document.getElementById('btn-to-step2').disabled = false;
  fetchBookedDates();
}

function goToStep(step) {
  // Validate before proceeding
  if (step === 2 && !bkState.accommodation) return;
  if (step === 3 && (!bkState.checkin || !bkState.checkout)) return;

  bkState.step = step;

  // Hide all panels
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById('bk-step-' + i);
    if (panel) panel.style.display = 'none';
  }

  // Show current panel
  const current = document.getElementById('bk-step-' + step);
  if (current) {
    current.style.display = 'block';
    current.style.animation = 'none';
    current.offsetHeight; // reflow
    current.style.animation = '';
  }

  // Update step indicators
  document.querySelectorAll('.step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sn === step) s.classList.add('active');
    else if (sn < step) s.classList.add('completed');
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('active', i < step - 1);
  });

  // Step-specific setup
  if (step === 2) {
    document.getElementById('selected-acc-label').textContent = bkState.accommodation;
    bkState.selecting = 'checkin';
    bkState.checkin = null;
    bkState.checkout = null;
    updateDateDisplays();
    renderCalendar();
  }
  if (step === 3) fillPaymentSummary();
  if (step === 4) fillConfirmSummary();

  // Scroll to top of section
  document.getElementById('reservar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Calendar ────────────────────────────────────────────────
const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function changeMonth(dir) {
  bkState.calMonth += dir;
  if (bkState.calMonth > 11) { bkState.calMonth = 0; bkState.calYear++; }
  if (bkState.calMonth < 0) { bkState.calMonth = 11; bkState.calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('bk-cal-days');
  const label = document.getElementById('bk-cal-month-label');
  if (!container || !label) return;

  label.textContent = monthNames[bkState.calMonth] + ' ' + bkState.calYear;
  container.innerHTML = '';

  const firstDay = new Date(bkState.calYear, bkState.calMonth, 1);
  let startDay = firstDay.getDay() - 1; // Monday = 0
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(bkState.calYear, bkState.calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'bk-day empty';
    container.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    btn.className = 'bk-day';
    btn.textContent = d;
    const dateObj = new Date(bkState.calYear, bkState.calMonth, d);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Past days
    if (dateObj < today) {
      btn.classList.add('disabled');
    }
    // Today
    else if (dateObj.getTime() === today.getTime()) {
      btn.classList.add('today');
    }
    // Booked days
    if (bookedDates.includes(dateStr)) {
      btn.classList.add('booked');
    }
    // Selected range
    if (bkState.checkin && dateStr === bkState.checkin.toISOString().split('T')[0]) {
      btn.classList.add('selected');
    }
    if (bkState.checkout && dateStr === bkState.checkout.toISOString().split('T')[0]) {
      btn.classList.add('selected');
    }
    if (bkState.checkin && bkState.checkout && dateObj > bkState.checkin && dateObj < bkState.checkout) {
      btn.classList.add('in-range');
    }

    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled') || btn.classList.contains('booked')) return;
      handleDayClick(dateObj);
    });

    container.appendChild(btn);
  }
}

function handleDayClick(dateObj) {
  if (bkState.selecting === 'checkin') {
    bkState.checkin = dateObj;
    bkState.checkout = null;
    bkState.selecting = 'checkout';
  } else {
    if (dateObj <= bkState.checkin) {
      bkState.checkin = dateObj;
      bkState.checkout = null;
      bkState.selecting = 'checkout';
    } else {
      // Check if any booked date falls in range
      const hasConflict = bookedDates.some(bd => {
        const bDate = new Date(bd + 'T00:00:00');
        return bDate >= bkState.checkin && bDate < dateObj;
      });
      if (hasConflict) {
        showAvailMsg('Las fechas seleccionadas incluyen días ocupados. Elige otro rango.', false);
        return;
      }
      bkState.checkout = dateObj;
      bkState.selecting = 'checkin';
    }
  }
  updateDateDisplays();
  renderCalendar();
}

function formatDate(d) {
  if (!d) return '—';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return day + '/' + month + '/' + d.getFullYear();
}

function updateDateDisplays() {
  document.getElementById('bk-checkin-display').textContent = bkState.checkin ? formatDate(bkState.checkin) : 'Selecciona en el calendario';
  document.getElementById('bk-checkout-display').textContent = bkState.checkout ? formatDate(bkState.checkout) : '—';

  let nights = 0;
  if (bkState.checkin && bkState.checkout) {
    nights = Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24));
  }
  document.getElementById('bk-nights-display').textContent = nights;

  const btn = document.getElementById('btn-to-step3');
  if (bkState.checkin && bkState.checkout && nights > 0) {
    btn.disabled = false;
    showAvailMsg('✅ ¡Fechas disponibles! ' + nights + ' noche' + (nights > 1 ? 's' : '') + ' seleccionada' + (nights > 1 ? 's' : '') + '.', true);
  } else {
    btn.disabled = true;
    document.getElementById('bk-availability-msg').className = 'bk-avail-msg';
    document.getElementById('bk-availability-msg').textContent = '';
  }
}

function showAvailMsg(text, available) {
  const el = document.getElementById('bk-availability-msg');
  el.textContent = text;
  el.className = 'bk-avail-msg ' + (available ? 'available' : 'unavailable');
}

function fillPaymentSummary() {
  const nights = bkState.checkin && bkState.checkout ? Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24)) : 0;
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const container = document.getElementById('bk-payment-summary');
  container.innerHTML = '';
  SEC.appendSafeParagraph(container, 'Hospedaje', bkState.accommodation || '—');
  SEC.appendSafeParagraph(container, 'Fechas', formatDate(bkState.checkin) + ' → ' + formatDate(bkState.checkout));
  SEC.appendSafeParagraph(container, 'Noches', String(nights));
  SEC.appendSafeParagraph(container, 'Personas', personas);
  const note = document.createElement('p');
  note.style.cssText = 'margin-top:0.5rem; font-size: 0.78rem; color: var(--gris-calido);';
  note.textContent = 'Consulta el precio exacto por WhatsApp antes de transferir.';
  container.appendChild(note);
}

function fillConfirmSummary() {
  const nights = bkState.checkin && bkState.checkout ? Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24)) : 0;
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const nombre = SEC.sanitizeText(document.getElementById('bk-nombre').value, 100) || '—';
  const container = document.getElementById('bk-confirm-summary');
  container.innerHTML = '';
  const fields = [
    ['Nombre', nombre],
    ['Hospedaje', bkState.accommodation || '—'],
    ['Llegada', formatDate(bkState.checkin)],
    ['Salida', formatDate(bkState.checkout)],
    ['Noches', String(nights)],
    ['Personas', personas]
  ];
  fields.forEach(([label, value]) => {
    const div = document.createElement('div');
    const lbl = document.createElement('label');
    lbl.textContent = label;
    const span = document.createElement('span');
    span.textContent = value;
    div.appendChild(lbl);
    div.appendChild(span);
    container.appendChild(div);
  });
}

async function iniciarPagoWompi() {
  const nombre = SEC.sanitizeText(document.getElementById('bk-nombre').value, 100);
  const telefono = SEC.normalizePhone(document.getElementById('bk-telefono').value);
  const mensaje = SEC.sanitizeText(document.getElementById('bk-mensaje').value, 500);
  const personasEl = document.getElementById('bk-personas');
  const personas = personasEl ? personasEl.value : '2';
  const nights = bkState.checkin && bkState.checkout ? Math.round((bkState.checkout - bkState.checkin) / (1000 * 60 * 60 * 24)) : 0;

  if (!SEC.isValidAccommodation(bkState.accommodation)) {
    alert('Selecciona un hospedaje válido.');
    goToStep(1);
    return;
  }
  if (!bkState.checkin || !bkState.checkout || nights < 1) {
    alert('Selecciona fechas válidas.');
    goToStep(2);
    return;
  }
  if (!SEC.isValidName(nombre)) {
    alert('Ingresa un nombre válido (solo letras, mínimo 2 caracteres).');
    goToStep(3);
    return;
  }
  if (!SEC.isValidPhone(telefono)) {
    alert('Ingresa un número de WhatsApp válido (10 dígitos).');
    goToStep(3);
    return;
  }
  if (!SEC.isValidPersonas(personas)) {
    alert('Selecciona un número de personas válido.');
    goToStep(2);
    return;
  }
  
  if (!nombre || !telefono) {
    alert('Por favor regresa al paso 3 e ingresa tu nombre y WhatsApp para poder contactarte.');
    return;
  }

  // Anti-Spam: Honeypot check
  const honeypot = document.getElementById('bk-honeypot');
  if (honeypot && honeypot.value !== '') {
    console.warn("Bot detectado (Honeypot llenado). Abortando.");
    return; // Silently reject
  }

  // Anti-Spam: Rate limiting (1 reserva cada 5 minutos por navegador)
  const lastResTime = localStorage.getItem('last_reservation_time');
  if (lastResTime) {
    const timeDiff = Date.now() - parseInt(lastResTime);
    if (timeDiff < 5 * 60 * 1000) { // 5 minutos
      alert('Has realizado demasiadas solicitudes recientes. Por favor espera unos minutos e intenta de nuevo.');
      return;
    }
  }

  const btn = document.getElementById('bk-wompi-btn');
  const errorLabel = document.getElementById('bk-wompi-error');
  btn.disabled = true;
  btn.querySelector('span') ? btn.querySelector('span').textContent = 'Enviando...' : btn.textContent = 'Enviando...';
  errorLabel.style.display = 'none';

  try {
    let insertId = 'PENDIENTE';
    
    const checkinStr = bkState.checkin.toISOString().split('T')[0];
    const checkoutStr = bkState.checkout.toISOString().split('T')[0];

    if (!SEC.isValidIsoDate(checkinStr) || !SEC.isValidIsoDate(checkoutStr)) {
      throw new Error('Fechas inválidas');
    }

    const overlapFilters = [
      'select=id',
      'estado=neq.cancelado',
      SEC.buildEqFilter('hospedaje', bkState.accommodation),
      SEC.buildDateFilter('fecha_llegada', 'lt', checkoutStr),
      SEC.buildDateFilter('fecha_salida', 'gt', checkinStr)
    ].join('&');

    const overlapRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas?${overlapFilters}`,
      { headers: getSupabaseHeaders() }
    );
    
    if (!overlapRes.ok) throw new Error('Error al verificar disponibilidad');
    const overlaps = await overlapRes.json();
    
    if (overlaps && overlaps.length > 0) {
      alert('⚠️ Lo sentimos, alguien más acaba de reservar esas fechas mientras completabas el formulario. Por favor, selecciona otras fechas.');
      btn.disabled = false;
      btn.textContent = 'Enviar comprobante por WhatsApp';
      await fetchBookedDates();
      goToStep(2);
      return;
    }

    // 2. Guardar en Supabase como 'pendiente'
    const newReservation = {
      hospedaje: bkState.accommodation,
      fecha_llegada: checkinStr,
      fecha_salida: checkoutStr,
      noches: nights,
      personas: personas,
      nombre_cliente: nombre,
      telefono_cliente: telefono,
      notas: mensaje,
      estado: 'pendiente'
    };

    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas`,
      {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify(newReservation)
      }
    );

    if (!insertRes.ok) throw new Error('Error al guardar la reserva');
    
    // Marcar tiempo para evitar spam
    localStorage.setItem('last_reservation_time', Date.now().toString());

    // To get the inserted ID we must fetch it. 
    // In PostgREST (Supabase), returning the inserted row is done by sending `Prefer: return=representation`.
    // My getSupabaseHeaders() already includes this!
    const insertedData = await insertRes.json();
    if (insertedData && insertedData.length > 0) {
      insertId = insertedData[0].id;
    }

    // 2. Construir mensaje de WhatsApp
    let msg = '🏕 *RESERVA - Glamping Culumpulos Gramalote*\n\n';
    msg += '📋 *Datos de la reserva:*\n';
    msg += '• *Hospedaje:* ' + bkState.accommodation + '\n';
    msg += '• *Llegada:* ' + formatDate(bkState.checkin) + '\n';
    msg += '• *Salida:* ' + formatDate(bkState.checkout) + '\n';
    msg += '• *Noches:* ' + nights + '\n';
    msg += '• *Personas:* ' + personas + '\n\n';
    msg += '👤 *Datos personales:*\n';
    msg += '• *Nombre:* ' + nombre + '\n';
    if (telefono) msg += '• *WhatsApp:* ' + telefono + '\n';
    if (mensaje) msg += '\n📝 *Notas:* ' + mensaje + '\n';
    msg += `\n*ID Reserva:* ${insertId}\n`;
    msg += '\n💰 *Adjunto mi comprobante de pago.*\n';
    msg += '¡Quedo atento a la confirmación de mi reserva para bloquear las fechas en la web! 🌿';

    // Abrir WhatsApp
    window.open('https://wa.me/573204201013?text=' + encodeURIComponent(msg), '_blank');
    
    btn.textContent = 'Enviado correctamente';
    btn.style.background = 'var(--verde-claro)';
    
    // Recargar fechas por si acaso, aunque no se bloquean hasta que el admin las apruebe
    await fetchBookedDates();
    
  } catch (err) {
    console.error("Error al crear la reserva", err);
    errorLabel.textContent = 'Error guardando en base de datos, intenta enviar por WhatsApp manualmente.';
    errorLabel.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Intentar de nuevo';
  }
}

