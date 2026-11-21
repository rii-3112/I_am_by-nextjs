export type Block =
  | { type: 'kicker'; text: string }
  | { type: 'title'; text: string }
  | { type: 'heading'; text: string; href?: string }
  | { type: 'text'; text: string; href?: string }
  | { type: 'gap' };

export type Face = {
  id: string;
  kind: 'cover' | 'endpaper' | 'paper';
  blocks: Block[];
};

export type LeafDef = {
  id: string;
  front: Face;
  back: Face;
};

const coverFace: Face = {
  id: 'cover-front',
  kind: 'cover',
  blocks: [
    { type: 'kicker', text: 'PORTFOLIO' },
    { type: 'title', text: 'rii' },
    { type: 'text', text: 'スクロールで開く' },
  ],
};

const introFace: Face = {
  id: 'intro',
  kind: 'endpaper',
  blocks: [
    { type: 'kicker', text: 'Note' },
    { type: 'title', text: 'はじめまして' },
    { type: 'text', text: '富山から、' },
    { type: 'text', text: 'セキュリティと' },
    { type: 'text', text: 'Webを書いています。' },
    { type: 'gap' },
    { type: 'text', text: 'りぃ' },
  ],
};

const aboutFace: Face = {
  id: 'about',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'About' },
    { type: 'title', text: 'りぃ' },
    { type: 'heading', text: '名前' },
    { type: 'text', text: 'りぃ' },
    { type: 'heading', text: '出身' },
    { type: 'text', text: '富山県' },
    { type: 'heading', text: '好きな食べ物' },
    { type: 'text', text: 'ラーメン' },
    { type: 'heading', text: '趣味' },
    { type: 'text', text: '動画視聴、読書' },
  ],
};

const universityFace: Face = {
  id: 'university',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'University' },
    { type: 'title', text: 'KIT' },
    { type: 'text', text: '工学部 情報工学科 3年' },
    { type: 'gap' },
    { type: 'heading', text: '課外活動' },
    { type: 'text', text: '・セキュリティアッププロジェクト' },
    { type: 'text', text: '・フードクリエーション' },
    { type: 'text', text: '　プロジェクト Web班' },
    { type: 'text', text: '・CirKit 2026年度学生リーダー' },
  ],
};

const doingFace: Face = {
  id: 'doing',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'Doing' },
    { type: 'title', text: 'いま' },
    { type: 'heading', text: '興味分野' },
    { type: 'text', text: 'セキュリティ' },
    { type: 'text', text: 'Webフロントエンド' },
    { type: 'gap' },
    { type: 'heading', text: '言語' },
    { type: 'text', text: 'Python、TypeScript' },
    { type: 'text', text: 'HTML、CSS、JavaScript' },
  ],
};

const actionLeftFace: Face = {
  id: 'action-left',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'Action' },
    { type: 'title', text: '2024–2025' },
    { type: 'heading', text: '2024' },
    { type: 'text', text: '・ミニセキュリティキャンプin石川' },
    { type: 'text', text: '・BuriKaigi2025' },
    { type: 'text', text: '・P3NFEST 2025 Winter' },
    { type: 'text', text: '・技育祭 2025 春' },
    { type: 'gap' },
    { type: 'heading', text: '2025' },
    { type: 'text', text: '・技育ハッカソン Vol.2' },
    { type: 'text', text: '・技育キャラバン in 金沢' },
    { type: 'text', text: '・Diver CTF' },
  ],
};

const actionRightFace: Face = {
  id: 'action-right',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'Action' },
    { type: 'title', text: '2025–2026' },
    { type: 'heading', text: '2025' },
    { type: 'text', text: '・技育博 Vol.3' },
    { type: 'text', text: '・STORES conference' },
    { type: 'text', text: '・TS Kaigi 北陸 2025' },
    { type: 'gap' },
    { type: 'heading', text: '2026' },
    { type: 'text', text: '・TSKaigi hokuriku 2026' },
    { type: 'text', text: '・TS Kaigi' },
  ],
};

export const projects = [
  {
    title: '時間割サイト',
    href: 'https://timetable-rii.vercel.app/',
  },
  {
    title: 'ポートフォリオ',
    href: 'https://rii-3112.pages.dev/',
  },
  {
    title: 'SonaBase',
    href: 'https://emergencyfood.vercel.app/',
  },
] as const;

const workFace: Face = {
  id: 'work',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'Work' },
    { type: 'title', text: 'つくったもの' },
    {
      type: 'heading',
      text: projects[0].title,
      href: projects[0].href,
    },
    {
      type: 'text',
      text: '一番最初に開発した、',
      href: projects[0].href,
    },
    {
      type: 'text',
      text: '保存されない時間割サイト。',
      href: projects[0].href,
    },
    { type: 'gap' },
    {
      type: 'heading',
      text: projects[1].title,
      href: projects[1].href,
    },
    {
      type: 'text',
      text: 'このノート。Next.js と Tailwind CSS。',
      href: projects[1].href,
    },
    { type: 'gap' },
    {
      type: 'heading',
      text: projects[2].title,
      href: projects[2].href,
    },
    {
      type: 'text',
      text: '非常食の管理アプリ。',
      href: projects[2].href,
    },
  ],
};

const endFace: Face = {
  id: 'end',
  kind: 'paper',
  blocks: [
    { type: 'kicker', text: 'End' },
    { type: 'title', text: 'ありがとう' },
    { type: 'text', text: '最後まで読んでくれて' },
    { type: 'text', text: 'ありがとう。' },
    { type: 'gap' },
    { type: 'text', text: 'rii_3112' },
    { type: 'text', text: '2026' },
  ],
};

export const leaves: LeafDef[] = [
  { id: 'cover', front: coverFace, back: introFace },
  { id: 'about', front: aboutFace, back: universityFace },
  { id: 'doing', front: doingFace, back: actionLeftFace },
  { id: 'action', front: actionRightFace, back: workFace },
];

export const lastPage = endFace;

export const SPREADS = [
  { id: 'cover', label: '表紙' },
  { id: 'about', label: 'About' },
  { id: 'university', label: 'University' },
  { id: 'action', label: 'Action' },
  { id: 'work', label: 'Work' },
] as const;

export const socialLinks = [
  { label: 'X', href: 'https://twitter.com/rii_3112/' },
  { label: 'GitHub', href: 'https://github.com/rii-3112' },
] as const;

export const allFaces: Face[] = [
  ...leaves.flatMap((leaf) => [leaf.front, leaf.back]),
  lastPage,
];

export function facesForSpread(index: number): Face[] {
  const clamped = Math.max(0, Math.min(index, leaves.length));
  if (clamped === 0) return [leaves[0].front];
  if (clamped === leaves.length) {
    return [leaves[leaves.length - 1].back, lastPage];
  }
  return [leaves[clamped - 1].back, leaves[clamped].front];
}
