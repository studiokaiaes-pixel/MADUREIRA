import React, { useState } from 'react';
import { X, Save, AlertCircle, Shield, CheckCircle2, User as UserIcon, MapPin, Church } from 'lucide-react';
import { api } from '../api';
import { Member, User } from '../types';

interface EditMemberFichaModalProps {
  member: Member;
  currentUser: User;
  onClose: () => void;
  onSaved: (updatedMember: Member) => void;
}

export const EditMemberFichaModal: React.FC<EditMemberFichaModalProps> = ({
  member,
  currentUser,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    firstName: member.firstName || currentUser.name.split(' ')[0] || '',
    lastName: member.lastName || currentUser.name.split(' ').slice(1).join(' ') || '',
    idDocument: member.idDocument || '',
    birthDate: member.birthDate || '',
    nationality: member.nationality || 'Española',
    phone: member.phone || '',
    email: member.email || currentUser.email || '',
    address: member.address || '',
    city: member.city || '',
    postalCode: member.postalCode || '',
    baptismDate: member.baptismDate || '',
    admissionDate: member.admissionDate || '',
    departmentName: member.departmentName || '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validación básica de campos clave para la ficha
    if (!formData.idDocument.trim()) {
      setErrorMsg('Por favor informe o seu documento de identificação (DNI, NIE ou Passaporte) para a Ficha Oficial.');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateMember(member.id, formData);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar dados:', err);
      setErrorMsg(err.message || 'Falha ao salvar as informações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera Minimalista */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-[#161619]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DA4814]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                AD MADUREIRA ESPAÑA • CONAMAD
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Membresia Aprovada
              </span>
            </div>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white tracking-tight">
              Preenchimento da Ficha Canônica Oficial
            </h2>
            <p className="text-[12px] text-[#8E8E93]">
              Sua solicitação foi aprovada pela administração da igreja. Para formalizar seu registro canônico e emitir a <strong className="text-white">Ficha de Miembro A4</strong> e a <strong className="text-white">Credencial Canônica</strong>, complete os dados abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-[13px] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bloque 1: Identificación Civil */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-white text-[13px] font-bold uppercase tracking-wider pb-1 border-b border-white/5">
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span>I. Identificação Civil &amp; Documentos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Nome de batismo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Sobrenome(s)
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Sobrenomes da família"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Documento DNI / NIE / NIF / Passaporte *
                </label>
                <input
                  type="text"
                  required
                  value={formData.idDocument}
                  onChange={(e) => setFormData({ ...formData, idDocument: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] font-mono outline-none transition-colors"
                  placeholder="Ex: Y1234567-X ou 12345678Z"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Nacionalidade
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Ex: Española, Brasileña, Portuguesa..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="membro@admadureira.es"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Domicilio y Residencia */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-white text-[13px] font-bold uppercase tracking-wider pb-1 border-b border-white/5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>II. Domicílio Habitual &amp; Localização</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-12">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Endereço Residencial (Rua, Número, Andar/Porta)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Ex: c/ Haya, 2, 3º D"
                />
              </div>

              <div className="sm:col-span-8">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Cidade / Município
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Ex: Madrid, Getafe, Móstoles..."
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] font-mono outline-none transition-colors"
                  placeholder="Ex: 28044"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Historial Eclesiástico */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-white text-[13px] font-bold uppercase tracking-wider pb-1 border-b border-white/5">
              <Church className="w-4 h-4 text-amber-400" />
              <span>III. Dados Eclesiásticos Canônicos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Data de Batismo nas Águas
                </label>
                <input
                  type="text"
                  value={formData.baptismDate}
                  onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Ex: 15/08/2020 ou Ano de Batismo"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  Data de Admissão / Recepção
                </label>
                <input
                  type="text"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#18181b] border border-white/10 focus:border-purple-500/50 text-white text-[13px] outline-none transition-colors"
                  placeholder="Ex: 10/01/2026 ou Data de Entrada"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900/80 border border-white/5 rounded-2xl flex items-start gap-3 text-[11px] text-[#8E8E93]">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              Em cumprimento ao RGPD e ao Estatuto Canônico da CONAMAD España (NIF R2802896G), estes dados são mantidos em estrito sigilo pastoral e utilizados exclusivamente para emissão de certidões, credenciais e registros de membresia.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 px-4 rounded-xl text-[13px] text-[#8E8E93] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[13px] flex items-center gap-2 shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados e Atualizar Ficha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
