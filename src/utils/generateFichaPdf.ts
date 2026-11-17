import { jsPDF } from 'jspdf';
import { Congregation, Member } from '../types';

export interface FichaChurchInfo {
  name: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
}

const MADRID_DEFAULT_CHURCH: FichaChurchInfo = {
  name: 'Iglesia ADMM – Madrid',
  nif: 'R2802896G',
  address: 'c/ Haya, 2',
  postalCode: '28044',
  city: 'Madrid',
  phone: '+34 639 98 83 45',
  email: 'secretaria.admmmadrid@gmail.com',
};

export function resolveFichaChurchInfo(
  congregation?: Partial<Congregation> | null
): FichaChurchInfo {
  if (!congregation) return MADRID_DEFAULT_CHURCH;

  // Si es la sede seed de Madrid sin personalizar aún, conservar los datos oficiales del documento base
  const isUntouchedMadridSeed =
    congregation.code === 'CONG-MAD-04' &&
    congregation.address === 'Calle de Atocha, 112 - Centro' &&
    congregation.email === 'madrid@admadureira.org' &&
    !congregation.nif;

  if (isUntouchedMadridSeed) {
    return MADRID_DEFAULT_CHURCH;
  }

  return {
    name: congregation.name?.trim() || MADRID_DEFAULT_CHURCH.name,
    nif: congregation.nif?.trim() || MADRID_DEFAULT_CHURCH.nif,
    address: congregation.address?.trim() || '',
    postalCode: congregation.postalCode?.trim() || '',
    city: congregation.city?.trim() || '',
    phone: congregation.phone?.trim() || '',
    email: congregation.email?.trim() || MADRID_DEFAULT_CHURCH.email,
  };
}

export function formatFichaFooter(info: FichaChurchInfo): string {
  const cpCity = [info.postalCode, info.city].filter(Boolean).join(' ');
  const locationPart = [info.address, cpCity].filter(Boolean).join(' – ');
  const parts = [
    info.name,
    locationPart,
    info.phone ? `Tel: ${info.phone}` : '',
    info.email,
  ].filter(Boolean);
  return parts.join(' · ');
}

/**
 * Genera el documento PDF oficial "FICHA DE MIEMBRO"
 * replicando la plantilla base oficial ADMM Madrid:
 * - Cabecera con logotipo oficial ADMM Madrid (/assets/aistudio/image003_7f3b24a6.png)
 * - 1. DATOS PERSONALES
 * - 2. DATOS DE LA IGLESIA
 * - 3. CONSENTIMIENTO Y FIRMA (RGPD + cuadro de firmas)
 * - 4. USO EXCLUSIVO DE SECRETARÍA
 * - Pie de página institucional dinámico según la sede/perfil del administrador
 */
export async function generateFichaPdf(
  member: Member,
  congregationOverride?: Partial<Congregation> | null
): Promise<void> {
  const churchInfo = resolveFichaChurchInfo(congregationOverride || member.congregation);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const loadImg = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Aviso: Imagen no cargada en PDF:', src);
        resolve(null);
      };
      img.src = src;
    });
  };

  try {
    const logoImg = await loadImg('/assets/aistudio/image003_7f3b24a6.png');

    // Canvas A4 de alta resolución (1240 x 1754 px ~ 150 DPI)
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context no disponible');

    // Fondo blanco puro
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1240, 1754);

    const marginX = 95;
    const contentW = 1240 - marginX * 2; // 1050 px
    const todayStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // ========================================================
    // 1. CABECERA INSTITUCIONAL
    // ========================================================
    if (logoImg) {
      const logoW = 108;
      const logoH = (logoImg.height / logoImg.width) * logoW || 135;
      ctx.drawImage(logoImg, marginX, 72, logoW, logoH);
    }

    const headerTextX = marginX + 128;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText('IGLESIA ASAMBLEA DE DIOS MINISTERIO MADUREIRA', headerTextX, 124);

    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('CONVENCIÓN NACIONAL DE LAS ASAMBLEAS DE DIOS (CONAMAD ESPAÑA)', headerTextX, 152);

    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`NIF: ${churchInfo.nif}  ·  REGISTRO ENTIDADES RELIGIOSAS N.º 015482`, headerTextX, 176);

    // ========================================================
    // 2. TÍTULO DEL DOCUMENTO
    // ========================================================
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText('FICHA DE MIEMBRO', 620, 265);

    let y = 325;

    const drawSectionHeading = (title: string, currentY: number): number => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(title, marginX, currentY);
      return currentY + 14;
    };

    const drawCell = (
      x: number,
      cellY: number,
      w: number,
      h: number,
      label: string,
      value: string
    ) => {
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, cellY, w, h);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(label, x + 12, cellY + 22);

      if (value) {
        ctx.fillStyle = '#171717';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(value, x + 12, cellY + 46, w - 24);
      }
    };

    const drawCheckbox = (x: number, boxY: number, checked: boolean, label: string): number => {
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, boxY - 13, 14, 14);
      if (checked) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', x + 7, boxY - 1);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.font = '15px Arial, sans-serif';
      ctx.fillText(label, x + 22, boxY);
      return x + 22 + ctx.measureText(label).width + 20;
    };

    // ========================================================
    // 3. SECCIÓN 1: DATOS PERSONALES
    // ========================================================
    y = drawSectionHeading('1. DATOS PERSONALES', y);
    const rowH = 62;

    // Fila 1: Apellidos y Nombre
    const fullName =
      member.lastName || member.firstName
        ? `${member.lastName || ''}${member.lastName && member.firstName ? ', ' : ''}${member.firstName || ''}`
        : '';
    drawCell(marginX, y, contentW, rowH, 'APELLIDOS Y NOMBRE', fullName);
    y += rowH;

    // Fila 2: DNI | Fecha Nacimiento | Nacionalidad
    const s1c1 = 385;
    const s1c2 = 310;
    const s1c3 = contentW - s1c1 - s1c2;
    drawCell(marginX, y, s1c1, rowH, 'DNI / NIE / PASAPORTE', member.idDocument || '');
    drawCell(marginX + s1c1, y, s1c2, rowH, 'FECHA DE NACIMIENTO', member.birthDate || '');
    drawCell(marginX + s1c1 + s1c2, y, s1c3, rowH, 'NACIONALIDAD', member.nationality || '');
    y += rowH;

    // Fila 3: Teléfono | Correo
    const s1r3c1 = 325;
    const s1r3c2 = contentW - s1r3c1;
    drawCell(marginX, y, s1r3c1, rowH, 'TELÉFONO / MÓVIL', member.phone || '');
    drawCell(marginX + s1r3c1, y, s1r3c2, rowH, 'CORREO ELECTRÓNICO', member.email || '');
    y += rowH;

    // Fila 4: Domicilio
    drawCell(marginX, y, contentW, rowH, 'DOMICILIO (CALLE, N.º, PISO)', member.address || '');
    y += rowH;

    // Fila 5: Ciudad | C.P. | Provincia
    const s1r5c1 = 495;
    const s1r5c2 = 185;
    const s1r5c3 = contentW - s1r5c1 - s1r5c2;
    const provinceVal = (member as Member & { province?: string }).province || member.city || '';
    drawCell(marginX, y, s1r5c1, rowH, 'CIUDAD', member.city || '');
    drawCell(marginX + s1r5c1, y, s1r5c2, rowH, 'C.P.', member.postalCode || '');
    drawCell(marginX + s1r5c1 + s1r5c2, y, s1r5c3, rowH, 'PROVINCIA', provinceVal);
    y += rowH + 34;

    // ========================================================
    // 4. SECCIÓN 2: DATOS DE LA IGLESIA
    // ========================================================
    y = drawSectionHeading('2. DATOS DE LA IGLESIA', y);

    // Fila 1: Fecha de Ingreso | Forma de Ingreso
    const s2r1c1 = 325;
    const s2r1c2 = contentW - s2r1c1;
    drawCell(marginX, y, s2r1c1, rowH, 'FECHA DE INGRESO', member.admissionDate || '');
    drawCell(marginX + s2r1c1, y, s2r1c2, rowH, 'FORMA DE INGRESO', '');
    const isTransfer =
      member.status === 'transferred' ||
      (member.observations || '').toLowerCase().includes('traslado');
    const isBaptism = !isTransfer && Boolean(member.baptismDate);
    let cbX = marginX + s2r1c1 + 12;
    cbX = drawCheckbox(cbX, y + 46, isBaptism, 'Bautismo');
    cbX = drawCheckbox(cbX, y + 46, isTransfer, 'Traslado');
    drawCheckbox(cbX, y + 46, false, 'Otro');
    y += rowH;

    // Fila 2: Iglesia de Procedencia
    drawCell(
      marginX,
      y,
      contentW,
      rowH,
      'IGLESIA DE PROCEDENCIA (SI VIENE POR TRASLADO)',
      member.status === 'transferred' ? member.congregationName || '' : ''
    );
    y += rowH;

    // Fila 3: Bautismo en Aguas | Fecha Aproximada | Lugar / Iglesia
    const s2r3c1 = 325;
    const s2r3c2 = 295;
    const s2r3c3 = contentW - s2r3c1 - s2r3c2;
    drawCell(marginX, y, s2r3c1, rowH, 'BAUTISMO EN AGUAS', '');
    let bapX = marginX + 12;
    bapX = drawCheckbox(bapX, y + 46, Boolean(member.baptismDate), 'Sí');
    drawCheckbox(bapX, y + 46, false, 'No');
    drawCell(marginX + s2r3c1, y, s2r3c2, rowH, 'FECHA APROXIMADA', member.baptismDate || '');
    drawCell(
      marginX + s2r3c1 + s2r3c2,
      y,
      s2r3c3,
      rowH,
      'LUGAR / IGLESIA',
      member.baptismDate ? member.congregationName || '' : ''
    );
    y += rowH;

    // Fila 4: Cargo o Ministerio | Área en la que sirve
    const s2r4c1 = 400;
    const s2r4c2 = contentW - s2r4c1;
    drawCell(marginX, y, s2r4c1, rowH, 'CARGO O MINISTERIO (SI TIENE)', member.ministerialFunction || '');
    drawCell(marginX + s2r4c1, y, s2r4c2, rowH, 'ÁREA EN LA QUE SIRVE O DESEA SERVIR', member.departmentName || '');
    y += rowH + 34;

    // ========================================================
    // 5. SECCIÓN 3: CONSENTIMIENTO Y FIRMA
    // ========================================================
    y = drawSectionHeading('3. CONSENTIMIENTO Y FIRMA', y);

    const legalText =
      `Responsable: Iglesia Asamblea de Dios Ministerio Madureira (NIF ${churchInfo.nif}). Finalidad: registro de miembros y atención pastoral. Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en ${churchInfo.email}. Más información: RGPD (UE) 2016/679 y LOPDGDD 3/2018.`;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#171717';
    ctx.font = '14px Arial, sans-serif';
    const printWrapped = (text: string, startX: number, startY: number, maxW: number, lineH: number): number => {
      const words = text.split(' ');
      let line = '';
      let curY = startY;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxW && line !== '') {
          ctx.fillText(line.trimEnd(), startX, curY);
          line = word + ' ';
          curY += lineH;
        } else {
          line = testLine;
        }
      }
      if (line.trim() !== '') {
        ctx.fillText(line.trimEnd(), startX, curY);
      }
      return curY;
    };

    const textStartX = marginX + 14;
    y = printWrapped(legalText, textStartX, y + 12, contentW - 28, 21);
    y += 28;

    drawCheckbox(
      textStartX,
      y,
      member.status === 'active',
      'Consiento el tratamiento de mis datos para el registro y la atención pastoral de la iglesia.'
    );
    y += 28;

    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Lugar y fecha:', textStartX, y);
    const labelW = ctx.measureText('Lugar y fecha: ').width;
    const placeDate = member.city ? `${member.city}, ${todayStr}` : todayStr;
    ctx.fillText(placeDate, textStartX + labelW + 8, y - 2);
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(textStartX + labelW + 4, y + 4);
    ctx.lineTo(textStartX + labelW + 340, y + 4);
    ctx.stroke();

    y += 26;

    // Caja de Firmas (2 columnas)
    const sigBoxW = contentW / 2;
    const sigBoxH = 110;
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(marginX, y, sigBoxW, sigBoxH);
    ctx.strokeRect(marginX + sigBoxW, y, sigBoxW, sigBoxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('FIRMA DEL MIEMBRO', marginX + sigBoxW / 2, y + 26);
    ctx.fillText('RECIBIDO POR SECRETARÍA', marginX + sigBoxW + sigBoxW / 2, y + 26);

    ctx.beginPath();
    ctx.moveTo(marginX + 100, y + 88);
    ctx.lineTo(marginX + sigBoxW - 100, y + 88);
    ctx.moveTo(marginX + sigBoxW + 100, y + 88);
    ctx.lineTo(marginX + contentW - 100, y + 88);
    ctx.stroke();

    y += sigBoxH + 34;

    // ========================================================
    // 6. SECCIÓN 4: USO EXCLUSIVO DE SECRETARÍA
    // ========================================================
    y = drawSectionHeading('4. USO EXCLUSIVO DE SECRETARÍA', y);
    const s4c1 = 325;
    const s4c2 = 295;
    const s4c3 = contentW - s4c1 - s4c2;
    const regDate =
      member.admissionDate ||
      (member.createdAt ? new Date(member.createdAt).toLocaleDateString('es-ES') : todayStr);

    drawCell(
      marginX,
      y,
      s4c1,
      rowH,
      'N.º DE MIEMBRO',
      member.memberNumber || `MAD-${member.id.toString().padStart(4, '0')}`
    );
    drawCell(marginX + s4c1, y, s4c2, rowH, 'FECHA DE REGISTRO', regDate);
    drawCell(marginX + s4c1 + s4c2, y, s4c3, rowH, 'ESTADO', '');

    let stX = marginX + s4c1 + s4c2 + 12;
    stX = drawCheckbox(stX, y + 46, member.status === 'active', 'Activo');
    stX = drawCheckbox(stX, y + 46, member.status === 'inactive', 'Inactivo');
    drawCheckbox(stX, y + 46, member.status === 'transferred', 'Traslado');

    // ========================================================
    // 7. PIE DE PÁGINA INSTITUCIONAL
    // ========================================================
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(marginX, 1658);
    ctx.lineTo(marginX + contentW, 1658);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      formatFichaFooter(churchInfo),
      620,
      1688
    );

    // Añadir el canvas al documento PDF como imagen completa A4
    const pngDataUrl = canvas.toDataURL('image/png');
    doc.addImage(pngDataUrl, 'PNG', 0, 0, 210, 297);

    const safeName = `${member.firstName}_${member.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    doc.save(`Ficha_Miembro_ADMM_${safeName}.pdf`);
  } catch (err) {
    console.error('Error al generar la Ficha en PDF:', err);
    throw err;
  }
}
