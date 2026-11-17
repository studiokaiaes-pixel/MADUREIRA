import { jsPDF } from 'jspdf';
import { Congregation, Member } from '../types';
import { resolveFichaChurchInfo } from './generateFichaPdf';

export type LetterTemplateCode =
  | 'carta_recomendacion'
  | 'carta_traslado'
  | 'carta_presentacion'
  | 'carta_invitacion_ministerial'
  | 'carta_invitacion_evento';

export interface LetterGuestRow {
  fullName: string;
  passport: string;
  birthDate: string;
  nationality: string;
}

export interface LetterFieldValues {
  // Registro de salida común
  regNumero: string;
  regLibro: string;
  regFolio: string;
  // Datos comunes de miembro / persona
  nombreCompleto: string;
  documentoIdentidad: string;
  fechaIngreso: string;
  cargoMinisterio: string;
  // Recomendación
  destinoCiudadPais: string;
  fechaInicio: string;
  fechaRegreso: string;
  validez: string;
  // Traslado
  pastorDestino: string;
  iglesiaDestino: string;
  ciudadDestino: string;
  motivoTraslado: string;
  // Presentación
  actividadObjetivo: string;
  nombreEvento: string;
  iglesiaAnfitriona: string;
  ciudadEvento: string;
  fechaEvento: string;
  // Invitación Ministerial
  invitadoNombre: string;
  iglesiaOrigen: string;
  rolInvitado: string;
  lemaVersiculo: string;
  horaEvento: string;
  lugarEvento: string;
  participacionPrevista: string;
  condiciones: string;
  fechaLimiteConfirmacion: string;
  emailContacto: string;
  telefonoContacto: string;
  // Invitación Evento / Invitados
  nacionalidadInvitados: string;
  motivoGeneral: string;
  descripcionEvento: string;
  nombreLugar: string;
  direccionLugar: string;
  duracionVisita: string;
  guests: LetterGuestRow[];
}

export interface LetterFieldConfig {
  key: keyof Omit<LetterFieldValues, 'guests'>;
  label: string;
  placeholder: string;
  source: 'registry' | 'member' | 'request';
  required?: boolean;
  fullWidth?: boolean;
}

export interface LetterDocumentSection {
  greeting: string;
  paragraphsBeforeTable: string[];
  bullets?: string[];
  hasGuestTable?: boolean;
  paragraphsAfterTable: string[];
  closing: string;
  subHeader?: string;
}

export interface LetterTemplateDef {
  code: LetterTemplateCode;
  title: string;
  documentTitle: string;
  subtitle: string;
  badge: string;
  disabled?: boolean;
  hasGuestTable?: boolean;
  fields: LetterFieldConfig[];
  buildDocument: (params: {
    values: LetterFieldValues;
    churchName: string;
    pastorName: string;
  }) => LetterDocumentSection;
}

export const LETTER_TEMPLATES: LetterTemplateDef[] = [
  {
    code: 'carta_recomendacion',
    title: 'Carta de Recomendación',
    documentTitle: 'CARTA DE RECOMENDACIÓN',
    subtitle: 'Viaje temporal sin baja ni traslado de membresía',
    badge: 'MODELO 01',
    fields: [
      { key: 'nombreCompleto', label: 'Nombre completo del hermano/a', placeholder: '[NOMBRE COMPLETO]', source: 'member', required: true },
      { key: 'documentoIdentidad', label: 'DNI / NIE / Pasaporte N.º', placeholder: '[DNI / NIE / PASAPORTE]', source: 'member', required: true },
      { key: 'fechaIngreso', label: 'Mes / Año de ingreso', placeholder: '[MES/AÑO DE INGRESO]', source: 'member', required: true },
      { key: 'cargoMinisterio', label: 'Cargo o ministerio', placeholder: 'Miembro', source: 'member', required: true },
      { key: 'destinoCiudadPais', label: 'Ciudad / País de destino', placeholder: '[CIUDAD / PAÍS DE DESTINO]', source: 'request', required: true },
      { key: 'fechaInicio', label: 'Fecha de inicio del viaje', placeholder: '[DD/MM/AAAA]', source: 'request', required: true },
      { key: 'fechaRegreso', label: 'Fecha de regreso', placeholder: '[DD/MM/AAAA]', source: 'request', required: true },
      { key: 'validez', label: 'Validez (días: 30 / 60 / 90)', placeholder: '30', source: 'request', required: true },
    ],
    buildDocument: ({ values, churchName }) => {
      const v = (val: string, fb: string) => (val && val.trim() ? val.trim() : fb);
      const validezTxt = v(values.validez, '30');
      return {
        subHeader: `Validez: ${validezTxt} días a partir de la fecha de emisión`,
        greeting: 'A quien corresponda:',
        paragraphsBeforeTable: [
          `Por medio de la presente, la ${churchName} certifica que el/la hermano/a ${v(values.nombreCompleto, '[NOMBRE COMPLETO]')}, portador/a del ${v(values.documentoIdentidad, '[DNI / NIE / PASAPORTE N.º]')}, es miembro activo y se encuentra en plena comunión con esta congregación, donde congrega desde ${v(values.fechaIngreso, '[MES/AÑO DE INGRESO]')} y sirve como ${v(values.cargoMinisterio, '[MIEMBRO / CARGO O MINISTERIO]')}.`,
          'Durante su tiempo con nosotros ha demostrado una conducta cristiana ejemplar, fidelidad en sus deberes, amor al prójimo y compromiso con la obra del Señor, participando activamente en las actividades de la iglesia.',
          `La presente carta se emite con motivo de su viaje temporal a ${v(values.destinoCiudadPais, '[CIUDAD / PAÍS DE DESTINO]')}, previsto entre el ${v(values.fechaInicio, '[FECHA DE INICIO]')} y el ${v(values.fechaRegreso, '[FECHA DE REGRESO]')}, con el fin de recomendarlo/a para que sea recibido/a en comunión por las iglesias hermanas durante su estancia, pudiendo participar de los cultos y actividades según el orden de cada congregación.`,
          `Esta carta es de carácter temporal: no implica traslado ni baja de membresía en esta iglesia, y tiene una validez de ${validezTxt} días a partir de la fecha de emisión.`,
          'Oramos para que el Señor continúe guiándole y que su vida siga siendo de bendición dondequiera que esté. Nos ponemos a disposición para cualquier información adicional.',
        ],
        paragraphsAfterTable: [],
        closing: 'En Cristo,',
      };
    },
  },
  {
    code: 'carta_traslado',
    title: 'Carta de Traslado de Miembro',
    documentTitle: 'CARTA DE TRASLADO DE MIEMBRO',
    subtitle: 'Traslado definitivo a otra congregación',
    badge: 'MODELO 02',
    fields: [
      { key: 'pastorDestino', label: 'Nombre del pastor de destino', placeholder: '[NOMBRE DEL PASTOR DE DESTINO]', source: 'request', required: true },
      { key: 'iglesiaDestino', label: 'Iglesia de destino', placeholder: '[IGLESIA DE DESTINO]', source: 'request', required: true },
      { key: 'ciudadDestino', label: 'Ciudad de destino', placeholder: '[CIUDAD DE DESTINO]', source: 'request', required: true },
      { key: 'nombreCompleto', label: 'Nombre completo del hermano/a', placeholder: '[NOMBRE COMPLETO]', source: 'member', required: true },
      { key: 'documentoIdentidad', label: 'DNI / NIE / Pasaporte N.º', placeholder: '[DNI / NIE / PASAPORTE]', source: 'member', required: true },
      { key: 'fechaIngreso', label: 'Mes / Año de ingreso', placeholder: '[MES/AÑO DE INGRESO]', source: 'member', required: true },
      { key: 'cargoMinisterio', label: 'Cargo o ministerio', placeholder: 'Miembro', source: 'member', required: true },
      { key: 'motivoTraslado', label: 'Motivo del traslado', placeholder: 'Cambio de domicilio', source: 'request', required: true, fullWidth: true },
    ],
    buildDocument: ({ values }) => {
      const v = (val: string, fb: string) => (val && val.trim() ? val.trim() : fb);
      return {
        greeting: `Al pastor ${v(values.pastorDestino, '[NOMBRE DEL PASTOR DE DESTINO]')} y a la amada congregación de ${v(values.iglesiaDestino, '[IGLESIA DE DESTINO]')}, en ${v(values.ciudadDestino, '[CIUDAD DE DESTINO]')}:`,
        paragraphsBeforeTable: [
          `Por medio de la presente, certificamos que el/la hermano/a ${v(values.nombreCompleto, '[NOMBRE COMPLETO]')}, portador/a del ${v(values.documentoIdentidad, '[DNI / NIE / PASAPORTE N.º]')}, miembro de esta iglesia desde ${v(values.fechaIngreso, '[MES/AÑO DE INGRESO]')}, donde ha servido como ${v(values.cargoMinisterio, '[MIEMBRO / DIÁCONO / PRESBÍTERO / OTRO CARGO]')}, se encuentra en plena comunión y ha solicitado su traslado definitivo a esa congregación por motivo de ${v(values.motivoTraslado, '[CAMBIO DE DOMICILIO / OTRO MOTIVO]')}.`,
          'Durante el período en que estuvo con nosotros, demostró ser un/a fiel seguidor/a de Cristo, participando activamente en las actividades de la iglesia y sirviendo con dedicación. Su conducta cristiana, su compromiso con la fe y su amor por el prójimo fueron evidentes en su caminar con nosotros.',
          'En consecuencia, a partir de la fecha de esta carta su ficha de miembro queda dada de baja en esta congregación, a fin de que sea integrado/a oficialmente como miembro activo de esa iglesia. Rogamos que lo/la reciban en el Señor, tal como se recibe a todos los santos.',
          'Agradecemos a Dios por su vida y oramos para que continúe siendo de bendición en su nueva congregación, así como lo fue entre nosotros. Que el Señor siga guiándole y bendiciéndole en todos sus caminos.',
          'Nos ponemos a disposición para cualquier información adicional que sea necesaria, así como para facilitar su historial de membresía si así se requiere.',
        ],
        paragraphsAfterTable: [],
        closing: 'En Cristo,',
      };
    },
  },
  {
    code: 'carta_presentacion',
    title: 'Carta de Presentación',
    documentTitle: 'CARTA DE PRESENTACIÓN',
    subtitle: 'Autorización ministerial para culto, congreso o evento',
    badge: 'DESHABILITADA',
    disabled: true,
    fields: [
      { key: 'nombreCompleto', label: 'Nombre completo', placeholder: '[NOMBRE COMPLETO]', source: 'member', required: true },
      { key: 'documentoIdentidad', label: 'DNI / NIE / Pasaporte N.º', placeholder: '[DNI / NIE / PASAPORTE]', source: 'member', required: true },
      { key: 'cargoMinisterio', label: 'Sirve como', placeholder: 'Obrero / Predicador / Diácono / Cantante', source: 'member', required: true },
      { key: 'actividadObjetivo', label: 'Enviado/a para', placeholder: 'Ministrar / Predicar / Dirigir la alabanza', source: 'request', required: true },
      { key: 'nombreEvento', label: 'Nombre del culto, congreso o evento', placeholder: '[NOMBRE DEL CULTO, CONGRESO O EVENTO]', source: 'request', required: true },
      { key: 'iglesiaAnfitriona', label: 'Iglesia o lugar anfitrión', placeholder: '[IGLESIA O LUGAR ANFITRIÓN]', source: 'request', required: true },
      { key: 'ciudadEvento', label: 'Ciudad', placeholder: '[CIUDAD]', source: 'request', required: true },
      { key: 'fechaEvento', label: 'Día(s) / Fecha(s)', placeholder: '[FECHA(S)]', source: 'request', required: true },
    ],
    buildDocument: ({ values, churchName }) => {
      const v = (val: string, fb: string) => (val && val.trim() ? val.trim() : fb);
      return {
        subHeader: 'Válida únicamente para la actividad y las fechas indicadas',
        greeting: 'A quien corresponda:',
        paragraphsBeforeTable: [
          `Por medio de la presente, la ${churchName} presenta al hermano/a ${v(values.nombreCompleto, '[NOMBRE COMPLETO]')}, portador/a del ${v(values.documentoIdentidad, '[DNI / NIE / PASAPORTE N.º]')}, quien sirve en esta congregación como ${v(values.cargoMinisterio, '[OBRERO / PREDICADOR / DIÁCONO / PRESBÍTERO / CANTANTE / GRUPO DE ALABANZA]')}, en plena comunión y bajo la cobertura pastoral de esta iglesia.`,
          `La persona arriba citada ha sido enviada y autorizada por esta iglesia para ${v(values.actividadObjetivo, '[MINISTRAR / PREDICAR / DIRIGIR LA ALABANZA / REPRESENTAR A LA CONGREGACIÓN]')} en ${v(values.nombreEvento, '[NOMBRE DEL CULTO, CONGRESO O EVENTO]')}, que se celebrará en ${v(values.iglesiaAnfitriona, '[IGLESIA O LUGAR ANFITRIÓN]')}, en ${v(values.ciudadEvento, '[CIUDAD]')}, el/los día(s) ${v(values.fechaEvento, '[FECHA(S)]')}.`,
          'Damos fe de su buen testimonio cristiano, su sana doctrina y su conducta intachable, por lo que rogamos que sea recibido/a con amor fraternal y se le brinde el apoyo necesario para el ejercicio de su ministerio.',
          'Esta carta ampara únicamente la actividad y las fechas arriba indicadas. Para cualquier confirmación o información adicional, la secretaría queda a su disposición en los datos de contacto de este documento.',
        ],
        paragraphsAfterTable: [],
        closing: 'En Cristo,',
      };
    },
  },
  {
    code: 'carta_invitacion_ministerial',
    title: 'Carta de Invitación (Ministerial)',
    documentTitle: 'CARTA DE INVITACIÓN',
    subtitle: 'Invitación a pastores, predicadores, cantantes y autoridades',
    badge: 'MODELO 03',
    fields: [
      { key: 'invitadoNombre', label: 'Invitado (Pr. / Hno. / Hna. Nombre)', placeholder: '[Pr. / Hno. / Hna. NOMBRE COMPLETO]', source: 'request', required: true },
      { key: 'iglesiaOrigen', label: 'Iglesia o ministerio de origen', placeholder: '[IGLESIA O MINISTERIO DE ORIGEN]', source: 'request', required: true },
      { key: 'rolInvitado', label: 'Participar como', placeholder: 'Predicador / Ponente / Cantante / Autoridad', source: 'request', required: true },
      { key: 'nombreEvento', label: 'Nombre del evento', placeholder: 'Congreso / Aniversario / Campaña / Culto Especial', source: 'request', required: true },
      { key: 'lemaVersiculo', label: 'Lema o versículo bíblico', placeholder: '[LEMA O VERSÍCULO BÍBLICO]', source: 'request', required: true },
      { key: 'fechaEvento', label: 'Fecha(s)', placeholder: '[DÍA(S) / MES / AÑO]', source: 'request', required: true },
      { key: 'horaEvento', label: 'Hora', placeholder: '[HORA]', source: 'request', required: true },
      { key: 'lugarEvento', label: 'Lugar y dirección completa', placeholder: '[NOMBRE DEL TEMPLO O SALÓN, DIRECCIÓN, CIUDAD]', source: 'request', required: true, fullWidth: true },
      { key: 'participacionPrevista', label: 'Participación prevista', placeholder: '[PREDICACIÓN DEL DÍA X, TURNOS DE ALABANZA, ETC.]', source: 'request', required: true, fullWidth: true },
      { key: 'condiciones', label: 'Condiciones de la invitación', placeholder: '[TRANSPORTE, ALOJAMIENTO Y/O MANUTENCIÓN]', source: 'request', required: true, fullWidth: true },
      { key: 'fechaLimiteConfirmacion', label: 'Fecha límite de confirmación', placeholder: '[DD/MM/AAAA]', source: 'request', required: true },
      { key: 'emailContacto', label: 'Email de contacto', placeholder: 'secretaria@iglesia.org', source: 'request', required: true },
      { key: 'telefonoContacto', label: 'Teléfono de contacto', placeholder: '+34 600 000 000', source: 'request', required: true },
    ],
    buildDocument: ({ values, churchName }) => {
      const v = (val: string, fb: string) => (val && val.trim() ? val.trim() : fb);
      return {
        subHeader: 'Invitación a pastores, predicadores, cantantes y autoridades eclesiásticas',
        greeting: `Estimado/a ${v(values.invitadoNombre, '[Pr. / Hno. / Hna. NOMBRE COMPLETO]')}, de ${v(values.iglesiaOrigen, '[IGLESIA O MINISTERIO DE ORIGEN]')}:`,
        paragraphsBeforeTable: [
          `La ${churchName}, por medio de su pastor presidente y de su secretaría, tiene el honor de extenderle una cordial invitación para participar como ${v(values.rolInvitado, '[PREDICADOR / PONENTE / CANTANTE / GRUPO DE ALABANZA / AUTORIDAD ECLESIÁSTICA INVITADA]')} en ${v(values.nombreEvento, '[NOMBRE DEL EVENTO: CONGRESO / ANIVERSARIO / CAMPAÑA / CULTO ESPECIAL]')}, que bajo el lema «${v(values.lemaVersiculo, '[LEMA O VERSÍCULO BÍBLICO]')}» se celebrará, si el Señor lo permite, conforme al siguiente detalle:`,
        ],
        bullets: [
          `Fecha(s): ${v(values.fechaEvento, '[DÍA(S) / MES / AÑO]')}`,
          `Hora: ${v(values.horaEvento, '[HORA]')}`,
          `Lugar: ${v(values.lugarEvento, '[NOMBRE DEL TEMPLO O SALÓN], [DIRECCIÓN COMPLETA, CIUDAD]')}`,
          `Participación prevista: ${v(values.participacionPrevista, '[DETALLAR: PREDICACIÓN DEL DÍA X, TURNOS DE ALABANZA, ETC.]')}`,
        ],
        paragraphsAfterTable: [
          `Condiciones de la invitación: ${v(values.condiciones, '[INDICAR SI LA IGLESIA ASUME TRANSPORTE, ALOJAMIENTO Y/O MANUTENCIÓN, U OTRAS CONDICIONES]')}.`,
          `Será para nosotros una gran alegría y bendición contar con su presencia y ministerio. Le rogamos confirmar su disponibilidad antes del ${v(values.fechaLimiteConfirmacion, '[FECHA LÍMITE DE CONFIRMACIÓN]')}, a través del correo ${v(values.emailContacto, '[EMAIL DE CONTACTO]')} o del teléfono ${v(values.telefonoContacto, '[TELÉFONO DE CONTACTO]')}.`,
          'Confiando en el Señor y esperando contar con su grata presencia, nos despedimos con el amor de Cristo.',
        ],
        closing: 'Atentamente, en Cristo,',
      };
    },
  },
  {
    code: 'carta_invitacion_evento',
    title: 'Carta de Invitación (Invitados / Evento)',
    documentTitle: 'CARTA DE INVITACIÓN',
    subtitle: 'Invitación formal con relación de invitados y pasaportes',
    badge: 'MODELO 04',
    hasGuestTable: true,
    fields: [
      { key: 'nacionalidadInvitados', label: 'Nacionalidad de los invitados', placeholder: '[NACIONALIDAD]', source: 'request', required: true },
      { key: 'motivoGeneral', label: 'Motivo o evento (párrafo inicial)', placeholder: 'la ceremonia matrimonial de los hermanos..., miembros activos de nuestra congregación', source: 'request', required: true, fullWidth: true },
      { key: 'descripcionEvento', label: 'Descripción del evento (párrafo viaje)', placeholder: '[DESCRIPCIÓN DEL EVENTO]', source: 'request', required: true, fullWidth: true },
      { key: 'fechaEvento', label: 'Día / Fecha del evento', placeholder: '[FECHA]', source: 'request', required: true },
      { key: 'horaEvento', label: 'Hora del evento', placeholder: '[HORA]', source: 'request', required: true },
      { key: 'nombreLugar', label: 'Nombre del lugar', placeholder: '[NOMBRE DEL LUGAR]', source: 'request', required: true },
      { key: 'direccionLugar', label: 'Dirección completa, C.P. y ciudad', placeholder: '[DIRECCIÓN COMPLETA, CÓDIGO POSTAL, CIUDAD]', source: 'request', required: true, fullWidth: true },
      { key: 'duracionVisita', label: 'Duración estimada de la visita', placeholder: '[N.º DE DÍAS / SEMANAS]', source: 'request', required: true },
    ],
    buildDocument: ({ values, churchName, pastorName }) => {
      const v = (val: string, fb: string) => (val && val.trim() ? val.trim() : fb);
      return {
        subHeader: 'Esta carta tiene una validez de 30 días a partir de la fecha de emisión',
        greeting: 'A quien corresponda:',
        paragraphsBeforeTable: [
          `Yo, ${pastorName || 'Pr. Valdomiro dos Santos da Silva'}, Pastor Presidente de la ${churchName}, por medio de la presente certifico que hemos extendido una invitación formal a los siguientes ciudadanos de nacionalidad ${v(values.nacionalidadInvitados, '[NACIONALIDAD]')} para asistir a ${v(values.motivoGeneral, '[DESCRIBIR EL MOTIVO O EVENTO]')}:`,
        ],
        hasGuestTable: true,
        paragraphsAfterTable: [
          `El motivo de su viaje es asistir a ${v(values.descripcionEvento, '[DESCRIPCIÓN DEL EVENTO]')}, que se realizará el día ${v(values.fechaEvento, '[FECHA]')} a las ${v(values.horaEvento, '[HORA]')}, en ${v(values.nombreLugar, '[NOMBRE DEL LUGAR]')}, ubicado en ${v(values.direccionLugar, '[DIRECCIÓN COMPLETA, CÓDIGO POSTAL, CIUDAD]')}.`,
          `La visita será de carácter temporal, con una duración estimada de ${v(values.duracionVisita, '[N.º DE DÍAS / SEMANAS]')}, acorde a la programación del evento, tras la cual los invitados retornarán a su país de origen. Como iglesia, confirmamos que esta invitación es legítima y emitida con fines familiares y cristianos.`,
          'Nos ponemos a disposición de las autoridades competentes para cualquier información adicional.',
        ],
        closing: 'Atentamente, en Cristo,',
      };
    },
  },
];

export const ACTIVE_LETTER_TEMPLATES: LetterTemplateDef[] = LETTER_TEMPLATES.filter(
  (t) => !t.disabled
);

export function findLetterTemplate(codeOrTitle?: string): LetterTemplateDef {
  if (!codeOrTitle) return LETTER_TEMPLATES[0];
  const lower = codeOrTitle.toLowerCase();
  return (
    LETTER_TEMPLATES.find(
      (t) =>
        t.code === codeOrTitle ||
        t.title.toLowerCase() === lower ||
        (lower.includes('traslado') && t.code === 'carta_traslado') ||
        (lower.includes('mudan') && t.code === 'carta_traslado') ||
        (lower.includes('presenta') && t.code === 'carta_presentacion') ||
        (lower.includes('invitaci') && lower.includes('evento') && t.code === 'carta_invitacion_evento') ||
        (lower.includes('invitaci') && t.code === 'carta_invitacion_ministerial')
    ) || LETTER_TEMPLATES[0]
  );
}

function formatAdmissionMonthYear(raw?: string): string {
  if (!raw) return '';
  const match = raw.match(/^(\d{4})-(\d{2})/);
  if (match) return `${match[2]}/${match[1]}`;
  return raw;
}

export function createDefaultLetterValues(
  member?: Partial<Member> | null,
  congregation?: Partial<Congregation> | null
): LetterFieldValues {
  const churchInfo = resolveFichaChurchInfo(congregation);
  const fullName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : '';
  const adm = formatAdmissionMonthYear(member?.admissionDate);

  return {
    regNumero: '',
    regLibro: '',
    regFolio: '',
    nombreCompleto: fullName,
    documentoIdentidad: member?.idDocument || '',
    fechaIngreso: adm,
    cargoMinisterio: member?.ministerialFunction || 'Miembro',
    destinoCiudadPais: '',
    fechaInicio: '',
    fechaRegreso: '',
    validez: '30',
    pastorDestino: '',
    iglesiaDestino: '',
    ciudadDestino: '',
    motivoTraslado: 'Cambio de domicilio',
    actividadObjetivo: 'Ministrar',
    nombreEvento: '',
    iglesiaAnfitriona: '',
    ciudadEvento: '',
    fechaEvento: '',
    invitadoNombre: '',
    iglesiaOrigen: '',
    rolInvitado: 'Predicador invitado',
    lemaVersiculo: '',
    horaEvento: '',
    lugarEvento: `${churchInfo.name}, ${churchInfo.address}, ${churchInfo.city}`,
    participacionPrevista: '',
    condiciones: 'La iglesia asume alojamiento y manutención durante los días del evento',
    fechaLimiteConfirmacion: '',
    emailContacto: churchInfo.email,
    telefonoContacto: churchInfo.phone,
    nacionalidadInvitados: member?.nationality || '',
    motivoGeneral: '',
    descripcionEvento: '',
    nombreLugar: churchInfo.name,
    direccionLugar: `${churchInfo.address}, ${churchInfo.postalCode} ${churchInfo.city}`,
    duracionVisita: '',
    guests: [
      { fullName: '', passport: '', birthDate: '', nationality: member?.nationality || '' },
    ],
  };
}

export function buildLetterSummary(model: LetterTemplateDef, vals: LetterFieldValues): string {
  if (model.code === 'carta_recomendacion') {
    return `Destino: ${vals.destinoCiudadPais || 'Viaje temporal'} | Fechas: ${vals.fechaInicio || '—'} a ${vals.fechaRegreso || '—'} (${vals.validez || '30'} días)`;
  }
  if (model.code === 'carta_traslado') {
    return `Traslado a: ${vals.iglesiaDestino || 'Congregación destino'} (${vals.ciudadDestino || '—'})`;
  }
  if (model.code === 'carta_presentacion') {
    return `Evento: ${vals.nombreEvento || 'Ministerio'} en ${vals.iglesiaAnfitriona || '—'} (${vals.fechaEvento || '—'})`;
  }
  if (model.code === 'carta_invitacion_ministerial') {
    return `Invitado: ${vals.invitadoNombre || '—'} · ${vals.nombreEvento || 'Evento'}`;
  }
  return `Invitación evento: ${vals.descripcionEvento || vals.motivoGeneral || 'Evento'} (${vals.guests?.length || 0} invitados)`;
}

const LETTER_JSON_MARKER = '\n__LETTER_JSON__:';

export function serializeLetterObservations(
  summary: string,
  values: LetterFieldValues
): string {
  const cleanSummary = summary.trim();
  const json = JSON.stringify(values);
  return `${cleanSummary}${LETTER_JSON_MARKER}${json}`;
}

export function parseLetterObservations(raw?: string | null): {
  summary: string;
  values: Partial<LetterFieldValues> | null;
} {
  if (!raw) return { summary: '', values: null };
  const idx = raw.indexOf(LETTER_JSON_MARKER);
  if (idx === -1) {
    return { summary: raw, values: null };
  }
  const summary = raw.slice(0, idx).trim();
  try {
    const parsed = JSON.parse(raw.slice(idx + LETTER_JSON_MARKER.length)) as Partial<LetterFieldValues>;
    return { summary, values: parsed };
  } catch {
    return { summary, values: null };
  }
}

export function formatLetterHeaderAddress(congregation?: Partial<Congregation> | null): string {
  const info = resolveFichaChurchInfo(congregation);
  return `${info.address} – ${info.postalCode} ${info.city}, España`;
}

export function formatLetterFooterLine(congregation?: Partial<Congregation> | null): string {
  const info = resolveFichaChurchInfo(congregation);
  return `${info.address} – ${info.postalCode} ${info.city}, España · Tel: ${info.phone} · ${info.email}`;
}

export function formatSpanishLongDate(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()] || 'enero';
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export async function generateLetterPdf(params: {
  template: LetterTemplateDef;
  values: LetterFieldValues;
  dossierNumber?: string;
  verificationToken?: string;
  congregation?: Partial<Congregation> | null;
  pastorName?: string;
  secretaryName?: string;
  dateStr?: string;
}): Promise<void> {
  const churchInfo = resolveFichaChurchInfo(params.congregation);
  const pastorName = params.pastorName || params.congregation?.pastorName || 'Pr. Valdomiro dos Santos da Silva';
  const secretaryName = params.secretaryName || params.congregation?.secretaryName || 'Patricia Pereira Santos';

  const rendered = params.template.buildDocument({
    values: params.values,
    churchName: churchInfo.name,
    pastorName,
  });

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

  const marginX = 115;
  const contentW = 1240 - marginX * 2;

  // Cabecera oficial idéntica a las 5 cartas
  if (logoImg) {
    const logoW = 100;
    const logoH = (logoImg.height / logoImg.width) * logoW || 125;
    ctx.drawImage(logoImg, marginX, 68, logoW, logoH);
  }

  const headerTextX = marginX + 124;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('IGLESIA ASAMBLEA DE DIOS MINISTERIO MADUREIRA', headerTextX, 110);
  ctx.font = '15px Arial, sans-serif';
  ctx.fillStyle = '#4B5563';
  ctx.fillText(formatLetterHeaderAddress(params.congregation), headerTextX, 138);
  ctx.fillText(`NIF: ${churchInfo.nif}`, headerTextX, 162);

  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, 208);
  ctx.lineTo(marginX + contentW, 208);
  ctx.stroke();

  // Título centrado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText(params.template.documentTitle, 620, 265);

  let y = 300;
  if (rendered.subHeader) {
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText(rendered.subHeader, 620, 294);
    y = 330;
  }

  // Fecha
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111111';
  ctx.font = '18px Arial, sans-serif';
  const dateDisplay = params.dateStr || formatSpanishLongDate();
  ctx.fillText(`${churchInfo.city || 'Madrid'}, ${dateDisplay}`, marginX, y);
  y += 46;

  // Saludo
  ctx.fillStyle = '#111111';
  ctx.font = '18px Arial, sans-serif';
  const drawWrappedText = (text: string, x: number, maxW: number, font: string, lh: number) => {
    ctx.font = font;
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxW && line !== '') {
        ctx.fillText(line.trimEnd(), x, y);
        line = word + ' ';
        y += lh;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trimEnd(), x, y);
      y += lh;
    }
  };

  drawWrappedText(rendered.greeting, marginX, contentW, '18px Arial, sans-serif', 28);
  y += 12;

  // Párrafos iniciales
  for (const para of rendered.paragraphsBeforeTable) {
    drawWrappedText(para, marginX, contentW, '18px Arial, sans-serif', 29);
    y += 14;
  }

  // Viñetas (Modelo 4)
  if (rendered.bullets && rendered.bullets.length > 0) {
    y += 4;
    for (const b of rendered.bullets) {
      drawWrappedText(`• ${b}`, marginX + 28, contentW - 28, '17px Arial, sans-serif', 28);
      y += 4;
    }
    y += 12;
  }

  // Tabla de invitados (Modelo 5)
  if (rendered.hasGuestTable) {
    const guests = params.values.guests && params.values.guests.length > 0
      ? params.values.guests
      : [{ fullName: '[INVITADO 1]', passport: '[N.º PASAPORTE]', birthDate: '[DD/MM/AAAA]', nationality: '[NACIONALIDAD]' }];

    const colWidths = [contentW * 0.34, contentW * 0.22, contentW * 0.22, contentW * 0.22];
    const headers = ['Nombre completo', 'Pasaporte', 'Fecha de nacimiento', 'Nacionalidad'];
    const rowH = 40;

    // Cabecera de tabla
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(marginX, y, contentW, rowH);
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginX, y, contentW, rowH);

    let cx = marginX;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    headers.forEach((h, idx) => {
      if (idx > 0) {
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx, y + rowH);
        ctx.stroke();
      }
      ctx.fillText(h, cx + colWidths[idx] / 2, y + 25);
      cx += colWidths[idx];
    });
    y += rowH;

    // Filas
    ctx.font = '14px Arial, sans-serif';
    guests.forEach((g) => {
      ctx.strokeRect(marginX, y, contentW, rowH);
      let gx = marginX;
      const cells = [
        g.fullName || '—',
        g.passport || '—',
        g.birthDate || '—',
        g.nationality || '—',
      ];
      cells.forEach((val, idx) => {
        if (idx > 0) {
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.lineTo(gx, y + rowH);
          ctx.stroke();
        }
        ctx.fillText(val.slice(0, 28), gx + colWidths[idx] / 2, y + 25);
        gx += colWidths[idx];
      });
      y += rowH;
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111111';
    y += 28;
  }

  // Párrafos finales
  for (const para of rendered.paragraphsAfterTable) {
    drawWrappedText(para, marginX, contentW, '18px Arial, sans-serif', 29);
    y += 14;
  }

  // Cierre
  y += 8;
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = '#111111';
  ctx.fillText(rendered.closing, marginX, y);

  // Firmas
  const sigY = Math.max(y + 165, 1345);
  ctx.strokeStyle = '#6B7280';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX + 60, sigY);
  ctx.lineTo(marginX + 410, sigY);
  ctx.moveTo(marginX + contentW - 410, sigY);
  ctx.lineTo(marginX + contentW - 60, sigY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText(pastorName, marginX + 235, sigY + 24);
  ctx.fillText('Pastor Presidente', marginX + 235, sigY + 46);
  ctx.fillText(secretaryName, marginX + contentW - 235, sigY + 24);
  ctx.fillText('Secretaria', marginX + contentW - 235, sigY + 46);

  if (params.verificationToken || params.dossierNumber) {
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(
      `EXPEDIENTE: ${params.dossierNumber || 'OFICIAL'} · VERIFICACIÓN: ${params.verificationToken || 'VALIDADO'}`,
      620,
      1610
    );
  }

  // Pie de página
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, 1650);
  ctx.lineTo(marginX + contentW, 1650);
  ctx.stroke();

  ctx.fillStyle = '#4B5563';
  ctx.font = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(formatLetterFooterLine(params.congregation), 620, 1680);

  const pngDataUrl = canvas.toDataURL('image/png');
  doc.addImage(pngDataUrl, 'PNG', 0, 0, 210, 297);

  const safeTitle = params.template.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const personLabel =
    params.values.nombreCompleto ||
    params.values.invitadoNombre ||
    params.values.guests?.[0]?.fullName ||
    'documento';
  const safeName = personLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`${safeTitle}_${safeName}.pdf`);
}
