import React from 'react';

export interface HumationConfig {
  head:
    | 'wavy-bob'
    | 'short-afro'
    | 'side-part'
    | 'curly-short'
    | 'bangs-bob'
    | 'fluffy-lob'
    | 'long-flowing'
    | 'top-bun'
    | 'buzzcut';
  body:
    | 'collar-shirt'
    | 'pastoral-suit'
    | 'hoodie'
    | 'crewneck'
    | 't-shirt'
    | 'dress-collar';
  item: 'none' | 'holy-bible' | 'cross-necklace' | 'badge' | 'coffee' | 'headphones';
  glasses: 'none' | 'round' | 'rect' | 'sunglasses';
  bgColor: string;
}

export const DEFAULT_HUMATION_CONFIG: HumationConfig = {
  head: 'wavy-bob',
  body: 'collar-shirt',
  item: 'none',
  glasses: 'none',
  bgColor: '#F4F4F5',
};

export const COLOR_PALETTES = [
  { name: 'Estúdio Cinza (Original)', value: '#F4F4F5', textDark: true },
  { name: 'Branco Puro', value: '#FFFFFF', textDark: true },
  { name: 'Âmbar Eclesiástico', value: '#FEF3C7', textDark: true },
  { name: 'Céu Madureira', value: '#E0F2FE', textDark: true },
  { name: 'Lavanda Pentecostal', value: '#F3E8FF', textDark: true },
  { name: 'Menta Esperança', value: '#DCFCE7', textDark: true },
  { name: 'Obsidiana Dark', value: '#18181B', textDark: false },
];

export const HEAD_OPTIONS: { id: HumationConfig['head']; label: string }[] = [
  { id: 'wavy-bob', label: 'Ondulado Bob (Humation 1)' },
  { id: 'short-afro', label: 'Afro Curto' },
  { id: 'side-part', label: 'Lateral Clássico' },
  { id: 'curly-short', label: 'Cachos Curtos' },
  { id: 'bangs-bob', label: 'Franja Reta' },
  { id: 'fluffy-lob', label: 'Médio Ondulado' },
  { id: 'long-flowing', label: 'Cabelo Longo' },
  { id: 'top-bun', label: 'Coque Alto' },
  { id: 'buzzcut', label: 'Militar / Raspado' },
];

export const BODY_OPTIONS: { id: HumationConfig['body']; label: string }[] = [
  { id: 'collar-shirt', label: 'Camisa Gola Aberta' },
  { id: 'pastoral-suit', label: 'Terno & Gravata Pastoral' },
  { id: 'hoodie', label: 'Moletom com Capuz' },
  { id: 'crewneck', label: 'Suéter Gola Careca' },
  { id: 't-shirt', label: 'Camiseta Básica' },
  { id: 'dress-collar', label: 'Gola Social Fechada' },
];

export const ITEM_OPTIONS: { id: HumationConfig['item']; label: string }[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'holy-bible', label: 'Bíblia Sagrada' },
  { id: 'cross-necklace', label: 'Cruz no Peito' },
  { id: 'badge', label: 'Credencial ADM' },
  { id: 'coffee', label: 'Café da Comunhão' },
  { id: 'headphones', label: 'Fones de Áudio' },
];

export const GLASSES_OPTIONS: { id: HumationConfig['glasses']; label: string }[] = [
  { id: 'none', label: 'Sem Óculos' },
  { id: 'round', label: 'Óculos Redondos' },
  { id: 'rect', label: 'Óculos Retangulares' },
  { id: 'sunglasses', label: 'Óculos Escuros' },
];

export function getHumationSvgCode(config: Partial<HumationConfig> = {}): string {
  const merged: HumationConfig = { ...DEFAULT_HUMATION_CONFIG, ...config };
  const { head, body, item, glasses, bgColor } = merged;

  // Renderizador SVG vetorial puro compatível com o estilo do modelo "Humation 1"
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380" width="100%" height="100%">
    <!-- Fundo Suave -->
    <rect width="300" height="380" fill="${bgColor}" rx="28"/>

    <g stroke="#000000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- 1. CORPO / ROUPA -->
      ${renderBodySvg(body)}

      <!-- 2. ACESSÓRIO / ITEM EXTRA NO CORPO -->
      ${renderItemSvg(item)}

      <!-- 3. PESCOÇO E CABEÇA -->
      <path d="M 136 215 L 136 248" />
      <path d="M 166 215 L 166 242" />

      <!-- Cabeça com contorno suave e preenchimento branco -->
      <path d="M 134 235 C 108 232, 92 195, 96 150 C 99 110, 130 90, 160 92 C 185 94, 206 120, 202 165 C 199 205, 175 234, 162 235 Z" fill="#FFFFFF" />

      <!-- 4. OLHOS (Dois pontos pretos minimalistas conforme a foto) -->
      <ellipse cx="118" cy="154" rx="4.5" ry="6.5" fill="#000000" stroke="none" />
      <ellipse cx="142" cy="158" rx="4.5" ry="6.5" fill="#000000" stroke="none" />

      <!-- 5. ÓCULOS -->
      ${renderGlassesSvg(glasses)}

      <!-- 6. CABELO (HEAD) -->
      ${renderHeadSvg(head)}
    </g>
  </svg>`;
}

function renderBodySvg(body: HumationConfig['body']): string {
  switch (body) {
    case 'pastoral-suit':
      return `
        <!-- Terno Pastoral com Gravata -->
        <path d="M 108 255 L 45 380" />
        <path d="M 194 250 L 255 380" />
        <path d="M 136 246 L 150 290 L 166 242" fill="#FFFFFF" />
        <!-- Lapelas do Terno -->
        <path d="M 108 255 L 136 315 L 150 380" fill="#000000" />
        <path d="M 194 250 L 166 315 L 150 380" fill="#000000" />
        <!-- Gravata -->
        <polygon points="144,286 156,286 160,345 150,360 140,345" fill="#000000" />
      `;

    case 'hoodie':
      return `
        <!-- Moletom / Hoodie -->
        <path d="M 116 248 C 70 265, 45 320, 40 380" />
        <path d="M 186 244 C 230 260, 255 320, 260 380" />
        <!-- Gola de capuz arredondada -->
        <path d="M 112 250 C 130 285, 172 285, 190 246" fill="#FFFFFF" />
        <!-- Cordões do capuz -->
        <path d="M 138 275 L 138 320" />
        <circle cx="138" cy="324" r="3" fill="#000000" stroke="none" />
        <path d="M 164 275 L 164 316" />
        <circle cx="164" cy="320" r="3" fill="#000000" stroke="none" />
      `;

    case 'crewneck':
      return `
        <!-- Suéter Gola Redonda -->
        <path d="M 122 250 C 75 268, 48 325, 42 380" />
        <path d="M 180 246 C 225 264, 252 325, 258 380" />
        <path d="M 124 250 C 138 270, 164 270, 178 246" stroke-width="7" />
        <path d="M 151 270 L 151 380" stroke-dasharray="8 8" />
      `;

    case 't-shirt':
      return `
        <!-- Camiseta Básica -->
        <path d="M 124 252 C 78 270, 48 325, 44 380" />
        <path d="M 178 248 C 224 266, 252 325, 256 380" />
        <path d="M 126 252 C 138 266, 164 266, 176 248" />
      `;

    case 'dress-collar':
      return `
        <!-- Blusa com Gola Peter Pan -->
        <path d="M 120 252 C 75 270, 48 325, 44 380" />
        <path d="M 182 248 C 225 266, 252 325, 256 380" />
        <path d="M 120 252 C 120 280, 150 280, 150 252 Z" fill="#FFFFFF" />
        <path d="M 182 248 C 182 278, 150 278, 150 250 Z" fill="#FFFFFF" />
        <path d="M 150 280 L 150 380" />
      `;

    case 'collar-shirt':
    default:
      // Camisa exatamente como na foto de referência (Humation 1)
      return `
        <!-- Ombros -->
        <path d="M 124 252 C 80 270, 52 325, 46 380" />
        <path d="M 178 246 C 220 265, 248 320, 254 380" />

        <!-- Gola Esquerda da Camisa -->
        <path d="M 124 252 L 112 280 L 151 268 Z" fill="#FFFFFF" />

        <!-- Gola Direita da Camisa -->
        <path d="M 178 246 L 190 272 L 151 268 Z" fill="#FFFFFF" />

        <!-- Abertura Central da Camisa -->
        <path d="M 151 268 L 151 380" />

        <!-- Detalhe de vinco direito -->
        <path d="M 210 320 L 214 380" />
      `;
  }
}

function renderItemSvg(item: HumationConfig['item']): string {
  switch (item) {
    case 'holy-bible':
      return `
        <!-- Bíblia Sagrada na mão -->
        <g transform="translate(180, 290)">
          <rect x="0" y="0" width="55" height="75" rx="6" fill="#000000" />
          <path d="M 27 18 L 27 52" stroke="#FFFFFF" stroke-width="4" />
          <path d="M 16 30 L 38 30" stroke="#FFFFFF" stroke-width="4" />
        </g>
      `;

    case 'cross-necklace':
      return `
        <!-- Cruz no Peito -->
        <path d="M 138 250 C 145 285, 155 285, 162 246" stroke="#000000" stroke-width="3" />
        <path d="M 150 285 L 150 312" stroke="#000000" stroke-width="4" />
        <path d="M 142 294 L 158 294" stroke="#000000" stroke-width="4" />
      `;

    case 'badge':
      return `
        <!-- Credencial Eclesiástica Oficial -->
        <rect x="75" y="300" width="34" height="48" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="3" />
        <rect x="80" y="306" width="14" height="14" rx="2" fill="#000000" stroke="none" />
        <line x1="80" y1="326" x2="103" y2="326" stroke="#000000" stroke-width="2" />
        <line x1="80" y1="332" x2="98" y2="332" stroke="#000000" stroke-width="2" />
      `;

    case 'coffee':
      return `
        <!-- Copo de Café Comunhão -->
        <g transform="translate(195, 305)">
          <polygon points="5,15 35,15 30,55 10,55" fill="#FFFFFF" stroke="#000000" stroke-width="4" />
          <rect x="2" y="8" width="36" height="8" rx="3" fill="#000000" />
          <path d="M 15 2 C 15 -6, 25 -6, 25 -14" stroke="#000000" stroke-width="2" />
        </g>
      `;

    case 'headphones':
      return `
        <!-- Fones no pescoço -->
        <path d="M 120 240 C 130 268, 170 268, 180 238" stroke="#000000" stroke-width="10" />
        <rect x="110" y="235" width="18" height="26" rx="8" fill="#000000" />
        <rect x="172" y="233" width="18" height="26" rx="8" fill="#000000" />
      `;

    case 'none':
    default:
      return '';
  }
}

function renderGlassesSvg(glasses: HumationConfig['glasses']): string {
  switch (glasses) {
    case 'round':
      return `
        <!-- Óculos Redondos Minimalistas -->
        <circle cx="118" cy="154" r="14" fill="none" stroke="#000000" stroke-width="4" />
        <circle cx="144" cy="158" r="14" fill="none" stroke="#000000" stroke-width="4" />
        <path d="M 132 156 L 130 156" stroke="#000000" stroke-width="4" />
        <path d="M 104 153 L 95 151" stroke="#000000" stroke-width="3" />
        <path d="M 158 158 L 180 154" stroke="#000000" stroke-width="3" />
      `;

    case 'rect':
      return `
        <!-- Óculos Retangulares -->
        <rect x="105" y="142" width="24" height="22" rx="4" fill="none" stroke="#000000" stroke-width="4" />
        <rect x="132" y="146" width="24" height="22" rx="4" fill="none" stroke="#000000" stroke-width="4" />
        <line x1="129" y1="154" x2="132" y2="154" stroke="#000000" stroke-width="4" />
      `;

    case 'sunglasses':
      return `
        <!-- Óculos Escuros -->
        <polygon points="104,144 128,144 126,168 106,168" fill="#000000" stroke="#000000" stroke-width="4" />
        <polygon points="132,148 156,148 154,172 134,172" fill="#000000" stroke="#000000" stroke-width="4" />
        <line x1="128" y1="152" x2="132" y2="152" stroke="#000000" stroke-width="5" />
      `;

    case 'none':
    default:
      return '';
  }
}

function renderHeadSvg(head: HumationConfig['head']): string {
  switch (head) {
    case 'short-afro':
      return `
        <!-- Cabelo Afro Curto e Texturizado -->
        <path d="M 96 160 C 70 140, 72 90, 105 70 C 130 50, 180 50, 205 75 C 225 95, 222 145, 198 165 C 190 140, 175 120, 150 118 C 125 116, 105 135, 96 160 Z" fill="#000000" />
      `;

    case 'side-part':
      return `
        <!-- Cabelo Liso com Divisão Lateral -->
        <path d="M 95 155 C 85 110, 110 70, 150 68 C 190 66, 215 100, 205 155 C 185 130, 170 120, 142 120 C 115 120, 100 135, 95 155 Z" fill="#000000" />
      `;

    case 'curly-short':
      return `
        <!-- Cachos Curtos Arredondados -->
        <path d="M 95 160 C 80 135, 82 85, 120 70 C 160 55, 195 75, 206 120 C 215 150, 195 165, 190 150 C 175 130, 150 120, 130 120 C 110 120, 100 140, 95 160 Z" fill="#000000" />
      `;

    case 'bangs-bob':
      return `
        <!-- Franja Reta e Laterais Lisas -->
        <path d="M 90 190 L 92 110 C 95 70, 130 65, 160 65 C 190 65, 210 75, 212 110 L 214 190 C 200 170, 195 140, 190 135 L 110 135 C 105 140, 100 170, 90 190 Z" fill="#000000" />
      `;

    case 'fluffy-lob':
      return `
        <!-- Cabelo Ondulado Médio -->
        <path d="M 92 195 C 75 160, 80 90, 120 70 C 160 50, 200 70, 212 110 C 225 150, 220 190, 205 175 C 190 140, 170 125, 145 125 C 120 125, 105 150, 92 195 Z" fill="#000000" />
      `;

    case 'long-flowing':
      return `
        <!-- Cabelo Longo Caindo pelos Ombros -->
        <path d="M 80 270 C 70 190, 80 90, 130 68 C 180 50, 220 85, 225 170 C 230 240, 225 270, 210 230 C 195 150, 175 125, 145 125 C 115 125, 95 160, 80 270 Z" fill="#000000" />
      `;

    case 'top-bun':
      return `
        <!-- Coque Alto no Topo -->
        <ellipse cx="150" cy="50" rx="30" ry="24" fill="#000000" />
        <path d="M 98 150 C 90 110, 115 80, 150 78 C 185 76, 206 105, 202 150 C 180 130, 165 120, 142 120 C 115 120, 102 135, 98 150 Z" fill="#000000" />
      `;

    case 'buzzcut':
      return `
        <!-- Corte Raspado Minimalista -->
        <path d="M 98 140 C 96 100, 120 80, 150 80 C 180 80, 204 100, 202 140 C 185 125, 165 118, 145 118 C 120 118, 105 125, 98 140 Z" fill="#000000" />
      `;

    case 'wavy-bob':
    default:
      // Exato cabelo da foto enviada pelo usuário (Humation 1 by 373)
      return `
        <!-- Cabelo Ondulado Orgânico com Curvas Volumosas à Esquerda e Direita -->
        <path d="
          M 100 152
          C 75 142, 54 130, 56 108
          C 58 84, 82 72, 102 68
          C 126 50, 168 50, 192 70
          C 214 84, 216 112, 204 134
          C 192 148, 185 156, 175 158
          C 168 140, 155 122, 138 122
          C 120 122, 108 138, 100 152 Z
        " fill="#000000" />
        <!-- Mechas soltas laterais características do Humation -->
        <path d="M 62 118 C 50 128, 54 148, 68 155 C 78 160, 88 152, 92 142" fill="#000000" stroke="#000000" stroke-width="4" />
        <path d="M 194 132 C 205 140, 205 158, 192 165 C 182 170, 176 160, 174 150" fill="#000000" stroke="#000000" stroke-width="4" />
      `;
  }
}

export function generateHumationDataUrl(config: Partial<HumationConfig> = {}): string {
  const svg = getHumationSvgCode(config);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_HUMATION_DATA_URL = generateHumationDataUrl(DEFAULT_HUMATION_CONFIG);

interface HumationAvatarProps {
  config?: Partial<HumationConfig>;
  className?: string;
  onClick?: () => void;
}

export const HumationAvatar: React.FC<HumationAvatarProps> = ({
  config = DEFAULT_HUMATION_CONFIG,
  className = 'w-full h-full',
  onClick,
}) => {
  const svgString = getHumationSvgCode(config);

  return (
    <div
      onClick={onClick}
      className={`inline-block overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
