import React from 'react';
import { Member } from '../types';

interface VisualCredentialCardProps {
  member: Member;
  className?: string;
}

export const VisualCredentialCard: React.FC<VisualCredentialCardProps> = ({
  member,
  className = '',
}) => {
  const isMinister = Boolean(
    member.ministerialFunction &&
      /pastor|evangelista|presb|ministro/i.test(member.ministerialFunction)
  );

  const cargoText = (() => {
    const raw = member.ministerialFunction || 'MIEMBRO';
    if (/pastor/i.test(raw)) return 'PASTOR';
    if (/presb/i.test(raw)) return 'PRESBÍTERO';
    if (/evangel/i.test(raw)) return 'EVANGELISTA';
    if (/diacon/i.test(raw)) return 'DIÁCONO';
    if (/misioner/i.test(raw)) return 'MISIONERO';
    if (/miembro/i.test(raw)) return 'MIEMBRO';
    return raw.toUpperCase();
  })();

  const iglesiaText =
    member.congregationName?.replace(/AD(M)? Madureira( — )?/i, '').replace(/Sede/i, '').trim() ||
    member.city ||
    'MADRID';

  const matricula = member.memberNumber || `MAD-${member.id.toString().padStart(4, '0')}`;
  const fullName = `${member.firstName} ${member.lastName}`.toUpperCase();

  return (
    <div
      className={`relative w-full aspect-[1004/650] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#121214] select-none ${className}`}
    >
      {/* Imagem do modelo oficial exato fornecido (MODELO_DE_TARJETA_CONAMAD_a7c79806.webp) */}
      <img
        src="/assets/aistudio/MODELO_DE_TARJETA_CONAMAD_a7c79806.webp"
        alt="Credencial Oficial AD Madureira"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
      />

      {/* Sobreposição da barra superior para Membro Regular mantendo a tipografia */}
      {!isMinister && (
        <div className="absolute top-0 inset-x-0 h-[6.5%] bg-black flex items-center justify-center pointer-events-none z-10">
          <span className="text-white font-black tracking-widest text-[clamp(8px,1.8vw,14px)] uppercase">
            CREDENCIAL DE MIEMBRO
          </span>
        </div>
      )}

      {/* Valor de Matrícula (restrito estritamente ao quadrado branco) */}
      <div
        className="absolute flex items-center justify-center font-mono font-black text-black tracking-wider overflow-hidden z-10"
        style={{
          top: '47.7%',
          left: '2.5%',
          width: '24.0%',
          height: '6.5%',
          fontSize: 'clamp(8px, 1.8vw, 13px)',
        }}
      >
        <span className="truncate text-center px-1 font-bold">{matricula}</span>
      </div>

      {/* Valor de Cargo (restrito estritamente ao quadrado branco) */}
      <div
        className="absolute flex items-center justify-center font-extrabold text-black uppercase tracking-wide overflow-hidden z-10"
        style={{
          top: '47.7%',
          left: '32.0%',
          width: '31.5%',
          height: '6.5%',
          fontSize: 'clamp(7px, 1.5vw, 12px)',
        }}
      >
        <span className="truncate text-center px-1 font-bold">{cargoText}</span>
      </div>

      {/* Valor de Iglesia / Filial (restrito estritamente ao quadrado branco) */}
      <div
        className="absolute flex items-center justify-center font-extrabold text-black uppercase tracking-wide overflow-hidden z-10"
        style={{
          top: '47.7%',
          left: '67.0%',
          width: '30.0%',
          height: '6.5%',
          fontSize: 'clamp(7px, 1.5vw, 12px)',
        }}
      >
        <span className="truncate text-center px-1 font-bold">{iglesiaText}</span>
      </div>

      {/* Valor de Nombre Completo (restrito estritamente ao quadrado branco de nome) */}
      <div
        className="absolute flex items-center font-black text-black uppercase tracking-tight overflow-hidden z-10"
        style={{
          top: '57.7%',
          left: '15.5%',
          width: '58.5%',
          height: '8.5%',
          fontSize: 'clamp(9px, 2.0vw, 16px)',
        }}
      >
        <span className="truncate px-1 font-bold">{fullName}</span>
      </div>

      {/* Brilho e Efeito de Cartão Canônico Plastificado */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
};
