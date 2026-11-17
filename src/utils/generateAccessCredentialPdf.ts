import { jsPDF } from 'jspdf';

export type AccessCredentialRole = 'local_pastor' | 'secretary' | 'pastor_advisor';

export interface AccessCredentialPdfPayload {
  fullName: string;
  email: string;
  tempPassword: string;
  role: AccessCredentialRole;
  churchName: string;
  accessUrl: string;
  issuedAt?: string;
  assignedFeatures?: string[];
  enabledModuleNames?: string[];
  issuerName: string;
  issuerTitle?: string;
  conventionName?: string;
  supportContact?: string;
}

const ADVISOR_FUNCTION_CATALOG: Array<{ id: string; label: string }> = [
  { id: 'expedientes', label: 'Expedientes y Miembros' },
  { id: 'atencion', label: 'Atención Pastoral' },
  { id: 'eventos', label: 'Cultos y Eventos' },
  { id: 'documentacion', label: 'Documentación y Cartas' },
  { id: 'comunicaciones', label: 'Comunicaciones' },
  { id: 'credenciales', label: 'Credencial Digital' },
];

export function formatAccessCredentialDate(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildAccessCredentialModelData(payload: AccessCredentialPdfPayload) {
  const issuedDate = payload.issuedAt || formatAccessCredentialDate();
  const church = payload.churchName || 'Iglesia / Sede AD Madureira';
  const support = payload.supportContact || 'Secretaría General / Soporte Técnico';
  const issuerName = payload.issuerName || 'Administración General';
  const issuerTitle = payload.issuerTitle || 'Administración / Presidencia';
  const convention = payload.conventionName || 'Iglesia Asamblea de Dios Ministerio Madureira · CONAMAD España';

  if (payload.role === 'secretary') {
    const funcs =
      payload.enabledModuleNames && payload.enabledModuleNames.length > 0
        ? payload.enabledModuleNames.join(' · ')
        : 'Expedientes y miembros · Documentación y cartas · Comunicaciones · Cultos y eventos';
    return {
      modelHeading: 'MODELO 2 · SECRETARIO / SECRETARIA',
      subject: 'ASUNTO: Entrega de credenciales de acceso – Secretaría',
      intro: `Estimado/a ${payload.fullName}: Se le asigna acceso al Sistema de Madureira 3.0 con el rol de Secretario/a para la iglesia/sede ${church}, con el fin de apoyar la gestión documental, de miembros y de comunicaciones.`,
      roleLabel: 'Secretario/a',
      functionsTitle: 'Funciones habilitadas',
      functionsText: funcs,
      securityInstructions: `Instrucciones de seguridad: Este acceso es personal e intransferible. Cambie la contraseña en el primer inicio y utilice los datos de los miembros únicamente para fines autorizados por la iglesia. Reporte cualquier uso no autorizado a ${support}.`,
      issuedDate,
      church,
      issuerName,
      issuerTitle,
      convention,
    };
  }

  if (payload.role === 'pastor_advisor') {
    const activeSet = new Set(payload.assignedFeatures || ['expedientes']);
    const checklist = ADVISOR_FUNCTION_CATALOG.map(
      (f) => `${activeSet.has(f.id) ? '☑' : '☐'} ${f.label}`
    ).join(' · ');
    return {
      modelHeading: 'MODELO 3 · PASTOR ASESOR / SECUNDARIO (MÚLTIPLES FUNCIONES)',
      subject: 'ASUNTO: Entrega de credenciales de acceso – Pastor Asesor / Secundario',
      intro: `Estimado/a ${payload.fullName}: Se le asigna acceso al Sistema de Madureira 3.0 con el rol Pastor Asesor / Secundario para la iglesia/sede ${church}. El acceso se limita a las funciones específicas autorizadas por la presidencia o administración responsable.`,
      roleLabel: 'Pastor Asesor / Secundario (múltiples funciones)',
      functionsTitle: 'Funciones específicas',
      functionsText: checklist,
      securityInstructions:
        'Instrucciones de seguridad: Las funciones marcadas definen el alcance de su permiso. No utilice el acceso para tareas no autorizadas. Cambie la contraseña en el primer inicio y mantenga confidenciales los datos pastorales y de miembros. Si requiere ampliar permisos, solicítelo por escrito a Presidencia / Administración.',
      issuedDate,
      church,
      issuerName,
      issuerTitle,
      convention,
    };
  }

  const adminFuncs =
    payload.enabledModuleNames && payload.enabledModuleNames.length > 0
      ? payload.enabledModuleNames.join(' · ')
      : 'Usuarios, sedes, reportes, configuración u otras autorizadas';

  return {
    modelHeading: 'MODELO 1 · ADMINISTRADOR / ADMIN DE SEDE',
    subject: 'ASUNTO: Entrega de credenciales de acceso – Administrador',
    intro: `Estimado/a ${payload.fullName}: Por medio de la presente se le entregan las credenciales de acceso al Sistema de Madureira 3.0 con el rol de Administrador de la iglesia/sede ${church}.`,
    roleLabel: 'Administrador',
    functionsTitle: 'Funciones habilitadas',
    functionsText: adminFuncs,
    securityInstructions: `Instrucciones de seguridad: Por seguridad, cambie su contraseña al ingresar por primera vez. No comparta sus credenciales ni las publique en grupos. Si no reconoce este acceso, contacte inmediatamente a ${support}.`,
    issuedDate,
    church,
    issuerName,
    issuerTitle,
    convention,
  };
}

export async function generateAccessCredentialPdf(
  payload: AccessCredentialPdfPayload
): Promise<void> {
  const model = buildAccessCredentialModelData(payload);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const loadImg = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const logoImg = await loadImg('/assets/aistudio/image003_7f3b24a6.png');

  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context no disponible');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1240, 1754);

  const marginX = 110;
  const contentW = 1240 - marginX * 2;
  let y = 85;

  // Cabecera institucional
  if (logoImg) {
    const logoW = 86;
    const logoH = (logoImg.height / logoImg.width) * logoW || 105;
    ctx.drawImage(logoImg, marginX, y, logoW, logoH);
  }

  const headerX = logoImg ? marginX + 110 : marginX;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 23px Arial, sans-serif';
  ctx.fillText('CREDENCIALES DE ACCESO · SISTEMA DE MADUREIRA 3.0', headerX, y + 32);

  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Documento confidencial · No compartir credenciales', headerX, y + 62);

  ctx.fillStyle = '#4B5563';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText(model.modelHeading, headerX, y + 88);

  y += 126;
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(marginX + contentW, y);
  ctx.stroke();

  y += 46;

  // Helper para texto ajustado
  const drawWrapped = (
    text: string,
    x: number,
    maxW: number,
    font: string,
    color: string,
    lineHeight: number
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line !== '') {
        ctx.fillText(line.trimEnd(), x, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trimEnd(), x, y);
      y += lineHeight;
    }
  };

  // Asunto
  drawWrapped(model.subject, marginX, contentW, 'bold 20px Arial, sans-serif', '#111111', 30);
  y += 18;

  // Párrafo de entrega
  drawWrapped(model.intro, marginX, contentW, '18px Arial, sans-serif', '#1F2937', 29);
  y += 28;

  // Tabla estructurada de credenciales
  const colLeftW = 290;
  const colRightW = contentW - colLeftW;

  const measureLines = (text: string, maxW: number, font: string): string[] => {
    ctx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : ['—'];
  };

  const rows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: 'Usuario / correo', value: payload.email, bold: true },
    { label: 'Enlace de acceso', value: payload.accessUrl },
    { label: 'Contraseña temporal', value: payload.tempPassword, bold: true },
    { label: 'Rol asignado', value: model.roleLabel },
    { label: model.functionsTitle, value: model.functionsText },
    { label: 'Fecha de emisión', value: model.issuedDate },
  ];

  for (const row of rows) {
    const valFont = row.bold ? 'bold 17px Arial, sans-serif' : '17px Arial, sans-serif';
    const valLines = measureLines(row.value, colRightW - 36, valFont);
    const rowH = Math.max(58, valLines.length * 26 + 26);

    // Fondo columna izquierda
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(marginX, y, colLeftW, rowH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(marginX + colLeftW, y, colRightW, rowH);

    // Bordes
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(marginX, y, colLeftW, rowH);
    ctx.strokeRect(marginX + colLeftW, y, colRightW, rowH);

    // Texto columna izquierda
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(row.label, marginX + 18, y + 34);

    // Texto columna derecha
    ctx.fillStyle = '#111827';
    ctx.font = valFont;
    valLines.forEach((ln, idx) => {
      ctx.fillText(ln, marginX + colLeftW + 18, y + 34 + idx * 26);
    });

    y += rowH;
  }

  y += 38;

  // Caja de instrucciones de seguridad
  const secLines = measureLines(model.securityInstructions, contentW - 44, '16px Arial, sans-serif');
  const secBoxH = secLines.length * 26 + 34;
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(marginX, y, contentW, secBoxH);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(marginX, y, contentW, secBoxH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#78350F';
  ctx.font = '16px Arial, sans-serif';
  secLines.forEach((ln, idx) => {
    ctx.fillText(ln, marginX + 22, y + 32 + idx * 26);
  });

  y += secBoxH + 48;

  // Firma de emisión
  ctx.fillStyle = '#111111';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('Atentamente,', marginX, y);
  y += 42;
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`${model.issuerName} · ${model.issuerTitle}`, marginX, y);
  y += 28;
  ctx.font = '16px Arial, sans-serif';
  ctx.fillStyle = '#4B5563';
  ctx.fillText(model.convention, marginX, y);

  y += 72;

  // Acuse de recibo
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(marginX + contentW, y);
  ctx.stroke();

  y += 36;
  drawWrapped(
    'Acuse de recibo: Declaro haber recibido las credenciales y me comprometo a usarlas conforme a las instrucciones de seguridad.',
    marginX,
    contentW,
    'bold 16px Arial, sans-serif',
    '#1F2937',
    25
  );

  y += 58;
  ctx.fillStyle = '#111111';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(
    'Nombre y firma del receptor: _______________________________________    Fecha: ____ / ____ / ________',
    marginX,
    y
  );

  // Pie de página
  ctx.strokeStyle = '#D1D5DB';
  ctx.beginPath();
  ctx.moveTo(marginX, 1650);
  ctx.lineTo(marginX + contentW, 1650);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6B7280';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(
    'Sistema de Madureira 3.0 · Entrega oficial de credenciales de acceso · Documento confidencial',
    620,
    1682
  );

  const imgData = canvas.toDataURL('image/jpeg', 0.94);
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  const safeName = payload.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Credenciales_${safeName}.pdf`);
}
