import { jsPDF } from 'jspdf';
import { Member, DigitalCredential } from '../types';

/**
 * Gera um documento PDF canônico da Credencial Digital utilizando
 * o modelo oficial exato fornecido (MODELO_DE_TARJETA_CONAMAD_a7c79806.webp).
 * Dimensões padrão de cartão internacional ID-1 (85.6mm x 54mm).
 */
export async function generateCredentialPdf(
  member: Member,
  credential?: DigitalCredential | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/aistudio/MODELO_DE_TARJETA_CONAMAD_a7c79806.webp';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1004;
        canvas.height = 650;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context não disponível');
        }

        // 1. Desenha o modelo oficial exatamente como fornecido
        ctx.drawImage(img, 0, 0, 1004, 650);

        // 2. Diferenciação discreta de título (Ministro vs Membro)
        const isMinister =
          member.ministerialFunction &&
          /pastor|evangelista|presb|ministro/i.test(member.ministerialFunction);

        if (!isMinister) {
          // Sobrepõe a barra preta superior com "CREDENCIAL DE MIEMBRO" mantendo a tipografia
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 1004, 42);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CREDENCIAL DE MIEMBRO', 502, 28);
        }

        // 3. Matrícula (centralizado estritamente na caixa branca sob o rótulo "Matrícula:")
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px "Courier New", monospace';
        const matricula =
          member.memberNumber || `MAD-${member.id.toString().padStart(4, '0')}`;
        ctx.fillText(matricula, 144, 334, 235);

        // 4. Cargo (centralizado estritamente na caixa branca sob o rótulo "Cargo:")
        ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
        const rawCargo = member.ministerialFunction || (isMinister ? 'MINISTRO' : 'MIEMBRO');
        const cargo = (() => {
          if (/pastor/i.test(rawCargo)) return 'PASTOR';
          if (/presb/i.test(rawCargo)) return 'PRESBÍTERO';
          if (/evangel/i.test(rawCargo)) return 'EVANGELISTA';
          if (/diacon/i.test(rawCargo)) return 'DIÁCONO';
          if (/misioner/i.test(rawCargo)) return 'MISIONERO';
          if (/miembro/i.test(rawCargo)) return 'MIEMBRO';
          return rawCargo.toUpperCase();
        })();
        ctx.fillText(cargo, 480, 334, 300);

        // 5. Iglesia (centralizado estritamente na caixa branca sob o rótulo "Iglesia")
        ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
        const iglesia = (
          member.congregationName?.replace(/AD(M)? Madureira( — )?/i, '').replace(/Sede/i, '').trim() ||
          member.city ||
          'MADRID'
        ).toUpperCase();
        ctx.fillText(iglesia, 825, 334, 290);

        // 6. Nombre (alinhado rigorosamente na caixa branca após o rótulo "Nombre:")
        ctx.textAlign = 'left';
        ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
        const nombre = `${member.firstName} ${member.lastName}`.toUpperCase();
        ctx.fillText(nombre, 160, 410, 570);

        // 7. Finalização canônica do documento PDF (fiel à tarjeta oficial sem foto)
        const pngDataUrl = canvas.toDataURL('image/png');
        doc.addImage(pngDataUrl, 'PNG', 0, 0, 85.6, 54);

        const safeName = `${member.firstName}_${member.lastName}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        doc.save(`credencial_madureira_${safeName}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}
