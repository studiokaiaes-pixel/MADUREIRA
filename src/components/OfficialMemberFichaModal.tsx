import React, { useState, useEffect } from 'react';
import { Congregation, Member } from '../types';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import {
  formatFichaFooter,
  generateFichaPdf,
  resolveFichaChurchInfo,
} from '../utils/generateFichaPdf';

interface OfficialMemberFichaModalProps {
  member: Member;
  congregation?: Partial<Congregation> | null;
  onClose: () => void;
}

export const OfficialMemberFichaModal: React.FC<OfficialMemberFichaModalProps> = ({
  member,
  congregation: congregationProp,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadedCongregation, setLoadedCongregation] = useState<Partial<Congregation> | null>(
    congregationProp || member.congregation || null
  );

  useEffect(() => {
    let active = true;
    const initial = congregationProp || member.congregation || null;
    setLoadedCongregation(initial);

    if (!initial || (!initial.address && !initial.phone && !initial.email)) {
      const fetchCong = async () => {
        try {
          if (member.congregationId) {
            const details = await api.fetchPublicCongregationDetails(member.congregationId);
            if (active && details?.congregation) {
              setLoadedCongregation(details.congregation);
              return;
            }
          }
          const adminCong = await api.fetchAdminCongregation();
          if (active && adminCong) {
            setLoadedCongregation(adminCong);
          }
        } catch {
          // Usar valores predeterminados si no hay conexión
        }
      };
      fetchCong();
    }

    return () => {
      active = false;
    };
  }, [member.congregationId, member.congregation, congregationProp]);

  const churchInfo = resolveFichaChurchInfo(loadedCongregation);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await generateFichaPdf(member, loadedCongregation);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al generar la Ficha en PDF. Puede utilizar la opción de Imprimir.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#121214] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Barra superior de herramientas y acciones */}
        <div className="p-4 sm:px-6 bg-[#161618] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DA4814]" />
            <span className="text-[14px] font-bold text-white tracking-tight">
              Ficha Oficial de Miembro — AD Madureira España
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {success && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Descargado</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 px-3.5 rounded-xl bg-[#DA4814] hover:bg-[#e6521e] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#202024] hover:bg-[#2c2c30] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenedor del documento oficial A4 (Estilo Ficha Word entregada) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0a0a0c]">
          <div
            id="printable-official-ficha"
            className="w-full max-w-[780px] mx-auto bg-white text-black rounded-sm shadow-2xl p-8 sm:p-12 flex flex-col justify-between text-[11px] font-sans border border-neutral-300"
            style={{ minHeight: '1080px' }}
          >
            <div className="space-y-5">
              {/* ======================================================== */}
              {/* CABECERA INSTITUCIONAL OFICIAL                           */}
              {/* ======================================================== */}
              <div className="flex items-center gap-4 pt-1">
                <div className="shrink-0 w-16 sm:w-[72px]">
                  <img
                    src="/assets/aistudio/image003_7f3b24a6.png"
                    alt="Logo ADMM Madrid"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="space-y-0.5 leading-tight">
                  <h1 className="text-[15px] sm:text-[18px] font-extrabold tracking-tight text-black uppercase">
                    IGLESIA ASAMBLEA DE DIOS MINISTERIO MADUREIRA
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-bold text-black uppercase">
                    CONVENCIÓN NACIONAL DE LAS ASAMBLEAS DE DIOS (CONAMAD ESPAÑA)
                  </p>
                  <p className="text-[9.5px] sm:text-[10px] text-neutral-900">
                    NIF: <strong className="font-bold">{churchInfo.nif}</strong> · REGISTRO ENTIDADES RELIGIOSAS N.º 015482
                  </p>
                </div>
              </div>

              {/* ======================================================== */}
              {/* TÍTULO DEL DOCUMENTO                                     */}
              {/* ======================================================== */}
              <div className="text-center pt-2 pb-1">
                <h2 className="text-[18px] sm:text-[20px] font-extrabold text-black uppercase tracking-wide">
                  FICHA DE MIEMBRO
                </h2>
              </div>

              {/* ======================================================== */}
              {/* 1. DATOS PERSONALES                                      */}
              {/* ======================================================== */}
              <div>
                <h3 className="text-[11.5px] font-extrabold text-black uppercase mb-1.5">
                  1. DATOS PERSONALES
                </h3>
                <div className="border border-neutral-800 divide-y divide-neutral-800">
                  {/* Fila 1: Apellidos y Nombre */}
                  <div className="p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                      APELLIDOS Y NOMBRE
                    </span>
                    <span className="text-[11.5px] font-medium text-neutral-900">
                      {member.lastName || member.firstName
                        ? `${member.lastName || ''}${member.lastName && member.firstName ? ', ' : ''}${member.firstName || ''}`
                        : ''}
                    </span>
                  </div>

                  {/* Fila 2: DNI/NIE/Pasaporte | Fecha de Nacimiento | Nacionalidad */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-5 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        DNI / NIE / PASAPORTE
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.idDocument || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-3 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        FECHA DE NACIMIENTO
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.birthDate || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-4 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        NACIONALIDAD
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.nationality || ''}
                      </span>
                    </div>
                  </div>

                  {/* Fila 3: Teléfono / Móvil | Correo Electrónico */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-4 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        TELÉFONO / MÓVIL
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.phone || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-8 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        CORREO ELECTRÓNICO
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900 break-all">
                        {member.email || ''}
                      </span>
                    </div>
                  </div>

                  {/* Fila 4: Domicilio */}
                  <div className="p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                      DOMICILIO (CALLE, N.º, PISO)
                    </span>
                    <span className="text-[11.5px] font-medium text-neutral-900">
                      {member.address || ''}
                    </span>
                  </div>

                  {/* Fila 5: Ciudad | C.P. | Provincia */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-6 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        CIUDAD
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.city || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-2 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        C.P.
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.postalCode || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-4 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        PROVINCIA
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {(member as Member & { province?: string }).province || member.city || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 2. DATOS DE LA IGLESIA                                   */}
              {/* ======================================================== */}
              <div>
                <h3 className="text-[11.5px] font-extrabold text-black uppercase mb-1.5">
                  2. DATOS DE LA IGLESIA
                </h3>
                <div className="border border-neutral-800 divide-y divide-neutral-800">
                  {/* Fila 1: Fecha de Ingreso | Forma de Ingreso */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-4 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        FECHA DE INGRESO
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.admissionDate || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-8 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-1">
                        FORMA DE INGRESO
                      </span>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-black">
                        {(() => {
                          const isTransfer =
                            member.status === 'transferred' ||
                            (member.observations || '').toLowerCase().includes('traslado');
                          const isBaptism = !isTransfer && Boolean(member.baptismDate);
                          return (
                            <>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                                  {isBaptism ? '✓' : ''}
                                </span>
                                <span>Bautismo</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                                  {isTransfer ? '✓' : ''}
                                </span>
                                <span>Traslado</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold" />
                                <span>Otro</span>
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Iglesia de Procedencia */}
                  <div className="p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                      IGLESIA DE PROCEDENCIA (SI VIENE POR TRASLADO)
                    </span>
                    <span className="text-[11.5px] font-medium text-neutral-900">
                      {member.status === 'transferred' ? member.congregationName || '' : ''}
                    </span>
                  </div>

                  {/* Fila 3: Bautismo en Aguas | Fecha Aproximada | Lugar / Iglesia */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-4 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-1">
                        BAUTISMO EN AGUAS
                      </span>
                      <div className="flex items-center gap-4 text-[11px] text-black">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                            {member.baptismDate ? '✓' : ''}
                          </span>
                          <span>Sí</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold" />
                          <span>No</span>
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-3 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        FECHA APROXIMADA
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.baptismDate || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-5 p-2 min-h-[44px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        LUGAR / IGLESIA
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.baptismDate ? member.congregationName || '' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Fila 4: Cargo o Ministerio | Área en la que sirve */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                    <div className="sm:col-span-5 p-2 min-h-[46px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        CARGO O MINISTERIO (SI TIENE)
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.ministerialFunction || ''}
                      </span>
                    </div>
                    <div className="sm:col-span-7 p-2 min-h-[46px]">
                      <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                        ÁREA EN LA QUE SIRVE O DESEA SERVIR
                      </span>
                      <span className="text-[11.5px] font-medium text-neutral-900">
                        {member.departmentName || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 3. CONSENTIMIENTO Y FIRMA                                */}
              {/* ======================================================== */}
              <div>
                <h3 className="text-[11.5px] font-extrabold text-black uppercase mb-1.5">
                  3. CONSENTIMIENTO Y FIRMA
                </h3>
                <div className="px-2 space-y-1.5 text-[10.5px] leading-snug text-neutral-900">
                  <p>
                    Responsable: Iglesia Asamblea de Dios Ministerio Madureira (NIF {churchInfo.nif}). Finalidad: registro de miembros y atención pastoral. Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en {churchInfo.email}. Más información: RGPD (UE) 2016/679 y LOPDGDD 3/2018.
                  </p>
                  <p className="flex items-center gap-2 pt-0.5 text-[11px]">
                    <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold shrink-0">
                      {member.status === 'active' ? '✓' : ''}
                    </span>
                    <span>
                      Consiento el tratamiento de mis datos para el registro y la atención pastoral de la iglesia.
                    </span>
                  </p>
                  <p className="pt-0.5 text-[11.5px]">
                    <span>Lugar y fecha: </span>
                    <span className="inline-block min-w-[230px] border-b border-neutral-800 px-1 text-[11px]">
                      {member.city ? `${member.city}, ${todayStr}` : todayStr}
                    </span>
                  </p>
                </div>

                <div className="mt-4 border border-neutral-800 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                  <div className="p-3 min-h-[78px] flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-black">
                      FIRMA DEL MIEMBRO
                    </span>
                    <div className="w-48 border-b border-black mt-8" />
                  </div>
                  <div className="p-3 min-h-[78px] flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-black">
                      RECIBIDO POR SECRETARÍA
                    </span>
                    <div className="w-48 border-b border-black mt-8" />
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 4. USO EXCLUSIVO DE SECRETARÍA                           */}
              {/* ======================================================== */}
              <div>
                <h3 className="text-[11.5px] font-extrabold text-black uppercase mb-1.5">
                  4. USO EXCLUSIVO DE SECRETARÍA
                </h3>
                <div className="border border-neutral-800 grid grid-cols-1 sm:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
                  <div className="sm:col-span-4 p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                      N.º DE MIEMBRO
                    </span>
                    <span className="text-[11.5px] font-semibold text-neutral-900 font-mono">
                      {member.memberNumber || `MAD-${member.id.toString().padStart(4, '0')}`}
                    </span>
                  </div>
                  <div className="sm:col-span-3 p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-0.5">
                      FECHA DE REGISTRO
                    </span>
                    <span className="text-[11.5px] font-medium text-neutral-900">
                      {member.admissionDate ||
                        (member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString('es-ES')
                          : todayStr)}
                    </span>
                  </div>
                  <div className="sm:col-span-5 p-2 min-h-[44px]">
                    <span className="text-[9.5px] font-bold uppercase text-black block mb-1">
                      ESTADO
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-black">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                          {member.status === 'active' ? '✓' : ''}
                        </span>
                        <span>Activo</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                          {member.status === 'inactive' ? '✓' : ''}
                        </span>
                        <span>Inactivo</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-3 h-3 border border-neutral-800 text-[9px] leading-none font-bold">
                          {member.status === 'transferred' ? '✓' : ''}
                        </span>
                        <span>Traslado</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PIE DE PÁGINA INSTITUCIONAL                              */}
            {/* ======================================================== */}
            <div className="pt-8 mt-6">
              <div className="border-t border-neutral-800 pt-2 text-center text-[10px] text-neutral-900">
                {formatFichaFooter(churchInfo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
