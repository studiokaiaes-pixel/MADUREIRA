import React, { useState, useEffect } from 'react';
import { HeartHandshake, MessageSquare, CheckCircle2, Clock, Send, Lock } from 'lucide-react';
import { api } from '../api';
import { MemberRequest, User } from '../types';

interface MemberRequestsModuleProps {
  currentUser: User;
}

export const MemberRequestsModule: React.FC<MemberRequestsModuleProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<MemberRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MemberRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const list = await api.fetchMemberRequests();
      setRequests(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !responseText) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.respondMemberRequest(selectedRequest.id, responseText);
      setMessage(`Respuesta canónica remitida a ${selectedRequest.memberName || 'el solicitante'}.`);
      setSelectedRequest(null);
      setResponseText('');
      loadRequests();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'prayer_request': return { label: 'Petición de Oración', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
      case 'admin_inquiry': return { label: 'Consulta de Secretaría', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' };
      case 'suggestion': return { label: 'Sugerencia Ministerial', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
      default: return { label: 'Atención General', color: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20' };
    }
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
              CUIDADO PASTORAL & ATENCIÓN AL CIUDADANO
            </span>
          </div>
          <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
            Atención al Miembro y Peticiones
          </h1>
          <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
            Bandeja de solicitudes de oración confidenciales, consultas de secretaría canónica y acompañamiento pastoral.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 text-[14px] text-white flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-[12px] text-[#8E8E93] hover:text-white">✕</button>
        </div>
      )}

      {/* Grid de Peticiones */}
      {loading ? (
        <div className="text-center py-16 text-[#8E8E93] text-[14px]">Cargando peticiones de miembros...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 bg-[#121214] border border-white/10 rounded-3xl text-center space-y-2">
          <HeartHandshake className="w-8 h-8 text-[#8E8E93] mx-auto mb-2 opacity-50" />
          <div className="text-[16px] font-bold text-white">No hay peticiones pendientes</div>
          <p className="text-[14px] text-[#8E8E93]">Todas las consultas y peticiones de la hermandad han sido atendidas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const badge = getCategoryBadge(r.category);
            const isAnswered = r.status === 'answered' || r.status === 'closed';

            return (
              <div
                key={r.id}
                className="p-6 bg-[#121214] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {r.isConfidential && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-300 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Confidencial
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isAnswered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isAnswered ? 'RESPONDIDO' : 'ABIERTO'}
                    </span>
                  </div>

                  <span className="text-[12px] text-[#8E8E93]">
                    Remitido por: <strong className="text-white">{r.memberName || 'Miembro Institucional'}</strong> {r.memberNumber ? `(${r.memberNumber})` : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[18px] font-bold text-white tracking-tight">{r.subject}</h3>
                  <p className="text-[14px] text-neutral-300 leading-relaxed bg-[#161618] p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                    {r.description}
                  </p>
                </div>

                {r.responseText && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                      <span>Respuesta Canónica de Secretaría / Pastoral</span>
                      {r.respondedAt && <span className="font-mono text-[#8E8E93]">{new Date(r.respondedAt).toLocaleDateString()}</span>}
                    </div>
                    <div className="text-[13px] text-emerald-100 whitespace-pre-wrap leading-relaxed">{r.responseText}</div>
                  </div>
                )}

                {!isAnswered && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedRequest(r);
                        setResponseText('');
                      }}
                      className="h-[38px] px-4 text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Responder al Miembro</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Responder Petición */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-[20px] font-bold tracking-tight text-white">Responder Atención Canónica</h3>
                <p className="text-[13px] text-[#8E8E93]">Solicitante: {selectedRequest.memberName || 'Miembro'}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-[#8E8E93] hover:text-white text-[13px]">Cerrar ✕</button>
            </div>

            <div className="p-3 bg-[#1C1C1E] border border-white/10 rounded-xl text-[13px] text-neutral-300">
              <strong className="text-white block pb-1">{selectedRequest.subject}</strong>
              <p className="text-[#8E8E93] line-clamp-3">{selectedRequest.description}</p>
            </div>

            <form onSubmit={handleRespond} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Respuesta Oficial o Mensaje Pastoral</label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escriba la orientación canónica, resolución de secretaría o palabras pastorales..."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 text-[13px] text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] px-6 text-[14px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Remitir Respuesta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
