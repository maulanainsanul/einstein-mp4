export type BackgroundId =
  | 'L-01'
  | 'L-02'
  | 'L-03'
  | 'L-04'
  | 'L-05'
  | 'L-06'
  | 'L-07'
  | 'L-08'
  | 'L-09'
  | 'L-10'
  | 'L-11'
  | 'L-12';

export type CharacterId =
  | 'albert-baby'
  | 'albert-boy'
  | 'albert-teen'
  | 'albert-patent'
  | 'albert-berlin'
  | 'albert-berlin-gray'
  | 'albert-old'
  | 'mileva'
  | 'marcel'
  | 'pauline'
  | 'hermann'
  | 'maja'
  | 'jakob'
  | 'minkowski'
  | 'weber'
  | 'eddington'
  | 'elsa'
  | 'planck'
  | 'szilard'
  | 'roosevelt'
  | 'foton'
  | 'kompas'
  | 'netijen'
  | 'narrator'
  | 'talmey'
  | 'teacher'
  | 'headmaster'
  | 'doctor'
  | 'director-eth'
  | 'winteler'
  | 'solovine'
  | 'habicht'
  | 'hans-baby'
  | 'hans-child'
  | 'besso'
  | 'hilbert'
  | 'meitner'
  | 'hubble'
  | 'quantum-debater'
  | 'newton-ghost'
  | 'silhouette';

export type SlotPosition = 'left' | 'center' | 'right';

export type CameraMotionType =
  | 'zoom-in'
  | 'zoom-out'
  | 'dolly-lr'
  | 'dolly-rl'
  | 'whip-pan'
  | 'tilt-up'
  | 'tilt-down'
  | 'pan'
  | 'split-hold';

export type PopupTone = 'blue' | 'pink' | 'green' | 'yellow' | 'red';

export interface SceneBeat {
  startSec: number; // default 0..15 scale
  endSec: number;   // default 0..15 scale
  action: string;
  triggerWord: string;
  positionNote?: string;
  zoomKaget?: boolean;
}

export type CharacterPose =
  | 'stand'
  | 'walk'
  | 'run'
  | 'sit'
  | 'kneel'
  | 'lie-down'
  | 'wave'
  | 'point'
  | 'read'
  | 'cradle'
  | 'scratch-head'
  | 'think'
  | 'type'
  | 'sleep'
  | 'float'
  | 'violin'
  | 'write';

export interface SceneCharacterSpec {
  id: CharacterId;
  label: string;
  slot: SlotPosition;
  facing?: 'left' | 'right' | 'front';
  prop?: string;
  pose?: CharacterPose;
  expression?: 'neutral' | 'curious' | 'happy' | 'worried' | 'panicked' | 'smug' | 'tired' | 'stern' | 'shocked' | 'tongue';
  quoteBubble?: string;
  appearFromSec?: number; // 0..15
  hideAfterSec?: number;  // 0..15
  scale?: number;
  yOffset?: number;
}

export interface SceneData {
  sceneNumber: 1 | 2 | 3 | 4;
  title: string;
  defaultTimeRange: string;
  backgroundId: BackgroundId;
  backgroundVariant: string;
  backgroundDetail: string;
  cameraDirection: string;
  cameraType: CameraMotionType;
  splitScreen?: boolean;
  splitLeftLabel?: string;
  splitRightLabel?: string;
  actingSummary: string;
  timeline: SceneBeat[];
  narration: string;
  intonationNote: string;
  musicNote: string;
  sfxNote: string;
  popupText: string;
  popupSecondaryText?: string;
  popupTone: PopupTone;
  spillFakta?: string;
  cliffhangerVisual?: string;
  isSeasonFinale?: boolean;
  characters: SceneCharacterSpec[];
  chalkMotif?: string;
  transitionIn?: 'none' | 'glitch' | 'swipe-up';
}

export interface ExecutionSheet {
  backgroundsUsed: string;
  charactersAndAssets: string;
  moodAndPalette: string;
  cliffhangerFrame: string;
  executionNotes: string;
}

export interface EpisodeData {
  id: number;
  title: string;
  mythBusted: string;
  cliffhangerNext: string;
  executionSheet: ExecutionSheet;
  scenes: [SceneData, SceneData, SceneData, SceneData];
}

export type AudioUploadMode = 'full-episode' | 'per-scene';

export interface UploadedAudioSlot {
  fileName: string;
  durationSec: number;
  buffer: AudioBuffer;
  peaks: number[]; // normalized 0..1 amplitude envelope for waveform & mic reactivity
}

export interface EpisodeAudioState {
  mode: AudioUploadMode;
  fullAudio: UploadedAudioSlot | null;
  sceneAudios: Record<1 | 2 | 3 | 4, UploadedAudioSlot | null>;
  splitMethod: 'proportional' | 'silence-detect';
  /** Computed scene durations (in seconds) after mapping audio */
  sceneDurations: [number, number, number, number];
  /** Start offsets for fullAudio mode when slicing into S1..S4 */
  sceneOffsets: [number, number, number, number];
}

export interface MixerSettings {
  dubbingVolumeDb: number; // default 0
  bgmVolumeDb: number;     // default -18
  sfxVolumeDb: number;     // default -10
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  autoDucking: boolean;    // -6dB when dubbing voice detected
}

export interface RenderExportState {
  isExporting: boolean;
  progress: number; // 0..100
  stageLabel: string;
  target: 'full-episode' | 1 | 2 | 3 | 4;
  error: string | null;
  lastExportUrl: string | null;
  lastExportFileName: string | null;
}

export interface MasterBackgroundInfo {
  id: BackgroundId;
  name: string;
  episodes: string;
  elements: string;
  lightingAndMotion: string;
}

export interface CharacterCatalogItem {
  id: CharacterId;
  name: string;
  ageOrRole: string;
  episodes: string;
  visualTraits: string;
  propsAndActing: string;
}
