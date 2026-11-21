import { CharacterId, CharacterPose, SceneCharacterSpec } from '../types/studio';
import { PALETTE, drawRoundedRectPath } from './chalkAndFx';

export type GestureMode =
  | 'converse'
  | 'argue'
  | 'shock'
  | 'think-pace'
  | 'search'
  | 'celebrate'
  | 'work'
  | 'violin'
  | 'cradle'
  | 'walk'
  | 'run';

export interface CharacterActingState {
  poseOverride?: CharacterPose;
  expressionOverride?: SceneCharacterSpec['expression'];
  gestureMode?: GestureMode;
  walkOffsetX?: number;
  hopY?: number;
  torsoLean?: number;
  headYaw?: number; // -1..1
  talkingActive?: boolean;
  audioAmplitude?: number;
  excitement?: number; // 0..1
  quoteOverride?: string;
}

interface CharacterAppearance {
  kind: 'human' | 'baby' | 'foton' | 'kompas' | 'netijen' | 'silhouette' | 'newton-ghost';
  skin: string;
  skinHighlight: string;
  skinShadow: string;
  cheekColor: string;
  irisColor: string;
  hairColor: string;
  hairHighlight?: string;
  hairStyle:
    | 'baby-curl'
    | 'boy-curly'
    | 'teen-wavy'
    | 'patent-thick'
    | 'berlin-wild'
    | 'berlin-gray'
    | 'old-wild'
    | 'bun-high'
    | 'bun-low'
    | 'side-part'
    | 'bald-fringed'
    | 'short-neat'
    | 'pith-helmet'
    | 'fedora'
    | 'work-cap'
    | 'small-hat';
  outfitColor: string;
  outfitHighlight: string;
  outfitShadow: string;
  outfitStyle: 'vest-shorts' | 'jacket' | 'suit-tie' | 'dress' | 'sweater' | 'lab-coat' | 'tropical' | 'wheelchair';
  glasses?: 'round' | 'small' | 'pince-nez' | 'sunglasses' | 'hanging';
  moustache?: 'none' | 'thin' | 'bushy' | 'white-big' | 'beard-white' | 'beard-trim';
  headScale?: number;
  heightScale?: number;
  eyeBags?: boolean;
  isFemale?: boolean;
}

const APPEARANCES: Record<CharacterId, CharacterAppearance> = {
  'albert-baby': {
    kind: 'baby',
    skin: '#FFE0C6',
    skinHighlight: '#FFF1E5',
    skinShadow: '#E5AE87',
    cheekColor: 'rgba(255, 118, 140, 0.42)',
    irisColor: '#3B2516',
    hairColor: '#1E1E26',
    hairStyle: 'baby-curl',
    outfitColor: '#F5F5F0',
    outfitHighlight: '#FFFFFF',
    outfitShadow: '#CBD5E1',
    outfitStyle: 'vest-shorts',
    moustache: 'none',
    headScale: 1.38,
    heightScale: 0.58,
  },
  'albert-boy': {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#DF9F77',
    cheekColor: 'rgba(255, 118, 136, 0.36)',
    irisColor: '#432818',
    hairColor: '#1E1E26',
    hairStyle: 'boy-curly',
    outfitColor: '#475569',
    outfitHighlight: '#64748B',
    outfitShadow: '#283548',
    outfitStyle: 'vest-shorts',
    moustache: 'none',
    headScale: 1.08,
    heightScale: 0.82,
  },
  'albert-teen': {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#DC9F78',
    cheekColor: 'rgba(255, 120, 135, 0.25)',
    irisColor: '#432818',
    hairColor: '#1E1E26',
    hairStyle: 'teen-wavy',
    outfitColor: '#64748B',
    outfitHighlight: '#94A3B8',
    outfitShadow: '#334155',
    outfitStyle: 'jacket',
    moustache: 'none',
    heightScale: 0.96,
  },
  'albert-patent': {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D99B74',
    cheekColor: 'rgba(244, 114, 128, 0.2)',
    irisColor: '#3E2723',
    hairColor: '#1E1E26',
    hairStyle: 'patent-thick',
    outfitColor: '#4B5563',
    outfitHighlight: '#6B7280',
    outfitShadow: '#27303D',
    outfitStyle: 'suit-tie',
    moustache: 'thin',
    heightScale: 1.0,
  },
  'albert-berlin': {
    kind: 'human',
    skin: '#F5C9A6',
    skinHighlight: '#FFE0C8',
    skinShadow: '#C98A63',
    cheekColor: 'rgba(235, 110, 120, 0.18)',
    irisColor: '#3E2723',
    hairColor: '#64748B',
    hairHighlight: PALETTE.einsteinYellow,
    hairStyle: 'berlin-wild',
    outfitColor: '#334155',
    outfitHighlight: '#4E627C',
    outfitShadow: '#162030',
    outfitStyle: 'suit-tie',
    glasses: 'hanging',
    moustache: 'bushy',
    eyeBags: true,
    heightScale: 1.02,
  },
  'albert-berlin-gray': {
    kind: 'human',
    skin: '#F5C9A6',
    skinHighlight: '#FFE0C8',
    skinShadow: '#C88B65',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#3E2723',
    hairColor: '#CBD5E1',
    hairHighlight: PALETTE.einsteinYellow,
    hairStyle: 'berlin-gray',
    outfitColor: '#334155',
    outfitHighlight: '#4E627C',
    outfitShadow: '#162030',
    outfitStyle: 'suit-tie',
    glasses: 'hanging',
    moustache: 'bushy',
    eyeBags: true,
    heightScale: 1.02,
  },
  'albert-old': {
    kind: 'human',
    skin: '#F5C9A6',
    skinHighlight: '#FFE0C8',
    skinShadow: '#C68963',
    cheekColor: 'rgba(235, 115, 125, 0.22)',
    irisColor: '#3B2516',
    hairColor: '#F5F5F0',
    hairHighlight: '#FEF08A',
    hairStyle: 'old-wild',
    outfitColor: '#94A3B8',
    outfitHighlight: '#CBD5E1',
    outfitShadow: '#475569',
    outfitStyle: 'sweater',
    moustache: 'white-big',
    eyeBags: true,
    heightScale: 0.98,
  },
  mileva: {
    kind: 'human',
    skin: '#F5CEB0',
    skinHighlight: '#FFE6D4',
    skinShadow: '#CE9670',
    cheekColor: 'rgba(244, 114, 148, 0.28)',
    irisColor: '#2B1D14',
    hairColor: '#18181B',
    hairStyle: 'bun-low',
    outfitColor: '#1E3A8A',
    outfitHighlight: '#3B82F6',
    outfitShadow: '#111E4D',
    outfitStyle: 'dress',
    moustache: 'none',
    heightScale: 0.96,
    isFemale: true,
  },
  marcel: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(244, 114, 128, 0.2)',
    irisColor: '#1E3A5F',
    hairColor: '#3F2E21',
    hairStyle: 'side-part',
    outfitColor: '#1E3A5F',
    outfitHighlight: '#335D94',
    outfitShadow: '#102138',
    outfitStyle: 'suit-tie',
    glasses: 'round',
    moustache: 'none',
  },
  pauline: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(244, 114, 148, 0.28)',
    irisColor: '#3E2723',
    hairColor: '#5C3A21',
    hairHighlight: '#92623A',
    hairStyle: 'bun-high',
    outfitColor: '#312E81',
    outfitHighlight: '#4F46E5',
    outfitShadow: '#19164A',
    outfitStyle: 'dress',
    moustache: 'none',
    isFemale: true,
  },
  hermann: {
    kind: 'human',
    skin: '#F7C9A7',
    skinHighlight: '#FFE0C8',
    skinShadow: '#CE8F68',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#3E2723',
    hairColor: '#3F2E21',
    hairStyle: 'side-part',
    outfitColor: '#57534E',
    outfitHighlight: '#78716C',
    outfitShadow: '#292524',
    outfitStyle: 'suit-tie',
    moustache: 'bushy',
  },
  maja: {
    kind: 'baby',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D99E79',
    cheekColor: 'rgba(255, 118, 152, 0.42)',
    irisColor: '#3B2516',
    hairColor: '#27272A',
    hairStyle: 'baby-curl',
    outfitColor: '#F472B6',
    outfitHighlight: '#F9A8D4',
    outfitShadow: '#BE185D',
    outfitStyle: 'dress',
    heightScale: 0.56,
    isFemale: true,
  },
  jakob: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.22)',
    irisColor: '#3E2723',
    hairColor: '#4B5563',
    hairStyle: 'work-cap',
    outfitColor: '#475569',
    outfitHighlight: '#64748B',
    outfitShadow: '#1E293B',
    outfitStyle: 'jacket',
    moustache: 'beard-trim',
  },
  minkowski: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#1E293B',
    hairColor: '#374151',
    hairStyle: 'side-part',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090E17',
    outfitStyle: 'suit-tie',
    moustache: 'bushy',
  },
  weber: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#334155',
    hairColor: '#E2E8F0',
    hairStyle: 'bald-fringed',
    outfitColor: '#334155',
    outfitHighlight: '#475569',
    outfitShadow: '#151E2C',
    outfitStyle: 'suit-tie',
    glasses: 'small',
    moustache: 'beard-white',
  },
  eddington: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 115, 125, 0.24)',
    irisColor: '#1D4ED8',
    hairColor: '#78350F',
    hairStyle: 'pith-helmet',
    outfitColor: '#E7D8B9',
    outfitHighlight: '#F7EEDB',
    outfitShadow: '#B5A179',
    outfitStyle: 'tropical',
    glasses: 'round',
    moustache: 'none',
  },
  elsa: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(244, 114, 148, 0.26)',
    irisColor: '#432818',
    hairColor: '#94A3B8',
    hairStyle: 'bun-low',
    outfitColor: '#7C2D12',
    outfitHighlight: '#B45309',
    outfitShadow: '#431407',
    outfitStyle: 'dress',
    moustache: 'none',
    isFemale: true,
  },
  planck: {
    kind: 'human',
    skin: '#F5C9A6',
    skinHighlight: '#FFE0C8',
    skinShadow: '#C88C65',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#1E3A8A',
    hairColor: '#CBD5E1',
    hairStyle: 'bald-fringed',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090E17',
    outfitStyle: 'suit-tie',
    glasses: 'round',
    moustache: 'beard-trim',
  },
  szilard: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.18)',
    irisColor: '#2B1D14',
    hairColor: '#1F2937',
    hairStyle: 'short-neat',
    outfitColor: '#64748B',
    outfitHighlight: '#94A3B8',
    outfitShadow: '#334155',
    outfitStyle: 'jacket',
    moustache: 'none',
  },
  roosevelt: {
    kind: 'human',
    skin: '#F5C9A6',
    skinHighlight: '#FFE0C8',
    skinShadow: '#C88C65',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#1E3A8A',
    hairColor: '#94A3B8',
    hairStyle: 'fedora',
    outfitColor: '#334155',
    outfitHighlight: '#475569',
    outfitShadow: '#141D2B',
    outfitStyle: 'wheelchair',
    glasses: 'pince-nez',
    moustache: 'none',
  },
  foton: {
    kind: 'foton',
    skin: PALETTE.einsteinYellow,
    skinHighlight: '#FFF6A3',
    skinShadow: '#D97706',
    cheekColor: 'rgba(255, 61, 129, 0.35)',
    irisColor: '#0F1B2D',
    hairColor: PALETTE.einsteinYellow,
    hairStyle: 'short-neat',
    outfitColor: PALETTE.einsteinYellow,
    outfitHighlight: '#FEF08A',
    outfitShadow: '#CA8A04',
    outfitStyle: 'jacket',
  },
  kompas: {
    kind: 'kompas',
    skin: '#F5F5F0',
    skinHighlight: '#FFFFFF',
    skinShadow: '#CBD5E1',
    cheekColor: 'rgba(255, 61, 129, 0.3)',
    irisColor: '#0F1B2D',
    hairColor: PALETTE.einsteinYellow,
    hairStyle: 'short-neat',
    outfitColor: PALETTE.einsteinYellow,
    outfitHighlight: '#FEF08A',
    outfitShadow: '#B45309',
    outfitStyle: 'jacket',
  },
  netijen: {
    kind: 'netijen',
    skin: PALETTE.electricBlue,
    skinHighlight: '#7CC4FF',
    skinShadow: '#1D4ED8',
    cheekColor: 'rgba(255, 61, 129, 0.45)',
    irisColor: '#FFFFFF',
    hairColor: '#0F172A',
    hairStyle: 'short-neat',
    outfitColor: PALETTE.notifPink,
    outfitHighlight: '#FF7AA8',
    outfitShadow: '#9D174D',
    outfitStyle: 'sweater',
    glasses: 'sunglasses',
  },
  narrator: {
    kind: 'silhouette',
    skin: '#1E293B',
    skinHighlight: '#334155',
    skinShadow: '#090F1A',
    cheekColor: 'transparent',
    irisColor: '#FFD60A',
    hairColor: '#0F172A',
    hairStyle: 'short-neat',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090F1A',
    outfitStyle: 'suit-tie',
    glasses: 'sunglasses',
  },
  talmey: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#3E2723',
    hairColor: '#4B5563',
    hairStyle: 'short-neat',
    outfitColor: '#6B7280',
    outfitHighlight: '#9CA3AF',
    outfitShadow: '#374151',
    outfitStyle: 'jacket',
    glasses: 'round',
  },
  teacher: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#1E293B',
    hairColor: '#1F2937',
    hairStyle: 'side-part',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090E17',
    outfitStyle: 'suit-tie',
    moustache: 'bushy',
  },
  headmaster: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#1E293B',
    hairColor: '#6B7280',
    hairStyle: 'bald-fringed',
    outfitColor: '#1F2937',
    outfitHighlight: '#374151',
    outfitShadow: '#0B0F17',
    outfitStyle: 'suit-tie',
    moustache: 'beard-trim',
  },
  doctor: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#1E3A8A',
    hairColor: '#4B5563',
    hairStyle: 'side-part',
    outfitColor: '#F5F5F0',
    outfitHighlight: '#FFFFFF',
    outfitShadow: '#CBD5E1',
    outfitStyle: 'lab-coat',
    glasses: 'small',
  },
  'director-eth': {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.18)',
    irisColor: '#334155',
    hairColor: '#64748B',
    hairStyle: 'side-part',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090E17',
    outfitStyle: 'suit-tie',
    glasses: 'round',
    moustache: 'beard-trim',
  },
  winteler: {
    kind: 'human',
    skin: '#F7D0B2',
    skinHighlight: '#FFE7D4',
    skinShadow: '#CF9772',
    cheekColor: 'rgba(235, 125, 130, 0.26)',
    irisColor: '#1E3A8A',
    hairColor: '#475569',
    hairStyle: 'side-part',
    outfitColor: '#2B4268',
    outfitHighlight: '#3D5D92',
    outfitShadow: '#152238',
    outfitStyle: 'sweater',
    moustache: 'thin',
  },
  solovine: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#3E2723',
    hairColor: '#27272A',
    hairStyle: 'small-hat',
    outfitColor: '#475569',
    outfitHighlight: '#64748B',
    outfitShadow: '#1E293B',
    outfitStyle: 'jacket',
    glasses: 'round',
  },
  habicht: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#3E2723',
    hairColor: '#3F2E21',
    hairStyle: 'side-part',
    outfitColor: '#334155',
    outfitHighlight: '#475569',
    outfitShadow: '#151E2C',
    outfitStyle: 'jacket',
  },
  'hans-baby': {
    kind: 'baby',
    skin: '#FFE0C6',
    skinHighlight: '#FFF1E5',
    skinShadow: '#E5AE87',
    cheekColor: 'rgba(255, 118, 140, 0.42)',
    irisColor: '#3B2516',
    hairColor: '#27272A',
    hairStyle: 'baby-curl',
    outfitColor: '#93C5FD',
    outfitHighlight: '#DBEAFE',
    outfitShadow: '#3B82F6',
    outfitStyle: 'sweater',
    heightScale: 0.55,
  },
  'hans-child': {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#DF9F77',
    cheekColor: 'rgba(255, 118, 136, 0.36)',
    irisColor: '#3B2516',
    hairColor: '#1E1E26',
    hairStyle: 'boy-curly',
    outfitColor: '#475569',
    outfitHighlight: '#64748B',
    outfitShadow: '#283548',
    outfitStyle: 'vest-shorts',
    heightScale: 0.72,
  },
  besso: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.22)',
    irisColor: '#3E2723',
    hairColor: '#3F2E21',
    hairStyle: 'small-hat',
    outfitColor: '#475569',
    outfitHighlight: '#64748B',
    outfitShadow: '#1E293B',
    outfitStyle: 'jacket',
    moustache: 'thin',
  },
  hilbert: {
    kind: 'human',
    skin: '#F5C49E',
    skinHighlight: '#FFDCC1',
    skinShadow: '#C78A62',
    cheekColor: 'rgba(235, 110, 120, 0.16)',
    irisColor: '#1E3A8A',
    hairColor: '#CBD5E1',
    hairStyle: 'bald-fringed',
    outfitColor: '#64748B',
    outfitHighlight: '#94A3B8',
    outfitShadow: '#334155',
    outfitStyle: 'suit-tie',
    glasses: 'round',
    moustache: 'beard-trim',
  },
  meitner: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(244, 114, 148, 0.25)',
    irisColor: '#2B1D14',
    hairColor: '#27272A',
    hairStyle: 'bun-low',
    outfitColor: '#F5F5F0',
    outfitHighlight: '#FFFFFF',
    outfitShadow: '#CBD5E1',
    outfitStyle: 'lab-coat',
    glasses: 'round',
    isFemale: true,
  },
  hubble: {
    kind: 'human',
    skin: '#FCD5B5',
    skinHighlight: '#FFE8D4',
    skinShadow: '#D89E79',
    cheekColor: 'rgba(235, 110, 120, 0.2)',
    irisColor: '#1E3A5F',
    hairColor: '#3F2E21',
    hairStyle: 'side-part',
    outfitColor: '#334155',
    outfitHighlight: '#475569',
    outfitShadow: '#141D2B',
    outfitStyle: 'suit-tie',
  },
  'quantum-debater': {
    kind: 'human',
    skin: '#E2E8F0',
    skinHighlight: '#F8FAFC',
    skinShadow: '#94A3B8',
    cheekColor: 'rgba(45, 156, 255, 0.22)',
    irisColor: '#0F172A',
    hairColor: '#1E293B',
    hairStyle: 'side-part',
    outfitColor: '#1E293B',
    outfitHighlight: '#334155',
    outfitShadow: '#090F1A',
    outfitStyle: 'suit-tie',
    glasses: 'round',
  },
  'newton-ghost': {
    kind: 'newton-ghost',
    skin: 'rgba(254, 240, 138, 0.82)',
    skinHighlight: 'rgba(255, 253, 214, 0.95)',
    skinShadow: 'rgba(234, 179, 8, 0.55)',
    cheekColor: 'rgba(255, 255, 255, 0.25)',
    irisColor: '#713F12',
    hairColor: 'rgba(254, 240, 138, 0.92)',
    hairStyle: 'teen-wavy',
    outfitColor: 'rgba(250, 204, 21, 0.55)',
    outfitHighlight: 'rgba(254, 249, 195, 0.8)',
    outfitShadow: 'rgba(202, 138, 4, 0.45)',
    outfitStyle: 'jacket',
  },
  silhouette: {
    kind: 'silhouette',
    skin: '#2B4268',
    skinHighlight: '#436496',
    skinShadow: '#16243D',
    cheekColor: 'transparent',
    irisColor: '#FFFFFF',
    hairColor: '#2B4268',
    hairStyle: 'short-neat',
    outfitColor: '#2B4268',
    outfitHighlight: '#436496',
    outfitShadow: '#15233B',
    outfitStyle: 'suit-tie',
  },
};

function makeClayRadial(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  highlight: string,
  base: string,
  shadow: string
) {
  const g = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.36, r * 0.08, cx, cy, r * 1.15);
  g.addColorStop(0, highlight);
  g.addColorStop(0.55, base);
  g.addColorStop(1, shadow);
  return g;
}

function makeClayLinear(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  highlight: string,
  base: string,
  shadow: string
) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, highlight);
  g.addColorStop(0.45, base);
  g.addColorStop(1, shadow);
  return g;
}

/** 2-Bone Analytical Inverse Kinematics for natural elbow & knee bending */
function solveTwoBoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  len1: number,
  len2: number,
  bendSign: number // +1 or -1 determines elbow/knee bend direction
): { midX: number; midY: number; endX: number; endY: number } {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const rawDist = Math.hypot(dx, dy);
  const minDist = Math.abs(len1 - len2) + 2;
  const maxDist = len1 + len2 - 1;
  const dist = Math.max(minDist, Math.min(maxDist, rawDist));

  const baseAngle = Math.atan2(dy, dx);
  const cosAngle1 = Math.max(
    -1,
    Math.min(1, (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist))
  );
  const angle1 = baseAngle + bendSign * Math.acos(cosAngle1);

  const midX = rootX + Math.cos(angle1) * len1;
  const midY = rootY + Math.sin(angle1) * len1;

  // Preserve reachable end position
  const reachRatio = rawDist > 0.001 ? dist / rawDist : 1;
  const endX = rootX + dx * Math.min(1, reachRatio);
  const endY = rootY + dy * Math.min(1, reachRatio);

  return { midX, midY, endX, endY };
}

/** Draws a smooth volumetric tapered limb capsule along root -> mid -> end */
function drawArticulatedLimb(
  ctx: CanvasRenderingContext2D,
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  widthTop: number,
  widthBottom: number,
  highlight: string,
  base: string,
  shadow: string,
  handColor: string,
  handRadius: number,
  isLeg = false,
  facingSign = 1,
  shoeAngle = 0
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Crisp white 2.5D sticker outer stroke
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = widthTop + 10;
  ctx.beginPath();
  ctx.moveTo(p0x, p0y);
  ctx.quadraticCurveTo(p1x, p1y, p2x, p2y);
  ctx.stroke();

  // Inner volumetric shaded core
  const g = makeClayLinear(ctx, p0x - 12, p0y, p2x + 12, p2y, highlight, base, shadow);
  ctx.strokeStyle = g;
  ctx.lineWidth = (widthTop + widthBottom) * 0.5;
  ctx.beginPath();
  ctx.moveTo(p0x, p0y);
  ctx.quadraticCurveTo(p1x, p1y, p2x, p2y);
  ctx.stroke();

  // Specular highlight ribbon along upper edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = Math.max(3, widthBottom * 0.22);
  ctx.beginPath();
  ctx.moveTo(p0x - 3, p0y - 2);
  ctx.quadraticCurveTo(p1x - 3, p1y - 2, p2x - 2, p2y - 2);
  ctx.stroke();

  if (isLeg) {
    // 2.5D Volumetric Shoe with articulated heel-toe tilt
    const dir = facingSign >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(p2x + dir * 6, p2y + 4);
    ctx.rotate(shoeAngle);
    ctx.fillStyle = PALETTE.chalkWhite;
    drawRoundedRectPath(ctx, -20, -14, 42, 24, 12);
    ctx.fill();

    const shoeGrad = makeClayLinear(ctx, -16, -12, 18, 12, '#334155', '#1E293B', '#090D16');
    ctx.fillStyle = shoeGrad;
    drawRoundedRectPath(ctx, -16, -10, 34, 17, 9);
    ctx.fill();

    // Sole + top gloss
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    drawRoundedRectPath(ctx, -10, -8, 16, 4, 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Sculpted 3D Clay Hand + Thumb
    ctx.save();
    ctx.translate(p2x, p2y);
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.beginPath();
    ctx.arc(0, 0, handRadius + 4.5, 0, Math.PI * 2);
    ctx.fill();

    const hg = makeClayRadial(ctx, 0, 0, handRadius, '#FFF3E8', handColor, '#C88D67');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
    ctx.fill();

    // Little thumb nub for organic human hand read
    ctx.beginPath();
    ctx.arc(facingSign * handRadius * 0.58, -handRadius * 0.4, handRadius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawStickerPath(
  ctx: CanvasRenderingContext2D,
  drawPath: () => void,
  fill: string | CanvasGradient,
  outlineWidth = 10
) {
  ctx.save();
  drawPath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = outlineWidth;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawQuoteBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
) {
  ctx.save();
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(text).width;
  const w = Math.max(150, tw + 44);
  const h = 56;
  ctx.translate(x, y);

  // Soft 2.5D shadow
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  drawRoundedRectPath(ctx, -w / 2 + 5, -h + 7, w, h, 18);
  ctx.fill();

  // Bubble gradient
  const bg = makeClayLinear(ctx, 0, -h, 0, 0, '#FFFFFF', '#F5F5F0', '#DCE3ED');
  ctx.fillStyle = bg;
  ctx.strokeStyle = PALETTE.navyDeep;
  ctx.lineWidth = 4;
  drawRoundedRectPath(ctx, -w / 2, -h, w, h, 18);
  ctx.fill();
  ctx.stroke();

  // Tail pointing to speaker
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.lineTo(0, 14);
  ctx.lineTo(14, -2);
  ctx.closePath();
  ctx.fillStyle = '#E6EBF2';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = PALETTE.navyDeep;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -h / 2 + 1);
  ctx.restore();
}

function inferPose(spec: SceneCharacterSpec): CharacterPose {
  if (spec.pose) return spec.pose;
  const p = spec.prop ?? '';
  if (p === 'violin') return 'violin';
  if (p === 'baby-albert') return 'cradle';
  if (p === 'telescope' || p === 'microscope') return 'point';
  if (
    p === 'euclid-book' ||
    p === 'science-books' ||
    p === 'tidy-notebook' ||
    p === 'tensor-book' ||
    p === 'notebook' ||
    p === 'sausage-book' ||
    p === 'tea-book' ||
    p === 'aarau-brochure' ||
    p === 'exam-sheet' ||
    p === 'exam-result' ||
    p === 'phone' ||
    p === 'journal'
  ) {
    return 'read';
  }
  if (p === 'chalk' || p === 'pointer' || p === 'paper-pen' || p === 'pen-letter') {
    return 'write';
  }
  if (spec.expression === 'worried' || spec.expression === 'panicked') return 'think';
  if (spec.expression === 'curious') return 'think';
  if (spec.id === 'foton' || spec.id === 'kompas' || spec.id === 'newton-ghost') return 'float';
  return 'stand';
}

function drawProp25D(
  ctx: CanvasRenderingContext2D,
  prop: string,
  timeSec: number,
  handX: number,
  handY: number,
  lookDir: number,
  isSilentFreeze: boolean
) {
  ctx.save();
  switch (prop) {
    case 'baby-albert': {
      // Plump swaddled baby Albert held in cradled arms!
      const bob = isSilentFreeze ? 0 : Math.sin(timeSec * 3.5) * 3;
      ctx.save();
      ctx.translate(0, -210 + bob);
      // Swaddle wrap
      const wrapG = makeClayRadial(ctx, 0, 8, 42, '#FFFFFF', '#F5F5F0', '#CBD5E1');
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.ellipse(0, 12, 46, 30, 0.12, 0, Math.PI * 2);
        },
        wrapG,
        8
      );
      // Oversized baby head peeking out
      const headG = makeClayRadial(ctx, -32, -8, 36, '#FFF1E5', '#FFE0C6', '#E5AE87');
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.arc(-32, -8, 34, 0, Math.PI * 2);
        },
        headG,
        8
      );
      // Tiny dark curl on top
      ctx.fillStyle = '#1E1E26';
      ctx.beginPath();
      ctx.arc(-34, -40, 11, 0, Math.PI * 2);
      ctx.fill();
      // Cute blinking baby eyes & rosy cheeks
      ctx.fillStyle = 'rgba(255, 118, 140, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-44, -2, 7, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(-20, -2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      const babyBlink = !isSilentFreeze && (timeSec % 3.1) > 2.95;
      ctx.fillStyle = '#1E1E26';
      ctx.beginPath();
      ctx.ellipse(-41, -10, 4, babyBlink ? 1 : 5.5, 0, 0, Math.PI * 2);
      ctx.ellipse(-23, -10, 4, babyBlink ? 1 : 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'compass': {
      ctx.save();
      ctx.translate(handX, handY - 8);
      const caseG = makeClayRadial(ctx, 0, 0, 34, '#FFF6A3', PALETTE.einsteinYellow, '#B45309');
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
        },
        caseG,
        7
      );
      ctx.fillStyle = '#0F1B2D';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      const na = isSilentFreeze ? -Math.PI / 2 : -Math.PI / 2 + Math.sin(timeSec * 8.5) * 0.32;
      ctx.strokeStyle = PALETTE.notifPink;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(na) * 18, Math.sin(na) * 18);
      ctx.stroke();
      ctx.fillStyle = PALETTE.chalkWhite;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'violin': {
      // Violin tucked under chin with bowing motion & music notes
      ctx.save();
      ctx.translate(-38, -262);
      ctx.rotate(-0.42);
      const woodG = makeClayLinear(ctx, -20, -45, 20, 40, '#F59E0B', '#B45309', '#78350F');
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -20, -42, 40, 76, 18);
        },
        woodG,
        7
      );
      ctx.fillStyle = '#451A03';
      ctx.fillRect(-5, -80, 10, 40);
      ctx.restore();

      // Animated bow
      const bowSlide = isSilentFreeze ? 0 : Math.sin(timeSec * 7.5) * 26;
      ctx.save();
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-64 + bowSlide, -252);
      ctx.lineTo(14 + bowSlide, -220);
      ctx.stroke();
      ctx.restore();

      // Floating music notes
      if (!isSilentFreeze) {
        ctx.save();
        ctx.fillStyle = PALETTE.einsteinYellow;
        ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
        for (let i = 0; i < 2; i++) {
          const ny = -350 - ((timeSec * 42 + i * 32) % 68);
          const nx = -68 + Math.sin(timeSec * 3 + i) * 16 + i * 28;
          ctx.globalAlpha = 0.85;
          ctx.fillText(i === 0 ? '♪' : '♫', nx, ny);
        }
        ctx.restore();
      }
      break;
    }
    case 'ruler': {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(0.25);
      const rulerG = makeClayLinear(ctx, -8, -85, 10, 0, '#FEF08A', '#FACC15', '#CA8A04');
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -9, -86, 18, 92, 4);
        },
        rulerG,
        6
      );
      ctx.strokeStyle = '#713F12';
      ctx.lineWidth = 2;
      for (let ry = -74; ry < -6; ry += 12) {
        ctx.beginPath();
        ctx.moveTo(-8, ry);
        ctx.lineTo(1, ry);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'algebra-x': {
      // Glowing floating 'X' animal mascot with eyes & little feet!
      const hop = isSilentFreeze ? 0 : Math.abs(Math.sin(timeSec * 4.5)) * 12;
      ctx.save();
      ctx.translate(handX + 8, handY - 34 - hop);
      ctx.font = '900 62px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.lineWidth = 10;
      ctx.strokeText('X', 0, 0);
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.fillText('X', 0, 0);
      ctx.restore();
      break;
    }
    case 'euclid-book':
    case 'science-books':
    case 'tidy-notebook':
    case 'tensor-book':
    case 'notebook':
    case 'sausage-book':
    case 'tea-book':
    case 'aarau-brochure':
    case 'journal': {
      const isBlue = prop === 'tidy-notebook' || prop === 'tensor-book';
      const isGreen = prop === 'aarau-brochure';
      const base = isBlue ? PALETTE.electricBlue : isGreen ? PALETTE.checkGreen : PALETTE.einsteinYellow;
      const hi = isBlue ? '#7CC4FF' : isGreen ? '#6EE7B7' : '#FFF6A3';
      const sh = isBlue ? '#1D4ED8' : isGreen ? '#047857' : '#CA8A04';
      ctx.save();
      ctx.translate(handX, handY - 12);
      ctx.rotate(-0.14);
      const bkG = makeClayLinear(ctx, -30, -38, 30, 38, hi, base, sh);
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -32, -38, 64, 76, 10);
        },
        bkG,
        7
      );
      ctx.fillStyle = PALETTE.navyDeep;
      ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sym =
        prop === 'euclid-book'
          ? '△'
          : prop === 'tensor-book'
            ? 'g_μν'
            : prop === 'aarau-brochure'
              ? 'AARAU'
              : prop === 'tidy-notebook'
                ? '✔'
                : '∑';
      ctx.fillText(sym, 0, 2);
      ctx.restore();
      break;
    }
    case 'chalk':
    case 'pointer':
    case 'paper-pen':
    case 'pen-letter': {
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(-0.55);
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(34, -34);
      ctx.stroke();
      ctx.strokeStyle = prop === 'chalk' ? '#FEF08A' : PALETTE.electricBlue;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
      if (prop === 'paper-pen' || prop === 'pen-letter') {
        ctx.save();
        ctx.translate(handX - 24, handY + 12);
        drawStickerPath(
          ctx,
          () => drawRoundedRectPath(ctx, -26, -18, 52, 36, 6),
          PALETTE.chalkWhite,
          6
        );
        ctx.restore();
      }
      break;
    }
    case 'telescope': {
      ctx.save();
      ctx.translate(handX + 6, handY - 16);
      ctx.rotate(-0.48);
      const teleG = makeClayLinear(ctx, -18, -50, 18, 45, '#FFF6A3', PALETTE.einsteinYellow, '#B45309');
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -16, -54, 32, 98, 9);
        },
        teleG,
        7
      );
      ctx.fillStyle = PALETTE.electricBlue;
      ctx.beginPath();
      ctx.ellipse(0, -52, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'microscope': {
      ctx.save();
      ctx.translate(handX + 8, handY - 14);
      const micG = makeClayLinear(ctx, -20, -40, 20, 30, '#CBD5E1', '#64748B', '#1E293B');
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -22, 14, 44, 14, 6);
        },
        micG,
        6
      );
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -8, -42, 18, 54, 6);
        },
        micG,
        6
      );
      ctx.restore();
      break;
    }
    case 'telegram':
    case 'letter':
    case 'offer-letter':
    case 'doctor-note':
    case 'divorce-contract':
    case 'prize-envelope':
    case 'exam-sheet':
    case 'exam-result':
    case 'rejection-letters': {
      ctx.save();
      ctx.translate(handX, handY - 6);
      ctx.rotate(prop === 'rejection-letters' ? -0.15 : 0.08);
      const envG = makeClayLinear(ctx, -34, -24, 34, 24, '#FFFFFF', '#F5F5F0', '#CBD5E1');
      drawStickerPath(
        ctx,
        () => {
          drawRoundedRectPath(ctx, -34, -24, 68, 48, 8);
        },
        envG,
        6
      );
      if (prop === 'telegram' || prop === 'prize-envelope' || prop === 'offer-letter') {
        ctx.fillStyle = PALETTE.einsteinYellow;
        ctx.beginPath();
        ctx.arc(14, 6, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop === 'rejection-letters' || prop === 'exam-result') {
        ctx.strokeStyle = PALETTE.notifPink;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-12, -10);
        ctx.lineTo(12, 10);
        ctx.moveTo(12, -10);
        ctx.lineTo(-12, 10);
        ctx.stroke();
      } else if (prop === 'doctor-note') {
        ctx.fillStyle = PALETTE.checkGreen;
        ctx.fillRect(-5, -12, 10, 24);
        ctx.fillRect(-12, -5, 24, 10);
      }
      ctx.restore();
      break;
    }
    case 'phone': {
      ctx.save();
      ctx.translate(handX, handY - 12);
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -20, -34, 40, 68, 10),
        '#0F172A',
        6
      );
      ctx.fillStyle = PALETTE.electricBlue;
      drawRoundedRectPath(ctx, -14, -24, 28, 46, 4);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'coffee-cup': {
      ctx.save();
      ctx.translate(handX, handY - 8);
      const cupG = makeClayLinear(ctx, -18, -18, 18, 18, '#FFFFFF', '#F5F5F0', '#CBD5E1');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -18, -18, 36, 36, 8),
        cupG,
        6
      );
      if (!isSilentFreeze) {
        ctx.strokeStyle = 'rgba(245, 245, 240, 0.65)';
        ctx.lineWidth = 3;
        const st = (timeSec * 22) % 24;
        ctx.beginPath();
        ctx.moveTo(-6, -24 - st * 0.4);
        ctx.quadraticCurveTo(2, -34 - st * 0.4, -4, -44 - st * 0.4);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'pocket-watch': {
      ctx.save();
      ctx.translate(handX, handY - 6);
      const wg = makeClayRadial(ctx, 0, 0, 24, '#FFF6A3', PALETTE.einsteinYellow, '#B45309');
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
        },
        wg,
        6
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      const ang = isSilentFreeze ? 0 : timeSec * 5;
      ctx.strokeStyle = '#0F1B2D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * 13, Math.sin(ang) * 13);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'suitcase': {
      ctx.save();
      ctx.translate(handX + 8, handY + 26);
      const sg = makeClayLinear(ctx, -40, -26, 40, 28, '#B45309', '#78350F', '#451A03');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -38, -24, 76, 54, 10),
        sg,
        7
      );
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -24);
      ctx.lineTo(-16, 30);
      ctx.moveTo(16, -24);
      ctx.lineTo(16, 30);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'radio': {
      ctx.save();
      ctx.translate(handX + 8, handY + 6);
      const rg = makeClayLinear(ctx, -36, -24, 36, 26, '#94A3B8', '#475569', '#1E293B');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -38, -26, 76, 52, 12),
        rg,
        7
      );
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.beginPath();
      ctx.arc(-14, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'glass-plate': {
      ctx.save();
      ctx.translate(handX, handY - 12);
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -36, -28, 72, 56, 8),
        'rgba(125, 211, 252, 0.35)',
        6
      );
      ctx.fillStyle = PALETTE.einsteinYellow;
      for (const [sx, sy] of [
        [-14, -8],
        [10, 4],
        [-4, 14],
      ]) {
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'dice': {
      const spin = isSilentFreeze ? 0 : Math.sin(timeSec * 3.5) * 0.2;
      ctx.save();
      ctx.translate(handX - 10, handY - 18);
      ctx.rotate(spin);
      const dg = makeClayLinear(ctx, -20, -20, 20, 20, '#FFFFFF', '#F5F5F0', '#CBD5E1');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -20, -20, 40, 40, 9),
        dg,
        6
      );
      ctx.fillStyle = PALETTE.notifPink;
      ctx.beginPath();
      ctx.arc(-7, -7, 4, 0, Math.PI * 2);
      ctx.arc(7, 7, 4, 0, Math.PI * 2);
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'pipe': {
      ctx.save();
      ctx.translate(lookDir >= 0 ? 18 : -18, -322);
      ctx.scale(lookDir < 0 ? -1 : 1, 1);
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(28, 16, 44, -2);
      ctx.stroke();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 6;
      ctx.stroke();
      if (!isSilentFreeze) {
        for (let i = 0; i < 3; i++) {
          const sy = -14 - ((timeSec * 24 + i * 16) % 42);
          ctx.fillStyle = 'rgba(245,245,240,0.45)';
          ctx.beginPath();
          ctx.arc(46 + Math.sin(timeSec * 2 + i) * 6, sy, 5 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'sailboat': {
      ctx.save();
      ctx.translate(handX + 8, handY - 4);
      const hullG = makeClayLinear(ctx, -30, 0, 30, 25, '#FFFFFF', '#F5F5F0', '#CBD5E1');
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.moveTo(-34, 0);
          ctx.lineTo(34, 0);
          ctx.lineTo(20, 24);
          ctx.lineTo(-20, 24);
          ctx.closePath();
        },
        hullG,
        6
      );
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(-2, -56);
      ctx.lineTo(28, -6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'heartbeat-papers': {
      const pulse = isSilentFreeze ? 0.8 : 0.65 + 0.4 * Math.abs(Math.sin(timeSec * 8));
      ctx.save();
      ctx.strokeStyle = PALETTE.notifPink;
      ctx.lineWidth = 4.5 * pulse;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 15 - 4, -206);
        ctx.lineTo(i * 15 + 4, -222);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'patent-desk':
    case 'secret-drawer': {
      // Compact 2.5D glowing drawer box resting near waist/hands
      ctx.save();
      ctx.translate(0, -148);
      const boxG = makeClayLinear(ctx, -68, -28, 68, 42, '#3D5578', '#24395C', '#132036');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -68, -24, 136, 62, 12),
        boxG,
        7
      );
      if (prop === 'secret-drawer') {
        ctx.fillStyle = PALETTE.einsteinYellow;
        drawRoundedRectPath(ctx, -44, -44, 88, 28, 6);
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'backpack-notebook': {
      ctx.save();
      ctx.translate(-52, -210);
      const bpG = makeClayLinear(ctx, -20, -40, 20, 40, '#92400E', '#78350F', '#451A03');
      drawStickerPath(
        ctx,
        () => drawRoundedRectPath(ctx, -20, -38, 38, 76, 14),
        bpG,
        7
      );
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

export function drawCharacter25D(
  ctx: CanvasRenderingContext2D,
  spec: SceneCharacterSpec,
  x: number,
  floorY: number,
  timeSec: number,
  isSilentFreeze: boolean,
  acting?: CharacterActingState
) {
  const app = APPEARANCES[spec.id] ?? APPEARANCES.silhouette;
  const effectiveSpec: SceneCharacterSpec = {
    ...spec,
    pose: acting?.poseOverride ?? spec.pose,
    expression: acting?.expressionOverride ?? spec.expression,
    quoteBubble: acting?.quoteOverride ?? spec.quoteBubble,
  };
  const pose = inferPose(effectiveSpec);
  const gestureMode: GestureMode =
    acting?.gestureMode ??
    (pose === 'walk'
      ? 'walk'
      : pose === 'run'
        ? 'run'
        : pose === 'violin'
          ? 'violin'
          : pose === 'cradle'
            ? 'cradle'
            : pose === 'write' || pose === 'type'
              ? 'work'
              : pose === 'kneel'
                ? 'search'
                : pose === 'think' || pose === 'scratch-head'
                  ? 'think-pace'
                  : effectiveSpec.expression === 'panicked' || effectiveSpec.expression === 'shocked'
                    ? 'shock'
                    : effectiveSpec.expression === 'stern'
                      ? 'argue'
                      : effectiveSpec.expression === 'happy'
                        ? 'celebrate'
                        : 'converse');

  const t = isSilentFreeze ? 0 : timeSec;
  const phase = x * 0.013;
  const excitement = acting?.excitement ?? (acting?.talkingActive ? 0.82 : 0.48);

  // Rich continuous human motion curves: breath, weight shift, active knee bounce, torso lean, head yaw
  const breathCycle = Math.sin(t * 2.5 + phase);
  const weightSway =
    pose === 'walk' || pose === 'run'
      ? 0
      : Math.sin(t * 1.45 + phase) * (6.5 + excitement * 4.5);
  const kneeBounce =
    isSilentFreeze || pose === 'lie-down'
      ? 0
      : Math.abs(Math.sin(t * 3.1 + phase)) * (3 + excitement * 5);

  const chestScaleX = 1 + breathCycle * 0.025;
  const chestScaleY = 1 - breathCycle * 0.02;
  const headBobY = breathCycle * 3.5 - Math.cos(t * 2.5 + phase) * 2.2 - kneeBounce * 0.35;

  const baseLookDir = effectiveSpec.facing === 'left' ? -1 : effectiveSpec.facing === 'right' ? 1 : 0;
  const dynamicHeadYaw = isSilentFreeze
    ? baseLookDir
    : Math.max(
        -1,
        Math.min(
          1,
          (acting?.headYaw ?? baseLookDir * 0.72) + Math.sin(t * 1.35 + phase) * 0.28
        )
      );
  const facingSign = dynamicHeadYaw < -0.15 ? -1 : dynamicHeadYaw > 0.15 ? 1 : baseLookDir || 1;

  const torsoLean =
    isSilentFreeze
      ? 0
      : (acting?.torsoLean ?? 0) +
        Math.sin(t * 1.9 + phase) * (0.035 + excitement * 0.035) +
        (pose === 'walk' ? facingSign * 0.07 : pose === 'run' ? facingSign * 0.15 : 0);

  const headTilt =
    pose === 'think' || pose === 'scratch-head'
      ? -0.11 + Math.sin(t * 2.1 + phase) * 0.055
      : pose === 'read' || pose === 'write'
        ? 0.09 + Math.sin(t * 2.6 + phase) * 0.035
        : Math.sin(t * 1.85 + phase) * (0.055 + excitement * 0.035);

  const scale = (effectiveSpec.scale ?? 1) * (app.heightScale ?? 1);
  const walkX = isSilentFreeze ? 0 : acting?.walkOffsetX ?? 0;
  const hopY = isSilentFreeze ? 0 : acting?.hopY ?? 0;
  const yBase = floorY + (effectiveSpec.yOffset ?? 0) + hopY;

  // Smooth organic eyelid closure curve every ~3.2s
  const blinkMod = (t + x * 0.009) % 3.2;
  let blinkAmount = 0;
  if (!isSilentFreeze && blinkMod > 2.96) {
    const bp = (blinkMod - 2.96) / 0.24;
    blinkAmount = Math.sin(bp * Math.PI);
  }
  if (pose === 'sleep') blinkAmount = 0.95;

  ctx.save();
  ctx.translate(x + walkX, yBase);
  ctx.scale(scale, scale);

  // Soft Ground Shadow on Floor
  if ((effectiveSpec.yOffset ?? 0) > -140) {
    const liftFactor = Math.max(0.55, 1 + hopY * 0.005);
    const floatLift = (pose === 'float' ? 0.72 : 1) * liftFactor;
    ctx.save();
    const shG = ctx.createRadialGradient(0, 6 - hopY, 8, 0, 6 - hopY, 102 * floatLift);
    shG.addColorStop(0, 'rgba(0, 0, 0, 0.44)');
    shG.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
    shG.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shG;
    ctx.beginPath();
    ctx.ellipse(0, 6 - hopY, 102 * floatLift, 24 * floatLift, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==================== LIVING VOLUMETRIC MASCOTS ====================
  if (app.kind === 'foton') {
    const floatX = isSilentFreeze ? 0 : Math.sin(t * 2.4) * 26;
    const floatY = -225 + Math.sin(t * 4.4) * 22;
    const stretch = 1 + Math.sin(t * 8.4) * 0.07;
    ctx.save();
    ctx.translate(floatX, floatY);

    const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 128);
    g.addColorStop(0, 'rgba(255, 214, 10, 0.65)');
    g.addColorStop(0.55, 'rgba(255, 214, 10, 0.22)');
    g.addColorStop(1, 'rgba(255, 214, 10, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 128, 0, Math.PI * 2);
    ctx.fill();

    const tailWag = Math.sin(t * 16) * 10;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-82, -16 + tailWag);
    ctx.lineTo(-68, 8 + tailWag * 0.6);
    ctx.lineTo(-118, -8 - tailWag);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.scale(stretch, 2 - stretch);
    const bodyG = makeClayRadial(ctx, 0, 0, 50, '#FFFBEB', PALETTE.einsteinYellow, '#D97706');
    drawStickerPath(
      ctx,
      () => {
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
      },
      bodyG,
      11
    );

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-18, -22, 14, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = app.cheekColor;
    ctx.beginPath();
    ctx.ellipse(-22, 10, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(22, 10, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeH = Math.max(1.5, 10 * (1 - blinkAmount));
    for (const ex of [-15, 15]) {
      ctx.fillStyle = '#0F1B2D';
      ctx.beginPath();
      ctx.ellipse(ex + dynamicHeadYaw * 5, -3, 6.5, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      if (blinkAmount < 0.5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + dynamicHeadYaw * 5 - 2, -6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    if (effectiveSpec.quoteBubble) {
      drawQuoteBubble(ctx, 0, -82, effectiveSpec.quoteBubble);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  if (app.kind === 'kompas') {
    const floatX = isSilentFreeze ? 0 : Math.cos(t * 2.1) * 18;
    const floatY = -215 + Math.sin(t * 3.6) * 16;
    const tilt = Math.sin(t * 2.5) * 0.11;
    ctx.save();
    ctx.translate(floatX, floatY);
    ctx.rotate(tilt);

    const rimG = makeClayRadial(ctx, 0, 0, 62, '#FFF9C4', PALETTE.einsteinYellow, '#B45309');
    drawStickerPath(
      ctx,
      () => {
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
      },
      rimG,
      11
    );

    const dialG = makeClayRadial(ctx, 0, 0, 46, '#24395C', '#0F1B2D', '#060D17');
    ctx.fillStyle = dialG;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();

    const needleA = Math.sin(t * 7.5) * 0.38;
    ctx.save();
    ctx.rotate(needleA);
    ctx.fillStyle = PALETTE.notifPink;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const eyeH = Math.max(1.5, 7 * (1 - blinkAmount));
    for (const ex of [-15, 15]) {
      ctx.fillStyle = PALETTE.chalkWhite;
      ctx.beginPath();
      ctx.ellipse(ex + dynamicHeadYaw * 4, 12, 6, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (effectiveSpec.quoteBubble) {
      drawQuoteBubble(ctx, 0, -90, effectiveSpec.quoteBubble);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // ==================== ARTICULATED 2.5D HUMANOID / BABY / NETIJEN ====================
  ctx.save();

  let bodyLiftY = kneeBounce;
  if (pose === 'float') {
    bodyLiftY = -28 + Math.sin(t * 3.2) * 16;
  } else if (pose === 'kneel') {
    bodyLiftY = 58 + Math.sin(t * 3.5) * 4;
  } else if (pose === 'sit') {
    bodyLiftY = 44 + Math.sin(t * 2.4) * 3;
  } else if (pose === 'lie-down') {
    ctx.translate(0, -68);
    ctx.rotate(-0.42);
    ctx.translate(0, 120);
  }
  ctx.translate(weightSway, bodyLiftY);

  const isWalk = pose === 'walk' || gestureMode === 'walk';
  const isRun = pose === 'run' || gestureMode === 'run';
  const gaitSpeed = isRun ? 11.2 : isWalk ? 7.2 : 0;
  const gaitAmp = isRun ? 42 : isWalk ? 26 : 0;
  const gaitPhase = t * gaitSpeed;
  const bounceStride = isWalk || isRun ? Math.abs(Math.sin(gaitPhase)) * (isRun ? 15 : 8) : 0;

  ctx.translate(0, -bounceStride);

  const torsoW = app.kind === 'baby' ? 92 : 114;
  const torsoH = app.outfitStyle === 'dress' ? 206 : 176;
  const hipY = -104;
  const torsoTop = hipY - torsoH + breathCycle * 3.5;

  // 1) LEGS with Analytical 2-Bone IK + Natural Weight Transfer & Toe-Tap!
  const legHighlight = app.outfitStyle === 'vest-shorts' ? app.skinHighlight : app.outfitHighlight;
  const legBase = app.outfitStyle === 'vest-shorts' ? app.skin : app.outfitColor;
  const legShadow = app.outfitStyle === 'vest-shorts' ? app.skinShadow : app.outfitShadow;

  for (const side of [-1, 1] as const) {
    const hipX = side * 24 + weightSway * 0.25;
    let footX = side * 28;
    let footY = -10;
    let shoeAng = 0;

    if (isWalk || isRun) {
      const s = Math.sin(gaitPhase + (side < 0 ? 0 : Math.PI));
      const c = Math.max(0, Math.cos(gaitPhase + (side < 0 ? 0 : Math.PI)));
      footX = side * 22 + s * gaitAmp * facingSign;
      footY = -10 - c * (isRun ? 30 : 18);
      shoeAng = -s * 0.28 * facingSign;
    } else if (pose === 'kneel') {
      footX = side * 34;
      footY = -66;
    } else if (pose === 'sit') {
      // Lively foot tap when sitting
      const tap = side === 1 && !isSilentFreeze ? Math.max(0, Math.sin(t * 6.5)) * 7 : 0;
      footX = side * 32 + facingSign * 26;
      footY = -52 - tap;
      shoeAng = tap > 1 ? -0.18 : 0;
    } else if (pose === 'float') {
      footX = side * 24 + Math.sin(t * 3 + side) * 12;
      footY = -16 + Math.cos(t * 3 + side) * 10;
    } else {
      // Natural lively active standing: balanced wide stance + dynamic step-out & heel tap
      const stepOut = side === facingSign ? Math.sin(t * 1.45 + phase) * 10 : 0;
      const heelTap =
        side === 1 && !isSilentFreeze
          ? Math.max(0, Math.sin(t * 4.2 + phase)) * (4 + excitement * 6)
          : 0;
      footX = side * 32 + stepOut;
      footY = -10 - heelTap;
      shoeAng = heelTap > 1.5 ? -0.16 * facingSign : 0;
    }

    const legBendDir = isWalk || isRun || pose === 'sit' ? facingSign : side * 0.45;
    const ikLeg = solveTwoBoneIK(hipX, hipY, footX, footY, 54, 52, legBendDir);
    drawArticulatedLimb(
      ctx,
      hipX,
      hipY,
      ikLeg.midX,
      ikLeg.midY,
      ikLeg.endX,
      ikLeg.endY,
      28,
      22,
      legHighlight,
      legBase,
      legShadow,
      app.skin,
      14,
      true,
      facingSign,
      shoeAng
    );
  }

  // Wheelchair for Roosevelt
  if (app.outfitStyle === 'wheelchair') {
    ctx.save();
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, -68, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  }

  // Ghost spectral tail for Newton Ghost
  if (app.kind === 'newton-ghost') {
    ctx.save();
    const gTail = makeClayLinear(
      ctx,
      0,
      -140,
      0,
      0,
      app.outfitHighlight,
      app.outfitColor,
      'rgba(254, 240, 138, 0.05)'
    );
    ctx.fillStyle = gTail;
    ctx.beginPath();
    ctx.moveTo(-54, -140);
    ctx.quadraticCurveTo(-30 + Math.sin(t * 4) * 20, -40, 0, -10);
    ctx.quadraticCurveTo(30 + Math.sin(t * 4) * 20, -40, 54, -140);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ==================== UPPER BODY PIVOTING AROUND PELVIS (TORSO LEAN!) ====================
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoLean);
  ctx.translate(0, -hipY);

  // Compute Lively Active Hand Targets for LEFT (-1) and RIGHT (+1) arms!
  const getHandTarget = (side: -1 | 1): { x: number; y: number; bend: number } => {
    const shX = side * (torsoW * 0.45);
    const shY = torsoTop + 28;
    const talkWave = Math.sin(t * (4.8 + excitement * 2.2) + phase + (side < 0 ? 1.4 : 0));
    const altWave = Math.cos(t * (3.6 + excitement * 1.8) + phase + (side < 0 ? 0.6 : 2.1));

    if (isWalk || isRun) {
      const swing = Math.sin(gaitPhase + (side < 0 ? Math.PI : 0)) * (isRun ? 52 : 34);
      return {
        x: shX + swing * facingSign + side * 8,
        y: shY + 90 - Math.abs(swing) * 0.28,
        bend: -facingSign,
      };
    }

    if (pose === 'wave' || gestureMode === 'celebrate') {
      if (side === 1) {
        return {
          x: shX + 48 + Math.sin(t * 8.5) * 24,
          y: torsoTop - 44 + Math.cos(t * 8.5) * 14,
          bend: 1,
        };
      }
      return {
        x: shX - 18 + altWave * 14,
        y: shY + 58 + talkWave * 12,
        bend: -1,
      };
    }

    if (pose === 'point' || gestureMode === 'argue') {
      if (side === 1) {
        const jab = Math.sin(t * 7.5 + phase) * 16;
        return {
          x: shX + facingSign * (80 + jab),
          y: shY - 16 + Math.cos(t * 5.5) * 10,
          bend: facingSign,
        };
      }
      return {
        x: shX - facingSign * 14 + altWave * 12,
        y: shY + 62 + talkWave * 14,
        bend: -facingSign,
      };
    }

    if (gestureMode === 'shock') {
      return {
        x: side * 52 + Math.sin(t * 14 + side) * 6,
        y: torsoTop - 42 + Math.cos(t * 14) * 6,
        bend: side,
      };
    }

    if (pose === 'scratch-head' && side === 1) {
      return {
        x: 56 + Math.sin(t * 7.5) * 8,
        y: torsoTop - 86 + Math.cos(t * 7.5) * 7,
        bend: 1,
      };
    }

    if (pose === 'think' || gestureMode === 'think-pace') {
      if (side === 1) {
        return {
          x: 20 * facingSign + Math.sin(t * 3.2) * 5,
          y: torsoTop - 22 + Math.cos(t * 3.2) * 4,
          bend: facingSign,
        };
      }
      return {
        x: shX + side * 12 + talkWave * 12,
        y: shY + 74 + altWave * 12,
        bend: -side,
      };
    }

    if (pose === 'read' || pose === 'type') {
      const tap = pose === 'type' ? Math.sin(t * 18 + side * 2) * 10 : Math.sin(t * 2.8 + side) * 6;
      return {
        x: side * 34 + facingSign * 16,
        y: torsoTop + 86 + tap,
        bend: side,
      };
    }

    if (pose === 'cradle' || gestureMode === 'cradle') {
      const rock = Math.sin(t * 3.2) * 14;
      return {
        x: side * 28 + rock,
        y: torsoTop + 92 + Math.cos(t * 3.2) * 6,
        bend: side,
      };
    }

    if (pose === 'write' || gestureMode === 'work') {
      if (side === 1) {
        return {
          x: 78 + Math.sin(t * 11) * 16,
          y: torsoTop + 12 + Math.cos(t * 9) * 13,
          bend: 1,
        };
      }
      return {
        x: shX - 10 + altWave * 8,
        y: shY + 68 + talkWave * 8,
        bend: -1,
      };
    }

    if (pose === 'violin' || gestureMode === 'violin') {
      if (side === -1) return { x: -46, y: torsoTop + 14 + Math.sin(t * 3.5) * 4, bend: -1 };
      return {
        x: -10 + Math.sin(t * 7.8) * 32,
        y: torsoTop + 34 + Math.cos(t * 7.8) * 10,
        bend: 1,
      };
    }

    if (gestureMode === 'search' || pose === 'kneel') {
      if (side === 1) {
        return {
          x: facingSign * 42 + Math.sin(t * 4) * 18,
          y: torsoTop - 44 + Math.cos(t * 4) * 6,
          bend: facingSign,
        };
      }
      return {
        x: shX + facingSign * 22,
        y: shY + 84 + Math.sin(t * 4.5) * 10,
        bend: facingSign,
      };
    }

    // Active natural conversational hands (open outward silhouettes — never stiff!)
    const talkReach = 28 + excitement * 24;
    if (side === facingSign) {
      return {
        x: shX + facingSign * (34 + talkWave * 18),
        y: shY + 42 - talkReach * 0.48 + altWave * 18,
        bend: facingSign,
      };
    }
    return {
      x: shX - facingSign * (22 + Math.abs(altWave) * 10),
      y: shY + 58 + talkWave * 16,
      bend: -facingSign,
    };
  };

  const backSide: -1 | 1 = facingSign >= 0 ? -1 : 1;
  const frontSide: -1 | 1 = facingSign >= 0 ? 1 : -1;

  const drawArmForSide = (side: -1 | 1) => {
    const shX = side * (torsoW * 0.45);
    const shY = torsoTop + 28;
    const tgt = getHandTarget(side);
    const ikArm = solveTwoBoneIK(shX, shY, tgt.x, tgt.y, 56, 54, tgt.bend);
    drawArticulatedLimb(
      ctx,
      shX,
      shY,
      ikArm.midX,
      ikArm.midY,
      ikArm.endX,
      ikArm.endY,
      26,
      21,
      app.outfitHighlight,
      app.outfitColor,
      app.outfitShadow,
      app.kind === 'netijen' ? PALETTE.electricBlue : app.skin,
      15,
      false,
      facingSign
    );
    return { handX: ikArm.endX, handY: ikArm.endY };
  };

  // Back arm drawn behind torso
  drawArmForSide(backSide);

  // 2) VOLUMETRIC 2.5D TORSO
  ctx.save();
  ctx.translate(0, torsoTop + torsoH * 0.5);
  ctx.scale(chestScaleX, chestScaleY);
  ctx.translate(0, -(torsoTop + torsoH * 0.5));

  ctx.save();
  ctx.translate(8, 10);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  drawRoundedRectPath(ctx, -torsoW * 0.5, torsoTop, torsoW, torsoH, 34);
  ctx.fill();
  ctx.restore();

  const torsoGrad = makeClayLinear(
    ctx,
    -torsoW * 0.5,
    torsoTop,
    torsoW * 0.55,
    torsoTop + torsoH,
    app.outfitHighlight,
    app.outfitColor,
    app.outfitShadow
  );

  drawStickerPath(
    ctx,
    () => {
      ctx.beginPath();
      ctx.moveTo(-torsoW * 0.42, torsoTop);
      ctx.quadraticCurveTo(0, torsoTop - 16, torsoW * 0.42, torsoTop);
      ctx.bezierCurveTo(
        torsoW * 0.58,
        torsoTop + torsoH * 0.45,
        torsoW * 0.54,
        torsoTop + torsoH,
        torsoW * 0.46,
        torsoTop + torsoH
      );
      ctx.lineTo(-torsoW * 0.46, torsoTop + torsoH);
      ctx.bezierCurveTo(
        -torsoW * 0.54,
        torsoTop + torsoH,
        -torsoW * 0.58,
        torsoTop + torsoH * 0.45,
        -torsoW * 0.42,
        torsoTop
      );
      ctx.closePath();
    },
    torsoGrad,
    11
  );

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-torsoW * 0.42, torsoTop + 26);
  ctx.quadraticCurveTo(-torsoW * 0.36, torsoTop - 2, -6, torsoTop - 6);
  ctx.stroke();

  if (app.outfitStyle === 'suit-tie' || app.outfitStyle === 'vest-shorts' || app.outfitStyle === 'lab-coat') {
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.beginPath();
    ctx.moveTo(-22, torsoTop);
    ctx.lineTo(0, torsoTop + 34);
    ctx.lineTo(22, torsoTop);
    ctx.closePath();
    ctx.fill();
    if (app.outfitStyle === 'suit-tie') {
      const tieSway = Math.sin(t * 3.4 + phase) * 4.5;
      ctx.fillStyle = effectiveSpec.id === 'albert-patent' ? PALETTE.notifPink : '#1E293B';
      ctx.beginPath();
      ctx.moveTo(-6, torsoTop + 26);
      ctx.lineTo(8, torsoTop + 26);
      ctx.lineTo((effectiveSpec.id === 'albert-patent' ? 14 : 6) + tieSway, torsoTop + 88);
      ctx.lineTo(-8 + tieSway, torsoTop + 88);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (app.glasses === 'hanging') {
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, torsoTop + 4);
    ctx.quadraticCurveTo(0, torsoTop + 62, 18, torsoTop + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-10, torsoTop + 54, 10, 0, Math.PI * 2);
    ctx.arc(10, torsoTop + 54, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  const neckG = makeClayLinear(
    ctx,
    -18,
    torsoTop - 24,
    18,
    torsoTop + 6,
    app.skinHighlight,
    app.skin,
    app.skinShadow
  );
  ctx.fillStyle = neckG;
  drawRoundedRectPath(ctx, -16, torsoTop - 24, 32, 30, 12);
  ctx.fill();

  ctx.restore(); // end torso breath

  // 3) LIVING HEAD GROUP WITH 3D HEAD-YAW PARALLAX
  const hs = app.headScale ?? 1;
  const yawPx = dynamicHeadYaw * 10;
  ctx.save();
  ctx.translate(0, torsoTop - 74 + headBobY);
  ctx.rotate(headTilt);
  ctx.scale(hs, hs);

  if (app.kind === 'netijen') {
    const chatG = makeClayRadial(ctx, 0, -10, 96, '#7CC4FF', PALETTE.electricBlue, '#1D4ED8');
    drawStickerPath(
      ctx,
      () => {
        drawRoundedRectPath(ctx, -84, -76, 168, 138, 42);
      },
      chatG,
      11
    );
    const sunG = makeClayLinear(ctx, -58, -24, 58, 10, '#334155', '#0F172A', '#020617');
    ctx.fillStyle = sunG;
    drawRoundedRectPath(ctx, -58 + yawPx * 0.5, -24, 50, 32, 9);
    ctx.fill();
    drawRoundedRectPath(ctx, 8 + yawPx * 0.5, -24, 50, 32, 9);
    ctx.fill();
    ctx.fillRect(-10 + yawPx * 0.5, -14, 20, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillRect(-48 + yawPx * 0.5, -19, 14, 5);
    ctx.fillRect(18 + yawPx * 0.5, -19, 14, 5);
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, -12, 88, Math.PI * 1.05, -Math.PI * 0.05);
    ctx.stroke();
  } else {
    // Sculpted Ears shift asymmetrically with 3D head yaw!
    for (const earSide of [-1, 1] as const) {
      const ex = earSide * 76 - yawPx * 0.35;
      const ey = 6;
      const earG = makeClayRadial(ctx, ex, ey, 18, app.skinHighlight, app.skin, app.skinShadow);
      drawStickerPath(
        ctx,
        () => {
          ctx.beginPath();
          ctx.ellipse(ex, ey, 14, 18, earSide * 0.15, 0, Math.PI * 2);
        },
        earG,
        7
      );
      ctx.strokeStyle = app.skinShadow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex - earSide * 2, ey + 2, 7, 0.2, Math.PI * 1.2);
      ctx.stroke();
    }

    const headGrad = makeClayRadial(ctx, 0, -6, 88, app.skinHighlight, app.skin, app.skinShadow);
    drawStickerPath(
      ctx,
      () => {
        ctx.beginPath();
        ctx.moveTo(-76, -10);
        ctx.bezierCurveTo(-84, -84, 84, -84, 76, -10);
        ctx.bezierCurveTo(78, 54, 48, 76, 0, 76);
        ctx.bezierCurveTo(-48, 76, -78, 54, -76, -10);
        ctx.closePath();
      },
      headGrad,
      11
    );

    ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
    ctx.beginPath();
    ctx.ellipse(-26 + yawPx * 0.4, -42, 22, 11, -0.35, 0, Math.PI * 2);
    ctx.fill();

    if (app.cheekColor !== 'transparent') {
      ctx.fillStyle = app.cheekColor;
      ctx.beginPath();
      ctx.ellipse(-44 + yawPx * 0.7, 18, 15, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(44 + yawPx * 0.7, 18, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const saccadeX = isSilentFreeze ? 0 : Math.sin(t * 2.2 + phase) * 2.4;
    const gazeX = yawPx * 0.72 + saccadeX;

    if (app.kind === 'silhouette') {
      const eyeH = Math.max(2, 14 * (1 - blinkAmount));
      for (const ex of [-24, 24]) {
        ctx.fillStyle = PALETTE.chalkWhite;
        ctx.beginPath();
        ctx.ellipse(ex + gazeX, -6, 11, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (const ex of [-26, 26]) {
        const openH = Math.max(2, 18 * (1 - blinkAmount));
        const eyeCx = ex + yawPx * 0.55;
        ctx.fillStyle = 'rgba(120, 70, 40, 0.14)';
        ctx.beginPath();
        ctx.ellipse(eyeCx, -6, 17, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(eyeCx, -6, 15, openH, 0, 0, Math.PI * 2);
        ctx.fill();

        if (blinkAmount < 0.72) {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(eyeCx, -6, 15, openH, 0, 0, Math.PI * 2);
          ctx.clip();

          const irisG = makeClayRadial(ctx, ex + gazeX, -5, 10, '#6B4423', app.irisColor, '#090D16');
          ctx.fillStyle = irisG;
          ctx.beginPath();
          ctx.arc(ex + gazeX, -5, 9.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#090D16';
          ctx.beginPath();
          ctx.arc(ex + gazeX, -5, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(ex + gazeX - 3.2, -8.5, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + gazeX + 2.8, -2, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.strokeStyle = '#1E1E26';
        ctx.lineWidth = app.isFemale ? 3.8 : 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(eyeCx, -6, 15.5, openH, 0, Math.PI + 0.25, -0.25);
        ctx.stroke();
      }

      // 3D Sculpted Nose shifts slightly more for depth parallax
      ctx.save();
      ctx.fillStyle = app.skinShadow;
      ctx.beginPath();
      ctx.ellipse(yawPx * 0.85, 12, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = app.skinHighlight;
      ctx.beginPath();
      ctx.ellipse(yawPx * 0.85 - 2, 10, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Expressive Eyebrows
      ctx.strokeStyle = app.hairColor === '#F5F5F0' ? '#94A3B8' : '#1E1E26';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const browTilt =
        effectiveSpec.expression === 'stern' || effectiveSpec.expression === 'panicked'
          ? 8
          : effectiveSpec.expression === 'curious'
            ? -6
            : effectiveSpec.expression === 'happy'
              ? -3
              : 0;
      const browBounce = isSilentFreeze ? 0 : Math.sin(t * 3.1 + phase) * 2.2;
      ctx.beginPath();
      ctx.moveTo(-40 + yawPx * 0.55, -31 - browTilt + browBounce);
      ctx.quadraticCurveTo(-26 + yawPx * 0.55, -34 + browBounce, -12 + yawPx * 0.55, -30 + browTilt * 0.5);
      ctx.moveTo(12 + yawPx * 0.55, -30 + browTilt * 0.5);
      ctx.quadraticCurveTo(26 + yawPx * 0.55, -34 + browBounce, 40 + yawPx * 0.55, -31 - browTilt + browBounce);
      ctx.stroke();

      if (app.eyeBags) {
        ctx.strokeStyle = 'rgba(120, 80, 60, 0.42)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-26 + yawPx * 0.55, 11, 12, 0.25, Math.PI - 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(26 + yawPx * 0.55, 11, 12, 0.25, Math.PI - 0.25);
        ctx.stroke();
      }

      if (app.glasses === 'round' || app.glasses === 'small' || app.glasses === 'pince-nez') {
        const r = app.glasses === 'small' ? 16 : 22;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.arc(-26 + yawPx * 0.6, -6, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(26 + yawPx * 0.6, -6, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-26 + yawPx * 0.6 + r, -6);
        ctx.lineTo(26 + yawPx * 0.6 - r, -6);
        ctx.stroke();
      }

      if (app.moustache && app.moustache !== 'none') {
        const mColor =
          app.moustache === 'white-big' || app.moustache === 'beard-white'
            ? '#F5F5F0'
            : app.hairColor;
        const mG = makeClayLinear(ctx, -32, 18, 32, 38, '#FFFFFF', mColor, '#64748B');
        ctx.fillStyle = app.moustache === 'white-big' || app.moustache === 'beard-white' ? mG : mColor;
        if (app.moustache === 'beard-white' || app.moustache === 'beard-trim') {
          ctx.beginPath();
          ctx.arc(yawPx * 0.65, 28, 36, 0, Math.PI);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.ellipse(
          yawPx * 0.65,
          24,
          app.moustache === 'thin' ? 22 : 34,
          app.moustache === 'thin' ? 7 : 13,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Expressive Living Mouth (animated chatter curve when acting/talking!)
      if (effectiveSpec.expression === 'tongue') {
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.ellipse(yawPx * 0.55, 38, 17, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        const tongueG = makeClayLinear(ctx, -10, 36, 10, 62, '#FF7AA8', PALETTE.notifPink, '#BE185D');
        ctx.fillStyle = tongueG;
        drawRoundedRectPath(ctx, -11 + yawPx * 0.55, 36, 22, 26, 11);
        ctx.fill();
      } else {
        const talkOpen =
          !isSilentFreeze && (acting?.talkingActive || effectiveSpec.quoteBubble)
            ? Math.max(0, Math.sin(t * 14 + phase)) * (4 + (acting?.audioAmplitude ?? 0.5) * 6)
            : 0;

        if (talkOpen > 2.2) {
          ctx.fillStyle = '#7F1D1D';
          ctx.beginPath();
          ctx.ellipse(yawPx * 0.55, 40, 12, talkOpen * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#7C2D12';
          ctx.lineWidth = 3.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (effectiveSpec.expression === 'happy' || effectiveSpec.expression === 'smug') {
            ctx.arc(yawPx * 0.55, 34, 15, 0.22, Math.PI - 0.22);
          } else if (effectiveSpec.expression === 'worried' || effectiveSpec.expression === 'panicked') {
            ctx.arc(yawPx * 0.55, 46, 12, Math.PI + 0.35, -0.35);
          } else if (effectiveSpec.expression === 'shocked') {
            ctx.ellipse(yawPx * 0.55, 39, 9, 11, 0, 0, Math.PI * 2);
          } else {
            ctx.moveTo(-12 + yawPx * 0.55, 39);
            ctx.quadraticCurveTo(yawPx * 0.55, 41, 12 + yawPx * 0.55, 39);
          }
          ctx.stroke();
        }
      }
    }

    // 2.5D Volumetric Hair & Hats with overlapping bounce
    const hairBounce = isSilentFreeze ? 0 : Math.sin(t * 2.5 + phase - 0.8) * 3.2;
    ctx.save();
    ctx.translate(0, hairBounce * 0.5);
    const hairG = makeClayRadial(
      ctx,
      0,
      -58,
      92,
      app.hairColor === '#F5F5F0' ? '#FFFFFF' : app.hairColor === '#1E1E26' ? '#3F3F46' : '#94A3B8',
      app.hairColor,
      '#0F172A'
    );
    ctx.fillStyle = hairG;
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 6;

    if (
      app.hairStyle === 'berlin-wild' ||
      app.hairStyle === 'berlin-gray' ||
      app.hairStyle === 'old-wild'
    ) {
      if (app.hairHighlight) {
        ctx.shadowColor = app.hairHighlight;
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.moveTo(-78, 6);
      ctx.quadraticCurveTo(-114, -32, -88, -68);
      ctx.quadraticCurveTo(-84, -108, -36, -96);
      ctx.quadraticCurveTo(0, -126, 38, -96);
      ctx.quadraticCurveTo(88, -108, 90, -64);
      ctx.quadraticCurveTo(114, -28, 78, 6);
      ctx.quadraticCurveTo(42, -52, 0, -48);
      ctx.quadraticCurveTo(-42, -52, -78, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (app.hairHighlight) {
        ctx.strokeStyle = app.hairHighlight;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-48, -78);
        ctx.quadraticCurveTo(0, -102, 48, -76);
        ctx.stroke();
      }
    } else if (
      app.hairStyle === 'boy-curly' ||
      app.hairStyle === 'teen-wavy' ||
      app.hairStyle === 'patent-thick' ||
      app.hairStyle === 'baby-curl'
    ) {
      ctx.beginPath();
      ctx.arc(-44, -48, 34, 0, Math.PI * 2);
      ctx.arc(0, -64, 42, 0, Math.PI * 2);
      ctx.arc(44, -48, 34, 0, Math.PI * 2);
      ctx.fill();
    } else if (app.hairStyle === 'bun-high' || app.hairStyle === 'bun-low') {
      ctx.beginPath();
      ctx.arc(0, app.hairStyle === 'bun-high' ? -92 : -68, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -42, 68, Math.PI, 0);
      ctx.fill();
    } else if (app.hairStyle === 'pith-helmet') {
      ctx.fillStyle = makeClayLinear(ctx, -76, -90, 76, -40, '#F7EEDB', '#E7D8B9', '#B5A179');
      ctx.beginPath();
      ctx.arc(0, -48, 76, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-94, -52, 188, 16);
    } else if (app.hairStyle === 'fedora') {
      ctx.fillStyle = makeClayLinear(ctx, -56, -98, 56, -42, '#475569', '#334155', '#0F172A');
      drawRoundedRectPath(ctx, -56, -98, 112, 52, 16);
      ctx.fill();
      ctx.fillRect(-90, -52, 180, 14);
    } else if (app.hairStyle === 'work-cap' || app.hairStyle === 'small-hat') {
      ctx.fillStyle = makeClayLinear(ctx, -68, -92, 68, -40, '#475569', '#334155', '#0F172A');
      ctx.beginPath();
      ctx.arc(0, -52, 68, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-74, -54, 158, 14);
    } else if (app.hairStyle === 'bald-fringed') {
      ctx.beginPath();
      ctx.arc(-68, -22, 18, 0, Math.PI * 2);
      ctx.arc(68, -22, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -44, 68, Math.PI, 0);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore(); // end head

  // 4) FRONT ARTICULATED ARM + ATTACHED PROP
  const frontHand = drawArmForSide(frontSide);

  if (app.kind === 'netijen') {
    ctx.save();
    ctx.translate(-86, torsoTop + 56 + Math.sin(t * 4) * 8);
    const thG = makeClayRadial(ctx, 0, 0, 24, '#FFF6A3', PALETTE.einsteinYellow, '#B45309');
    drawStickerPath(
      ctx,
      () => drawRoundedRectPath(ctx, -18, -24, 36, 48, 14),
      thG,
      8
    );
    ctx.restore();
  }

  if (effectiveSpec.prop) {
    drawProp25D(
      ctx,
      effectiveSpec.prop,
      t,
      frontHand.handX,
      frontHand.handY,
      facingSign,
      isSilentFreeze
    );
  }

  ctx.restore(); // end upper body lean

  // 5) Optional volumetric Quote Bubble
  if (effectiveSpec.quoteBubble) {
    drawQuoteBubble(ctx, 0, torsoTop - 210, effectiveSpec.quoteBubble);
  }

  ctx.restore(); // end posture
  ctx.restore(); // end character root
}
