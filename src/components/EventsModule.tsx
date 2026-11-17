import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, Users, CheckCircle2, Search } from 'lucide-react';
import { api } from '../api';
import { EventItem, User } from '../types';

interface EventsModuleProps {
  currentUser: User;
}

export const EventsModule: React.FC<EventsModuleProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'service' | 'congress' | 'convention' | 'meeting' | 'seminar'>('service');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(currentUser.city ? `Templo Sede ${currentUser.city}` : 'Templo Central');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(500);
  const [responsibleName, setResponsibleName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const list = await api.fetchEvents();
      setEvents(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startsAt) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createEvent({
        congregationId: Number(currentUser.congregationId || 1),
        title,
        eventType,
        description,
        location,
        startsAt,
        endsAt: endsAt || undefined,
        maxCapacity: Number(maxCapacity) || 500,
        responsibleName: responsibleName || currentUser.name,
      });
      setMessage(`Evento "${title}" agendado formalmente.`);
      setTitle('');
      setDescription('');
      setStartsAt('');
      setEndsAt('');
      setShowModal(false);
      loadEvents();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getEventTypeLabel = (t: string) => {
    switch (t) {
      case 'service': return 'Culto Oficial';
      case 'congress': return 'Congreso';
      case 'convention': return 'Convención';
      case 'meeting': return 'Reunión Ministerial';
      case 'seminar': return 'Seminario / EBD';
      default: return 'Acto Eclesiástico';
    }
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-7 lg:p-9 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full inline-block" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                CALENDARIO ECLESIÁSTICO · {currentUser.city ? `SEDE ${currentUser.city.toUpperCase()}` : 'FILIAL LOCAL'}
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                Exclusivo de esta Filial
              </span>
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-white leading-tight">
              Cultos y Eventos de la Filial
            </h1>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-2xl">
              Agenda litúrgica, cultos solemnes de Santa Cena y actividades eclesiásticas programadas exclusivamente para esta congregación.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="h-[44px] px-5 text-[14px] font-semibold bg-white text-black hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Culto / Evento</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 text-[14px] text-white flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-[12px] text-[#8E8E93] hover:text-white">✕</button>
        </div>
      )}

      {/* Grid de Eventos */}
      {loading ? (
        <div className="text-center py-16 text-[#8E8E93] text-[14px]">Cargando calendario litúrgico...</div>
      ) : events.length === 0 ? (
        <div className="p-12 bg-[#121214] border border-white/10 rounded-3xl text-center space-y-2">
          <Calendar className="w-8 h-8 text-[#8E8E93] mx-auto mb-2 opacity-50" />
          <div className="text-[16px] font-bold text-white">No hay cultos o eventos programados</div>
          <p className="text-[14px] text-[#8E8E93]">Agende el primer culto litúrgico en el calendario.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const dateObj = new Date(e.startsAt);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : e.startsAt;
            const timeStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={e.id}
                className="p-6 bg-[#121214] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-white/20 transition-all shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {getEventTypeLabel(e.eventType)}
                    </span>
                    <span className="text-[12px] text-[#8E8E93] flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {dateStr} {timeStr ? `a las ${timeStr}h` : ''}
                    </span>
                  </div>

                  <h3 className="text-[20px] font-bold text-white tracking-tight">{e.title}</h3>
                  {e.description && (
                    <p className="text-[14px] text-[#8E8E93] leading-relaxed max-w-2xl">{e.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#8E8E93] pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {e.location || 'Templo Central'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      Capacidad: {e.maxCapacity || 500} personas
                    </span>
                    {e.responsibleName && (
                      <>
                        <span>·</span>
                        <span>Dirige: <strong className="text-white">{e.responsibleName}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-[#1C1C1E] border border-white/10 text-center">
                    <span className="text-[11px] text-[#8E8E93] block uppercase font-medium">Asistencia</span>
                    <span className="text-[18px] font-bold text-white block tabular-nums">{e.attendanceCount || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agendar Culto / Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#121214] border border-white/15 rounded-3xl p-7 lg:p-9 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-[20px] font-bold tracking-tight text-white">Agendar Culto / Evento</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8E8E93] hover:text-white text-[13px]">Cerrar ✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Título del Acto</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Culto de Santa Cena y Doctrina"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#8E8E93]">Tipo de Evento</label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="service">Culto Oficial</option>
                    <option value="congress">Congreso</option>
                    <option value="convention">Convención</option>
                    <option value="meeting">Reunión Ministerial</option>
                    <option value="seminar">Seminario / EBD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#8E8E93]">Capacidad Máxima</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10))}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#8E8E93]">Inicio (Fecha y Hora)</label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#8E8E93]">Lugar / Templo</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Templo Central"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Pastor o Dirigente Responsable</label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Ej. Pr. Alexander Vance"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#8E8E93]">Descripción Litúrgica</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Pauta bíblica, tema u ordenanzas eclesiásticas..."
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/40 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-[13px] text-[#8E8E93] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] px-6 text-[14px] font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Agendando...' : 'Confirmar Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
