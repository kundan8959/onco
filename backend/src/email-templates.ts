// ─── Shared Email Templates ──────────────────────────────────────────────────
// All outbound HTML emails are built here for consistency.
// Brand colours: primary #4e73df  success #1cc88a  warning #f59e0b  danger #e74a3b

const CANCER_COLORS: Record<string, string> = {
  'Breast Cancer': '#e91e8c',
  'Prostate Cancer': '#1b5e9c',
  'Lung Cancer': '#2962a8',
  'Colorectal Cancer': '#2e7d32',
};

const EPISODE_LABELS: Record<string, string> = {
  chemotherapy: 'Chemotherapy',
  radiation: 'Radiation Therapy',
  immunotherapy: 'Immunotherapy',
  targeted_therapy: 'Targeted Therapy',
  surgery: 'Surgical Procedure',
  consultation: 'Medical Consultation',
  follow_up: 'Follow-up Visit',
};

// ── Base wrapper shared by every email ───────────────────────────────────────
function baseLayout(opts: {
  headerColor: string;
  headerIcon: string;   // emoji / text icon
  headerTitle: string;
  headerSubtitle: string;
  headerBadge?: string;
  body: string;
  footerExtra?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:'Segoe UI',Arial,sans-serif;color:#333">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:28px 0">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">

    <!-- Top accent bar -->
    <tr><td style="background:${opts.headerColor};height:5px;font-size:0">&nbsp;</td></tr>

    <!-- Logo / brand row -->
    <tr>
      <td style="background:#ffffff;padding:18px 32px 0;border-bottom:1px solid #f0f2fa">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:18px;font-weight:700;color:#4e73df;letter-spacing:-.3px">
              🏥 Onco<span style="color:#1cc88a">EHR</span>
            </td>
            <td align="right" style="font-size:11px;color:#a0aec0">
              Oncology Care Management
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Hero header -->
    <tr>
      <td style="background:linear-gradient(135deg,${opts.headerColor} 0%,${opts.headerColor}cc 100%);padding:32px 32px 28px">
        <div style="font-size:38px;margin-bottom:10px">${opts.headerIcon}</div>
        <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2">${opts.headerTitle}</h1>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,.85);line-height:1.5">${opts.headerSubtitle}</p>
        ${opts.headerBadge ? `<div style="display:inline-block;margin-top:12px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;color:#fff;letter-spacing:.06em">${opts.headerBadge}</div>` : ''}
      </td>
    </tr>

    <!-- Body -->
    <tr><td style="padding:0">${opts.body}</td></tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e8edf5;padding:20px 32px;text-align:center">
        ${opts.footerExtra ? `<p style="margin:0 0 10px;font-size:13px;color:#5a5c69">${opts.footerExtra}</p>` : ''}
        <p style="margin:0;font-size:11px;color:#a0aec0;line-height:1.6">
          This is an automated message from <strong>OncoEHR</strong>. Please do not reply directly to this email.<br>
          If you have questions, contact your cancer care team.
        </p>
      </td>
    </tr>

    <!-- Bottom accent bar -->
    <tr><td style="background:${opts.headerColor};height:3px;font-size:0">&nbsp;</td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Info grid cell ────────────────────────────────────────────────────────────
function infoCell(label: string, value: string): string {
  return `<td style="padding:14px 18px;border-right:1px solid #edf2ff;border-bottom:1px solid #edf2ff;vertical-align:top">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#a0aec0;font-weight:700;margin-bottom:4px">${label}</div>
    <div style="font-size:15px;font-weight:700;color:#1a202c">${value}</div>
  </td>`;
}

// ── Bullet list item ──────────────────────────────────────────────────────────
function listItem(text: string, color = '#4e73df'): string {
  return `<tr>
    <td style="padding:4px 0;vertical-align:top;width:20px">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-top:5px"></span>
    </td>
    <td style="padding:4px 0 4px 8px;font-size:14px;color:#4a5568;line-height:1.55">${text}</td>
  </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EPISODE APPOINTMENT (scheduled / confirmed / rescheduled / reminder)
// ─────────────────────────────────────────────────────────────────────────────
export function buildEpisodeEmail(episode: any, patientName: string): string {
  const headerColor = CANCER_COLORS[episode.cancer_type] || '#4e73df';
  const typeLabel = EPISODE_LABELS[episode.episode_type] || (episode.episode_type || 'Appointment').replace(/_/g, ' ');

  const cycle = episode.cycle_number ? `Cycle ${episode.cycle_number}` : '';
  const session = episode.session_number ? `, Session ${episode.session_number}` : '';
  const total = episode.total_sessions ? ` of ${episode.total_sessions}` : '';
  const cycleStr = cycle ? `${cycle}${session}${total}` : '';

  const dateFormatted = (() => {
    try {
      return new Date(episode.scheduled_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return episode.scheduled_date;
    }
  })();

  const preReqs = episode.pre_requirements
    ? episode.pre_requirements.split(/[.;\n]+/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  const infoRows = [
    ['Date', dateFormatted],
    ['Time', episode.scheduled_time || 'As scheduled'],
    ['Location', episode.location || 'See reception'],
    ['Duration', episode.duration_minutes ? `~${episode.duration_minutes} min` : 'Varies'],
    ...(episode.attending_staff ? [['Care Team', episode.attending_staff]] : []),
    ...(cycleStr ? [['Progress', cycleStr]] : []),
  ];

  // Build 2-column grid rows
  const gridRows: string[] = [];
  for (let i = 0; i < infoRows.length; i += 2) {
    const right = infoRows[i + 1]
      ? infoCell(infoRows[i + 1][0], infoRows[i + 1][1])
      : '<td style="border-bottom:1px solid #edf2ff">&nbsp;</td>';
    gridRows.push(`<tr>${infoCell(infoRows[i][0], infoRows[i][1])}${right}</tr>`);
  }

  const body = `
    <!-- Patient greeting -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;color:#5a5c69">Dear <strong>${patientName}</strong>,</p>
        <p style="margin:10px 0 0;font-size:14px;color:#718096;line-height:1.6">
          This is a confirmation and reminder for your upcoming <strong>${typeLabel}</strong> appointment.
          Please review the details below carefully.
        </p>
      </td></tr>
    </table>

    <!-- Appointment details grid -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 32px 0;width:calc(100% - 64px);border:1px solid #edf2ff;border-radius:8px;overflow:hidden;border-collapse:collapse">
      ${gridRows.join('')}
    </table>

    ${preReqs.length > 0 ? `
    <!-- Pre-requirements alert -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0">
          <tr><td style="padding:14px 16px">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e">⚠ Pre-appointment requirements</p>
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5">Please ensure all items below are completed before your appointment.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 32px 0">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a0aec0">Before Your Appointment</p>
        <table cellpadding="0" cellspacing="0">${preReqs.map((r: string) => listItem(r, '#f59e0b')).join('')}</table>
      </td></tr>
    </table>` : ''}

    <!-- What to bring -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a0aec0">What to Bring</p>
        <table cellpadding="0" cellspacing="0">
          ${listItem('Valid photo ID and insurance card')}
          ${listItem('Current medication list')}
          ${listItem('Recent lab results or imaging reports')}
          ${listItem('Comfortable, loose-fitting clothing')}
          ${listItem('A companion or support person if needed')}
        </table>
      </td></tr>
    </table>

    ${episode.notes ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a0aec0">Additional Notes</p>
        <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.7;background:#f8fafc;padding:14px 16px;border-radius:6px;border:1px solid #edf2ff">${episode.notes}</p>
      </td></tr>
    </table>` : ''}

    <div style="height:28px"></div>
  `;

  return baseLayout({
    headerColor,
    headerIcon: '📅',
    headerTitle: `${typeLabel} Appointment`,
    headerSubtitle: `${episode.cancer_type || 'Oncology'} · ${patientName} · ${dateFormatted}`,
    headerBadge: cycleStr || undefined,
    body,
    footerExtra: 'To reschedule, please contact us at least <strong>24 hours</strong> in advance.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EPISODE CANCELLATION
// ─────────────────────────────────────────────────────────────────────────────
export function buildCancellationEmail(episode: any, patientName: string): string {
  const typeLabel = EPISODE_LABELS[episode.episode_type] || (episode.episode_type || 'Appointment').replace(/_/g, ' ');
  const dateFormatted = (() => {
    try {
      return new Date(episode.scheduled_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return episode.scheduled_date; }
  })();

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;color:#5a5c69">Dear <strong>${patientName}</strong>,</p>
        <p style="margin:10px 0 0;font-size:14px;color:#718096;line-height:1.6">
          We regret to inform you that your upcoming appointment has been cancelled.
          Please contact your care team as soon as possible to reschedule.
        </p>
      </td></tr>
    </table>

    <!-- Cancelled appointment details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 32px 0;width:calc(100% - 64px);border:1px solid #fde8e8;border-radius:8px;overflow:hidden;background:#fff5f5;border-collapse:collapse">
      <tr>
        ${infoCell('Appointment Type', typeLabel)}
        ${infoCell('Was Scheduled For', dateFormatted)}
      </tr>
      ${episode.location ? `<tr>${infoCell('Location', episode.location)}<td style="border-bottom:1px solid #fde8e8">&nbsp;</td></tr>` : ''}
    </table>

    ${episode.cancellation_reason ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f0;border-left:4px solid #e74a3b;border-radius:0 6px 6px 0">
          <tr><td style="padding:14px 16px">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#e74a3b">Reason for Cancellation</p>
            <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.6">${episode.cancellation_reason}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>` : ''}

    <!-- Next steps -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#a0aec0">Next Steps</p>
        <table cellpadding="0" cellspacing="0">
          ${listItem('Contact your cancer care team to schedule a new appointment', '#e74a3b')}
          ${listItem('Inform any companion who was planning to accompany you', '#e74a3b')}
          ${listItem('Continue all medications as prescribed unless told otherwise', '#e74a3b')}
          ${listItem('If you feel unwell, seek medical attention immediately', '#e74a3b')}
        </table>
      </td></tr>
    </table>

    <div style="height:28px"></div>
  `;

  return baseLayout({
    headerColor: '#e74a3b',
    headerIcon: '❌',
    headerTitle: 'Appointment Cancelled',
    headerSubtitle: `${typeLabel} · ${dateFormatted}`,
    body,
    footerExtra: 'We apologise for any inconvenience. Your health remains our top priority.',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TREATMENT SCHEDULED (emergency contact notification)
// ─────────────────────────────────────────────────────────────────────────────
export function buildTreatmentScheduledEmail(treatment: any, patientName: string, emergencyContactRelation?: string): string {
  const treatmentLabel = (treatment.regimen_name || treatment.treatment_type || 'Treatment').replace(/_/g, ' ');

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;color:#5a5c69">Dear ${emergencyContactRelation ? `<strong>${emergencyContactRelation}</strong>` : 'Emergency Contact'},</p>
        <p style="margin:10px 0 0;font-size:14px;color:#718096;line-height:1.6">
          This is an automated notification to inform you that a treatment has been scheduled
          for your family member / dependent, <strong>${patientName}</strong>.
        </p>
      </td></tr>
    </table>

    <!-- Treatment info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 32px 0;width:calc(100% - 64px);border:1px solid #edf2ff;border-radius:8px;overflow:hidden;border-collapse:collapse">
      <tr>
        ${infoCell('Patient', patientName)}
        ${infoCell('Treatment', treatmentLabel)}
      </tr>
      <tr>
        ${infoCell('Start Date', treatment.start_date || 'As discussed')}
        ${infoCell('Status', (treatment.readiness_status || treatment.response || 'Scheduled').replace(/_/g, ' '))}
      </tr>
    </table>

    <!-- Info notice -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:20px 32px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef5ff;border-left:4px solid #4e73df;border-radius:0 6px 6px 0">
          <tr><td style="padding:14px 16px">
            <p style="margin:0;font-size:13px;color:#2c5282;line-height:1.6">
              <strong>ℹ You are receiving this message</strong> because you are listed as an emergency contact for <strong>${patientName}</strong>.
              For detailed information about the treatment plan, please speak directly with the oncology care team.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>

    <div style="height:28px"></div>
  `;

  return baseLayout({
    headerColor: '#1cc88a',
    headerIcon: '💊',
    headerTitle: 'Treatment Scheduled',
    headerSubtitle: `${treatmentLabel} has been scheduled for ${patientName}`,
    body,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GENERIC IN-APP NOTIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export function buildNotificationEmail(opts: {
  title: string;
  message: string;
  type?: string;        // 'info' | 'success' | 'warning' | 'error'
  actionUrl?: string | null;
  recipientName?: string;
}): string {
  const colorMap: Record<string, string> = {
    success: '#1cc88a',
    warning: '#f59e0b',
    error: '#e74a3b',
    info: '#4e73df',
  };
  const iconMap: Record<string, string> = {
    success: '✅',
    warning: '⚠️',
    error: '🚨',
    info: 'ℹ️',
  };
  const color = colorMap[opts.type || 'info'] || '#4e73df';
  const icon = iconMap[opts.type || 'info'] || 'ℹ️';

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 32px">
        ${opts.recipientName ? `<p style="margin:0 0 14px;font-size:15px;color:#5a5c69">Dear <strong>${opts.recipientName}</strong>,</p>` : ''}
        <p style="margin:0;font-size:15px;color:#2d3748;line-height:1.7">${opts.message}</p>
        ${opts.actionUrl ? `
        <table cellpadding="0" cellspacing="0" style="margin-top:24px">
          <tr>
            <td style="background:${color};border-radius:6px;padding:12px 24px">
              <a href="${opts.actionUrl}" style="color:#fff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:.02em">View in OncoEHR →</a>
            </td>
          </tr>
        </table>` : ''}
      </td></tr>
    </table>
  `;

  return baseLayout({
    headerColor: color,
    headerIcon: icon,
    headerTitle: opts.title,
    headerSubtitle: 'Notification from OncoEHR',
    body,
  });
}
