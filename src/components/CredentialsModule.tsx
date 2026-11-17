import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Printer, CheckCircle2, ShieldCheck, User as UserIcon, Download, FileText } from 'lucide-react';
import { api } from '../api';
import { DigitalCredential, Member, User } from '../types';
import { generateCredentialPdf } from '../utils/generateCredentialPdf';
import { generateFichaPdf } from '../utils/generateFichaPdf';
import { OfficialMemberFichaModal } from './OfficialMemberFichaModal';

interface CredentialsModuleProps {
  currentUser: User;
}

export const CredentialsModule: React.FC<CredentialsModuleProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [credential, setCredential] = useState<DigitalCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFichaModal, setShowFichaModal] = useState(false);

  useEffect(() => {
    api
      .fetchMembers()
      .then((list) => {
        setMembers(list);
        if (list.length > 0) {
          setSelectedMember(list[0]);
          loadCredential(list[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const loadCredential = async (memberId: number) => {
    try {
      const cred = await api.fetchDigitalCredential(memberId);
      setCredential(cred);
    } catch {
      setCredential(null);
    }
  };

  const handleSelect = (m: Member) => {
    setSelectedMember(m);
    loadCredential(m.id);
  };

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.memberNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
              IDENTIFICACIÓN MINISTERIAL & CREDENCIAL CANÓNICA
            </span>
          </div>
          <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
            Credencial Digital Oficial
          </h1>
          <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
            Expedición, homologación canónica y validación de carnet digital con código QR para miembros y líderes de la Assembleia de Deus.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Selector de Miembro */}
        <div className="lg:col-span-5 bg-[#121214] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-[16px] font-bold text-white">Seleccionar Miembro</h3>
          <div className="flex items-center gap-2 bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-[13px]">
            <Search className="w-4 h-4 text-[#8E8E93]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o carnet..."
              className="bg-transparent text-white focus:outline-none w-full"
            />
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedMember?.id === m.id
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-[#161618] text-white border-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-[14px] font-bold">{m.firstName} {m.lastName}</div>
                  <div className={`text-[12px] font-mono ${selectedMember?.id === m.id ? 'text-neutral-700' : 'text-[#8E8E93]'}`}>
                    {m.memberNumber} · {m.ministerialFunction || 'Miembro'}
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  m.status === 'active'
                    ? selectedMember?.id === m.id ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {m.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta de Credencial Digital Oficial */}
        <div className="lg:col-span-7 space-y-5">
          {selectedMember ? (
            <div className="space-y-5">
              {/* Carnet Oficial Canônico Exato (Modelo MODELO_DE_TARJETA_CONAMAD_a7c79806.webp) */}
              <div className="space-y-4">
                <div className="relative w-full max-w-[620px] mx-auto aspect-[1004/650] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white select-none">
                  {/* Imagem do modelo oficial como fundo exato */}
                  <img
                    src="/assets/aistudio/MODELO_DE_TARJETA_CONAMAD_a7c79806.webp"
                    alt="Credencial Oficial AD Madureira"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  />

                  {/* Sobreposição da barra superior se não for pastor/ministro */}
                  {!(selectedMember.ministerialFunction && /pastor|evangelista|presb|ministro/i.test(selectedMember.ministerialFunction)) && (
                    <div className="absolute top-0 inset-x-0 h-[6.5%] bg-black flex items-center justify-center pointer-events-none">
                      <span className="text-white font-black tracking-wider text-[clamp(9px,1.8vw,14px)] uppercase">
                        CREDENCIAL DE MIEMBRO
                      </span>
                    </div>
                  )}

                  {/* Valor de Matrícula (restrito estritamente ao quadrado branco) */}
                  <div
                    className="absolute flex items-center justify-center font-mono font-black text-black tracking-wider overflow-hidden"
                    style={{
                      top: '47.7%',
                      left: '2.5%',
                      width: '24.0%',
                      height: '6.5%',
                      fontSize: 'clamp(9px, 1.8vw, 14px)',
                    }}
                  >
                    <span className="truncate text-center px-1">
                      {selectedMember.memberNumber || `MAD-${selectedMember.id.toString().padStart(4, '0')}`}
                    </span>
                  </div>

                  {/* Valor de Cargo (restrito estritamente ao quadrado branco - div:nth-of-type(3)) */}
                  <div
                    className="absolute flex items-center justify-center font-extrabold text-black uppercase tracking-wide overflow-hidden"
                    style={{
                      top: '47.7%',
                      left: '32.0%',
                      width: '31.5%',
                      height: '6.5%',
                      fontSize: 'clamp(8px, 1.6vw, 13px)',
                    }}
                  >
                    <span className="truncate text-center px-1">
                      {(() => {
                        const raw = selectedMember.ministerialFunction || 'MIEMBRO';
                        if (/pastor/i.test(raw)) return 'PASTOR';
                        if (/presb/i.test(raw)) return 'PRESBÍTERO';
                        if (/evangel/i.test(raw)) return 'EVANGELISTA';
                        if (/diacon/i.test(raw)) return 'DIÁCONO';
                        if (/misioner/i.test(raw)) return 'MISIONERO';
                        if (/miembro/i.test(raw)) return 'MIEMBRO';
                        return raw.toUpperCase();
                      })()}
                    </span>
                  </div>

                  {/* Valor de Iglesia (restrito estritamente ao quadrado branco) */}
                  <div
                    className="absolute flex items-center justify-center font-extrabold text-black uppercase tracking-wide overflow-hidden"
                    style={{
                      top: '47.7%',
                      left: '67.0%',
                      width: '30.0%',
                      height: '6.5%',
                      fontSize: 'clamp(8px, 1.6vw, 13px)',
                    }}
                  >
                    <span className="truncate text-center px-1">
                      {selectedMember.congregationName?.replace(/AD(M)? Madureira( — )?/i, '').replace(/Sede/i, '').trim() || selectedMember.city || 'MADRID'}
                    </span>
                  </div>

                  {/* Valor de Nombre (restrito estritamente ao quadrado branco) */}
                  <div
                    className="absolute flex items-center font-black text-black uppercase tracking-tight overflow-hidden"
                    style={{
                      top: '57.7%',
                      left: '15.5%',
                      width: '58.5%',
                      height: '8.5%',
                      fontSize: 'clamp(10px, 2.2vw, 17px)',
                    }}
                  >
                    <span className="truncate px-1">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </span>
                  </div>
                </div>

                {/* Dados complementares em ficha sóbria */}
                <div className="max-w-[620px] mx-auto p-4 bg-[#121214] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[12px] text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">CONAMAD España</span>
                    <span className="text-[#8E8E93]">• NIF: R2802896G</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8E8E93]">
                    Admissão: <strong className="text-white">{selectedMember.admissionDate || 'Ativo'}</strong> • Batismo: <strong className="text-white">{selectedMember.baptismDate || 'Confirmado'}</strong>
                  </div>
                </div>
              </div>

              {/* Botões de Ação: Gerar Ficha Oficial en PDF, Ver Ficha y Cartão */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 max-w-[620px] mx-auto">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await generateFichaPdf(selectedMember);
                    } catch {
                      setShowFichaModal(true);
                    }
                  }}
                  className="h-10 px-4 rounded-xl bg-[#DA4814] hover:bg-[#e6521e] text-white text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                  title="Generar Ficha Oficial de Miembro en PDF (Modelo Canónico A4)"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Gerar PDF (Ficha Oficial)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFichaModal(true)}
                  className="h-10 px-3.5 rounded-xl bg-white text-black text-[13px] font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-colors shadow-sm active:scale-95"
                  title="Visualizar e imprimir Ficha Oficial A4"
                >
                  <FileText className="w-4 h-4 text-black" />
                  <span>Ver Ficha A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => generateCredentialPdf(selectedMember, credential)}
                  className="h-10 px-3 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-neutral-300 hover:text-white border border-white/10 text-[12px] font-medium flex items-center gap-1.5 transition-colors active:scale-95"
                  title="Baixar Credencial plástica em formato cartão"
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Cartão</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 bg-[#121214] border border-white/10 rounded-3xl text-center text-[#8E8E93]">
              Seleccione un miembro de la lista para emitir o visualizar su credencial.
            </div>
          )}
        </div>
      </div>

      {/* Modal Ficha Oficial Canónica (Word Modelo) */}
      {showFichaModal && selectedMember && (
        <OfficialMemberFichaModal
          member={selectedMember}
          onClose={() => setShowFichaModal(false)}
        />
      )}
    </div>
  );
};
