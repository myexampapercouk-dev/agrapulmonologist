/**
 * Appointment form → email, for agrapulmonologist.com
 *
 * Runs inside YOUR Google account (script.google.com). Emails are sent from
 * your Gmail to TO_EMAIL below. No app password is needed.
 *
 * Setup:
 *   1. Go to https://script.google.com → New project, paste this whole file.
 *   2. TO_EMAIL is the clinic owner's inbox; change it only if that address changes.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as: Me        Who has access: Anyone
 *   4. Approve the permissions, then copy the Web app URL (ends in /exec)
 *      and paste it into APPOINTMENT_URL in index.html.
 *   After editing this script later: Deploy → Manage deployments → Edit →
 *   Version "New version" → Deploy (the URL stays the same).
 */

const TO_EMAIL = 'niramayacareceter@gmail.com'; // clinic owner's inbox — receives every request
const SENDER_NAME = 'Agra Pulmonologist Website';

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot field: people never fill it, spam bots usually do.
    if (d.website) return out({ ok: true });

    const clean = (v, max) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
    const f = {
      name: clean(d.name, 100),
      email: clean(d.email, 150),
      phone: clean(d.phone, 30),
      date: clean(d.date, 20),
      time: clean(d.time, 60),
      message: String(d.message == null ? '' : d.message).trim().slice(0, 2000),
    };

    if (!f.name || !f.phone || !f.date) return out({ ok: false, error: 'Please fill in your name, phone and date.' });
    if (!/^[+\d][\d\s-]{6,}$/.test(f.phone)) return out({ ok: false, error: 'Please enter a valid phone number.' });
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return out({ ok: false, error: 'Please enter a valid email address.' });

    const rows = [
      ['Name', f.name], ['Phone', f.phone], ['Email', f.email || '-'],
      ['Date', f.date], ['Time', f.time || '-'], ['Message', f.message || '-'],
    ];
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const html =
      '<h2 style="font-family:Arial,sans-serif;color:#0b6e78">New appointment request</h2>' +
      '<table style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">' +
      rows.map(([k, v]) => '<tr><td style="padding:6px 16px 6px 0;color:#555;vertical-align:top"><b>' + k +
        '</b></td><td style="padding:6px 0;white-space:pre-wrap">' + esc(v) + '</td></tr>').join('') +
      '</table><p style="font-family:Arial,sans-serif;color:#888;font-size:12px">Sent from the appointment form on agrapulmonologist.com</p>';

    const mail = {
      to: TO_EMAIL,
      subject: 'Appointment request: ' + f.name + ' – ' + f.date,
      body: 'New appointment request from agrapulmonologist.com\n\n' + rows.map(([k, v]) => k + ': ' + v).join('\n'),
      htmlBody: html,
      name: SENDER_NAME,
    };
    if (f.email) mail.replyTo = f.email; // "Reply" goes straight to the patient
    MailApp.sendEmail(mail);

    return out({ ok: true });
  } catch (err) {
    console.error(err);
    return out({ ok: false, error: 'Could not send your request. Please call or WhatsApp us.' });
  }
}

// Visiting the URL in a browser shows this, handy to check the deployment works.
function doGet() {
  return out({ ok: true, info: 'Appointment endpoint is running. Submit the form on the website to send a request.' });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the editor (select testEmail → Run) to check emails arrive.
function testEmail() {
  MailApp.sendEmail(TO_EMAIL, 'Test: agrapulmonologist.com appointment form', 'If you can read this, the form email is set up correctly.', { name: SENDER_NAME });
}
