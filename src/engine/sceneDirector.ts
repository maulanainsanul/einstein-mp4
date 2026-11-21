import {
  CharacterPose,
  EpisodeData,
  SceneBeat,
  SceneCharacterSpec,
  SceneData,
} from '../types/studio';
import { renderMasterBackground } from './backgrounds';
import {
  CANVAS_H,
  CANVAS_W,
  FLOOR_Y,
  PALETTE,
  SLOT_X,
  drawChalkDustParticles,
  drawCinematicVignette,
  drawCliffhangerOverlay,
  drawEpisodePillHeader,
  drawKaraokeSubtitle,
  drawNarratorMic,
  drawPopupBanner,
  drawSafeZoneOverlay,
  drawSpillFaktaCard,
  drawTransitionOverlay,
} from './chalkAndFx';
import { CharacterActingState, GestureMode, drawCharacter25D } from './characters';

export interface RenderFrameOptions {
  episode: EpisodeData;
  /** Time within the current target (either full episode 0..totalDur or single scene 0..sceneDur) */
  localTimeSec: number;
  /** Durations for scenes 1..4 (audio-driven!) */
  sceneDurations: [number, number, number, number];
  /** If rendering a single scene, specify 1..4; otherwise 'full-episode' */
  target: 'full-episode' | 1 | 2 | 3 | 4;
  /** Current narrator voice amplitude 0..1 */
  audioAmplitude: number;
  /** Show TikTok/Reels safe zone guide */
  showSafeZone: boolean;
}

export interface ResolvedPlaybackPoint {
  scene: SceneData;
  sceneIndex: 0 | 1 | 2 | 3;
  sceneElapsed: number;
  sceneDuration: number;
  /** Scaled 0..15 script equivalent second */
  scriptSec: number;
  /** True during the mandatory 1-second silent freeze at end of Scene 4 */
  isSilentFreeze: boolean;
  freezeElapsed: number;
}

export function resolvePlaybackPoint(
  episode: EpisodeData,
  localTimeSec: number,
  sceneDurations: [number, number, number, number],
  target: 'full-episode' | 1 | 2 | 3 | 4
): ResolvedPlaybackPoint {
  let sceneIdx: 0 | 1 | 2 | 3 = 0;
  let sceneElapsed = Math.max(0, localTimeSec);

  if (target === 'full-episode') {
    let acc = 0;
    for (let i = 0; i < 4; i++) {
      const d = sceneDurations[i];
      if (localTimeSec < acc + d || i === 3) {
        sceneIdx = i as 0 | 1 | 2 | 3;
        sceneElapsed = Math.max(0, Math.min(d, localTimeSec - acc));
        break;
      }
      acc += d;
    }
  } else {
    sceneIdx = (target - 1) as 0 | 1 | 2 | 3;
    sceneElapsed = Math.max(0, Math.min(sceneDurations[sceneIdx], localTimeSec));
  }

  const scene = episode.scenes[sceneIdx];
  const sceneDuration = Math.max(1, sceneDurations[sceneIdx]);

  // Mandatory 1s silent freeze at end of Scene 4 (proportional if sceneDuration < 4s)
  const freezeLen = scene.sceneNumber === 4 ? Math.min(1.0, sceneDuration * 0.12) : 0;
  const activeNarrativeDur = Math.max(0.5, sceneDuration - freezeLen);
  const isSilentFreeze = scene.sceneNumber === 4 && sceneElapsed >= activeNarrativeDur;
  const freezeElapsed = isSilentFreeze ? sceneElapsed - activeNarrativeDur : 0;

  // Map active time proportionally onto the 15-second script timeline (0..14 for S4 active, 0..15 for S1-S3)
  const scriptMax = scene.sceneNumber === 4 ? 14 : 15;
  const scriptSec = isSilentFreeze
    ? 14 + Math.min(1, freezeElapsed / Math.max(0.01, freezeLen))
    : Math.min(scriptMax, (sceneElapsed / activeNarrativeDur) * scriptMax);

  return {
    scene,
    sceneIndex: sceneIdx,
    sceneElapsed,
    sceneDuration,
    scriptSec,
    isSilentFreeze,
    freezeElapsed,
  };
}

const ZOOM_KAGET_REGEX =
  /plot twist|red flag|ambyar|bolos|salah total|ordal|anggaran|kampanye|ojol|pejabat|palsu|tobat berat/i;

function computeCameraTransform(
  scene: SceneData,
  scriptSec: number,
  isSilentFreeze: boolean
): { scale: number; tx: number; ty: number } {
  if (scene.splitScreen) {
    return { scale: 1, tx: 0, ty: 0 };
  }

  const p = Math.min(1, Math.max(0, scriptSec / 15));
  let scale = 1.0;
  let tx = 0;
  let ty = 0;

  // Dramatic zoom-in on Scene 4 last 3 seconds of narration (scriptSec 11..14)
  if (scene.sceneNumber === 4 && scriptSec >= 11) {
    const z = Math.min(1, (scriptSec - 11) / 3);
    const eased = 1 - Math.pow(1 - z, 2);
    scale = 1.04 + eased * 0.18;
    ty = -eased * 42;
    return { scale, tx, ty };
  }

  switch (scene.cameraType) {
    case 'zoom-in':
      scale = 1.0 + 0.1 * Math.sin(p * Math.PI * 0.5);
      break;
    case 'zoom-out':
      scale = 1.12 - 0.12 * p;
      break;
    case 'dolly-lr':
      scale = 1.05;
      tx = 32 - 64 * p;
      break;
    case 'dolly-rl':
      scale = 1.05;
      tx = -32 + 64 * p;
      break;
    case 'whip-pan': {
      scale = 1.06;
      const whip = Math.sin(p * Math.PI);
      tx = (p < 0.5 ? 45 : -45) * whip;
      break;
    }
    case 'tilt-up':
      scale = 1.05;
      ty = -28 + 56 * p;
      break;
    case 'tilt-down':
      scale = 1.05;
      ty = 28 - 56 * p;
      break;
    case 'pan':
      scale = 1.05;
      tx = 28 - 56 * p;
      break;
    default:
      scale = 1.0;
  }

  // Snappy 'Zoom Kaget' 115% punch on plot-twist / satire beats
  for (const beat of scene.timeline) {
    const isKaget =
      beat.zoomKaget ||
      ZOOM_KAGET_REGEX.test(beat.triggerWord) ||
      ZOOM_KAGET_REGEX.test(beat.action);
    if (isKaget && scriptSec >= beat.startSec && scriptSec <= beat.startSec + 1.15) {
      const kp = Math.min(1, (scriptSec - beat.startSec) / 0.25);
      const pulse = Math.sin(kp * Math.PI * 0.5);
      const decay =
        scriptSec > beat.startSec + 0.7
          ? Math.max(0, 1 - (scriptSec - (beat.startSec + 0.7)) / 0.45)
          : 1;
      scale = Math.max(scale, 1.0 + 0.15 * pulse * decay);
    }
  }

  if (isSilentFreeze) {
    scale = 1.22;
    ty = -42;
  }

  return { scale, tx, ty };
}

function drawAnimatedChalkMotif(
  ctx: CanvasRenderingContext2D,
  scene: SceneData,
  scriptSec: number
) {
  if (!scene.chalkMotif) return;
  const reveal = Math.min(1, Math.max(0, scriptSec / 4.5));
  if (reveal <= 0.04) return;

  ctx.save();
  ctx.globalAlpha = Math.min(0.92, reveal * 1.15);
  ctx.font = '800 34px "JetBrains Mono", monospace';
  const y = scene.splitScreen ? 405 : 335;
  const fullText = scene.chalkMotif;
  const totalW = ctx.measureText(fullText).width;
  const startX = CANVAS_W / 2 - totalW / 2;

  const visibleCount = Math.max(1, Math.floor(fullText.length * reveal));
  const shown = fullText.slice(0, visibleCount);
  const shownW = ctx.measureText(shown).width;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15, 27, 45, 0.85)';
  ctx.lineWidth = 7;
  ctx.strokeText(shown, startX, y);
  ctx.fillStyle = PALETTE.einsteinYellow;
  ctx.shadowColor = 'rgba(255, 214, 10, 0.45)';
  ctx.shadowBlur = 12;
  ctx.fillText(shown, startX, y);

  // Moving 2.5D chalk stick tip while actively writing
  if (reveal < 0.98) {
    const tipX = startX + shownW + 6;
    const tipY = y + Math.sin(scriptSec * 26) * 4;

    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(-0.55);
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.strokeStyle = PALETTE.navyDeep;
    ctx.lineWidth = 2.5;
    ctx.fillRect(0, -5, 42, 10);
    ctx.strokeRect(0, -5, 42, 10);
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.fillRect(0, -5, 8, 10);
    ctx.restore();

    // Chalk dust sparks around tip
    ctx.fillStyle = 'rgba(245, 245, 240, 0.75)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        tipX + Math.cos(scriptSec * 14 + i * 2.1) * 10,
        tipY + 8 + Math.sin(scriptSec * 11 + i) * 7,
        2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getCharacterKeywords(id: SceneCharacterSpec['id']): RegExp {
  if (id.startsWith('albert')) return /albert|bayi|ia\b|dirinya/;
  const map: Record<string, RegExp> = {
    pauline: /pauline|ibu|ibunya|keluarga/,
    hermann: /hermann|ayah|ayahnya|keluarga/,
    maja: /maja|adik/,
    teacher: /guru|teacher/,
    headmaster: /kepala sekolah/,
    doctor: /dokter/,
    'director-eth': /direktur/,
    winteler: /winteler/,
    mileva: /mileva/,
    marcel: /marcel/,
    solovine: /solovine/,
    habicht: /habicht/,
    besso: /besso/,
    minkowski: /minkowski/,
    weber: /weber/,
    planck: /planck/,
    eddington: /eddington/,
    netijen: /netijen|kak netijen/,
    elsa: /elsa/,
    szilard: /szilard/,
    meitner: /meitner/,
    roosevelt: /roosevelt|presiden/,
    hilbert: /hilbert/,
    hubble: /hubble/,
    'quantum-debater': /lawan|debat|bohr/,
    'newton-ghost': /newton/,
    jakob: /jakob|paman/,
    talmey: /talmey/,
    foton: /foton/,
    kompas: /kompas/,
  };
  return map[id] ?? /siluet|astronom|atasan|hadirin/;
}

function computeCharacterActingState(
  episodeId: number,
  scene: SceneData,
  charSpec: SceneCharacterSpec,
  visibleChars: SceneCharacterSpec[],
  charIdx: number,
  activeBeat: SceneBeat | undefined,
  scriptSec: number,
  effectiveTime: number,
  audioAmplitude: number,
  isSilentFreeze: boolean
): CharacterActingState {
  if (isSilentFreeze) {
    return {
      gestureMode: 'shock',
      hopY: 0,
      walkOffsetX: 0,
      torsoLean: 0,
      headYaw: 0,
      talkingActive: false,
      isSpeaking: false,
      audioAmplitude: 0,
      excitement: 0.2,
      poseBlend: 1,
    };
  }

  const beatText = `${activeBeat?.action ?? ''} ${activeBeat?.triggerWord ?? ''}`.toLowerCase();
  const beatIdx = Math.max(0, scene.timeline.indexOf(activeBeat as SceneBeat));
  const beatElapsed = Math.max(0, scriptSec - (activeBeat?.startSec ?? 0));
  const poseBlend = smoothstep(0, 0.48, beatElapsed);

  const appear = charSpec.appearFromSec ?? 0;
  const hide = charSpec.hideAfterSec ?? 16;
  const phase = charIdx * 1.85 + charSpec.slot.length * 0.7;

  // Identify whether the active beat specifically directs THIS character vs another character
  const myRegex = getCharacterKeywords(charSpec.id);
  const beatMentionsMe = myRegex.test(beatText);
  const otherMentions = visibleChars.some(
    (other) => other !== charSpec && getCharacterKeywords(other.id).test(beatText)
  );
  const beatAppliesToMe = beatMentionsMe || !otherMentions || visibleChars.length === 1;

  // Determine natural eye contact direction toward conversation partner
  const otherSlots = visibleChars.filter((c) => c !== charSpec).map((c) => c.slot);
  const baseLookDir =
    charSpec.facing === 'left'
      ? -1
      : charSpec.facing === 'right'
        ? 1
        : charSpec.slot === 'left'
          ? 1
          : charSpec.slot === 'right'
            ? -1
            : otherSlots.includes('left') && !otherSlots.includes('right')
              ? -1
              : otherSlots.includes('right') && !otherSlots.includes('left')
                ? 1
                : Math.sin(effectiveTime * 0.55 + phase) >= 0
                  ? 1
                  : -1;

  // Natural human gaze: steady eye contact with partner, occasional smooth glance toward camera
  const glanceToCam = Math.max(0, Math.sin(effectiveTime * 0.7 + phase));
  const headYaw = Math.max(
    -1,
    Math.min(1, baseLookDir * (0.72 - glanceToCam * 0.35))
  );

  // Respect scripted rest/activity poses
  const lockedRestPose =
    charSpec.pose === 'sleep' ||
    charSpec.pose === 'lie-down' ||
    charSpec.pose === 'float';

  let gestureMode: GestureMode = 'converse';
  let poseOverride: CharacterPose | undefined = undefined;
  let expressionOverride: SceneCharacterSpec['expression'] | undefined = undefined;
  let excitement = 0.65;

  // Special Episode 1 Scene 1 realism: Newborn Albert sits tucked comfortably inside crib
  const isEp1S1Newborn =
    episodeId === 1 && scene.sceneNumber === 1 && charSpec.id === 'albert-baby';

  const isEntering = charSpec.appearFromSec !== undefined && scriptSec - appear < 0.9;
  const isExiting = charSpec.hideAfterSec !== undefined && hide - scriptSec < 0.7;
  const isKaget = Boolean(
    activeBeat &&
      (activeBeat.zoomKaget ||
        ZOOM_KAGET_REGEX.test(activeBeat.triggerWord) ||
        ZOOM_KAGET_REGEX.test(activeBeat.action))
  );

  if (isEp1S1Newborn) {
    poseOverride = 'sit';
    gestureMode = isKaget ? 'shock' : 'celebrate';
    excitement = 0.7;
  } else if (isEntering || isExiting) {
    gestureMode = 'walk';
    if (!lockedRestPose && charSpec.pose !== 'sit' && charSpec.pose !== 'cradle') {
      poseOverride = 'walk';
    }
    excitement = 0.78;
  } else if (isKaget && beatAppliesToMe) {
    gestureMode = /lari|kabur/.test(beatText) ? 'run' : 'shock';
    expressionOverride = 'shocked';
    excitement = 0.92;
  } else if (beatAppliesToMe && /lari|kabur|kejar|bergegas/.test(beatText)) {
    gestureMode = 'run';
    if (!lockedRestPose) poseOverride = 'run';
    excitement = 0.9;
  } else if (beatAppliesToMe && /jalan|keluar|masuk|mendaki|menjauh|melangkah/.test(beatText)) {
    gestureMode = 'walk';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'walk';
    excitement = 0.78;
  } else if (charSpec.pose === 'violin' || (beatAppliesToMe && /biola|gesek/.test(beatText))) {
    gestureMode = 'violin';
    poseOverride = 'violin';
    excitement = 0.82;
  } else if (charSpec.pose === 'cradle' || (beatAppliesToMe && /gendong|timang/.test(beatText))) {
    gestureMode = 'cradle';
    if (!lockedRestPose) poseOverride = 'cradle';
    excitement = 0.74;
  } else if (charSpec.pose === 'write' || (beatAppliesToMe && /tulis|coret|tanda tangan/.test(beatText))) {
    gestureMode = 'work';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'write';
    excitement = 0.8;
  } else if (charSpec.pose === 'type' || (beatAppliesToMe && /ketik|ngetik|ponsel/.test(beatText))) {
    gestureMode = 'work';
    if (!lockedRestPose) poseOverride = 'type';
    excitement = 0.78;
  } else if (charSpec.pose === 'kneel' || (beatAppliesToMe && /ngolong|cari|sujud/.test(beatText))) {
    gestureMode = 'search';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'kneel';
    excitement = 0.8;
  } else if (charSpec.pose === 'scratch-head' || (beatAppliesToMe && /garuk|kikuk|pusing/.test(beatText))) {
    gestureMode = 'think-pace';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'scratch-head';
    excitement = 0.72;
  } else if (charSpec.pose === 'think' || (beatAppliesToMe && /mikir|renung|amati/.test(beatText))) {
    gestureMode = 'think-pace';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'think';
    excitement = 0.7;
  } else if (charSpec.pose === 'point' || (beatAppliesToMe && /marah|gebrak|tunjuk|debat|bantah|protes/.test(beatText))) {
    gestureMode = 'argue';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'point';
    excitement = 0.86;
  } else if (charSpec.pose === 'wave' || (beatAppliesToMe && /lambai|sorak|senang|tertawa|selfie/.test(beatText))) {
    gestureMode = 'celebrate';
    if (!lockedRestPose && charSpec.pose !== 'sit') poseOverride = 'wave';
    excitement = 0.84;
  } else if (charSpec.pose === 'read') {
    gestureMode = 'converse';
    poseOverride = 'read';
    excitement = 0.65;
  } else if (charSpec.pose === 'sit') {
    gestureMode = 'converse';
    poseOverride = 'sit';
    excitement = 0.65;
  }

  // Grounded Stage Blocking: ONLY translate walkOffsetX when genuinely walking/running/entering/exiting!
  let walkOffsetX = 0;
  let walkPhase: number | undefined = undefined;
  const maxStep =
    visibleChars.length <= 1
      ? 68
      : visibleChars.length === 2 && !visibleChars.some((c) => c.slot === 'center')
        ? 44
        : 24;

  if (isEntering) {
    const enterP = 1 - smoothstep(0, 0.9, scriptSec - appear);
    const enterDir = charSpec.slot === 'right' ? 1 : -1;
    walkOffsetX = enterDir * enterP * 110;
    walkPhase = (scriptSec - appear) * 6.4;
  } else if (isExiting) {
    const exitP = smoothstep(0, 0.7, scriptSec - (hide - 0.7));
    const exitDir = charSpec.slot === 'right' ? 1 : -1;
    walkOffsetX = exitDir * exitP * 110;
    walkPhase = scriptSec * 6.4;
  } else if ((gestureMode === 'walk' || gestureMode === 'run') && !lockedRestPose && charSpec.pose !== 'sit') {
    const speed = gestureMode === 'run' ? 2.4 : 1.05;
    walkOffsetX = Math.sin(effectiveTime * speed + phase) * maxStep * poseBlend;
    // Lock gait leg cycle directly to direction & travel velocity!
    walkPhase = effectiveTime * (gestureMode === 'run' ? 9.5 : 5.6) + phase;
  }

  // Realistic Single-Impulse Hop on Zoom-Kaget ONLY (never pogo-sticking!)
  let hopY = 0;
  if (isKaget && activeBeat && beatAppliesToMe && !lockedRestPose && !isEp1S1Newborn && charSpec.pose !== 'sit') {
    if (beatElapsed >= 0 && beatElapsed <= 0.42) {
      hopY = -Math.sin((beatElapsed / 0.42) * Math.PI) * 24;
    }
  }

  // Conversational Turn-Taking: only active speaker/named actor raises hands & speaks; others listen attentively!
  const isSpeaking =
    Boolean(charSpec.quoteBubble) ||
    (beatMentionsMe && !otherMentions) ||
    (!beatMentionsMe && !otherMentions && (visibleChars.length === 1 || beatIdx % visibleChars.length === charIdx));

  // Subtle Natural Human Torso Lean
  const torsoLean =
    gestureMode === 'shock'
      ? -baseLookDir * 0.08 * poseBlend
      : gestureMode === 'argue'
        ? baseLookDir * 0.075 * poseBlend
        : gestureMode === 'work' || gestureMode === 'search'
          ? baseLookDir * 0.065 * poseBlend
          : isSpeaking
            ? baseLookDir * 0.035 * poseBlend
            : 0;

  const talkingActive =
    Boolean(charSpec.quoteBubble) ||
    (audioAmplitude > 0.08 && isSpeaking && gestureMode !== 'violin' && !isEp1S1Newborn);

  return {
    poseOverride,
    expressionOverride,
    gestureMode,
    walkOffsetX,
    walkPhase,
    hopY,
    torsoLean,
    headYaw,
    talkingActive,
    isSpeaking,
    audioAmplitude: Math.max(audioAmplitude, talkingActive ? 0.48 : 0.12),
    excitement: Math.max(0.5, Math.min(1, excitement)),
    poseBlend,
  };
}

export function renderStudioFrame(
  ctx: CanvasRenderingContext2D,
  opts: RenderFrameOptions
) {
  const {
    episode,
    localTimeSec,
    sceneDurations,
    target,
    audioAmplitude,
    showSafeZone,
  } = opts;

  const resolved = resolvePlaybackPoint(
    episode,
    localTimeSec,
    sceneDurations,
    target
  );
  const {
    scene,
    sceneElapsed,
    sceneDuration,
    scriptSec,
    isSilentFreeze,
    freezeElapsed,
  } = resolved;

  const cam = computeCameraTransform(scene, scriptSec, isSilentFreeze);
  const effectiveTime = isSilentFreeze
    ? sceneDuration - 1
    : sceneElapsed + resolved.sceneIndex * 15;

  const freezeLen = scene.sceneNumber === 4 ? Math.min(1.0, sceneDuration * 0.12) : 0;
  const activeNarrativeDur = Math.max(0.5, sceneDuration - freezeLen);

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Apply Camera Transform to L0..L4
  ctx.save();
  ctx.translate(CANVAS_W / 2 + cam.tx, CANVAS_H / 2 + cam.ty);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);

  // L0 & L1: Chalkboard Base + 12 Master Backgrounds (with 2.5D multi-layer parallax)
  renderMasterBackground(ctx, {
    bgId: scene.backgroundId,
    variant: scene.backgroundVariant,
    timeSec: effectiveTime,
    sceneProgress: Math.min(1, scriptSec / 15),
    splitScreen: scene.splitScreen,
    splitLeftLabel: scene.splitLeftLabel,
    splitRightLabel: scene.splitRightLabel,
    chalkMotif: scene.chalkMotif,
    camTx: cam.tx,
    camTy: cam.ty,
  });

  // L2: Animated Chalk Motifs & Floating Dust Particles
  drawAnimatedChalkMotif(ctx, scene, scriptSec);
  drawChalkDustParticles(ctx, effectiveTime, 28, 0.35);

  // L3 & L4: Living Articulated 2.5D Clay Characters + Props with Beat-Driven Active Acting
  const visibleChars = scene.characters.filter((c) => {
    const appear = c.appearFromSec ?? 0;
    const hide = c.hideAfterSec ?? 16;
    return scriptSec >= appear && scriptSec <= hide;
  });

  const activeBeat =
    scene.timeline.find(
      (b) => scriptSec >= b.startSec && scriptSec <= b.endSec
    ) ??
    scene.timeline[
      Math.min(
        scene.timeline.length - 1,
        Math.max(0, Math.floor((scriptSec / 15) * scene.timeline.length))
      )
    ];

  for (let idx = 0; idx < visibleChars.length; idx++) {
    const charSpec = visibleChars[idx];

    // Special comedic head enlargement in Ep 1 S1 (8..11s)
    const isEp1S1BigHead =
      episode.id === 1 &&
      scene.sceneNumber === 1 &&
      charSpec.id === 'albert-baby' &&
      scriptSec >= 7.5 &&
      scriptSec <= 11.5;

    const dynamicScale = isEp1S1BigHead
      ? (charSpec.scale ?? 1) * 1.24
      : charSpec.scale ?? 1;

    const acting = computeCharacterActingState(
      episode.id,
      scene,
      charSpec,
      visibleChars,
      idx,
      activeBeat,
      scriptSec,
      effectiveTime,
      audioAmplitude,
      isSilentFreeze
    );

    const isEp1S1Newborn =
      episode.id === 1 && scene.sceneNumber === 1 && charSpec.id === 'albert-baby';
    const isEp1S1Pauline =
      episode.id === 1 && scene.sceneNumber === 1 && charSpec.id === 'pauline';
    const isEthNetijen =
      scene.backgroundVariant === 'administrasi-eth' &&
      charSpec.id === 'netijen' &&
      (charSpec.yOffset ?? 0) < -200;

    const slotX = SLOT_X[charSpec.slot] + (isEthNetijen ? 95 : 0);
    drawCharacter25D(
      ctx,
      {
        ...charSpec,
        prop: isEp1S1Pauline ? undefined : charSpec.prop,
        pose: isEp1S1Pauline ? 'stand' : charSpec.pose,
        scale: dynamicScale,
        yOffset: isEp1S1Newborn ? -38 : isEthNetijen ? -60 : charSpec.yOffset,
      },
      slotX,
      FLOOR_Y,
      effectiveTime,
      isSilentFreeze,
      isEp1S1Pauline
        ? { ...acting, poseOverride: 'stand', gestureMode: 'converse', isSpeaking: true }
        : acting
    );
  }

  ctx.restore(); // End Camera Transform

  // L5: Pop-up Banner (y = 300..700)
  if (scene.sceneNumber !== 4 && scriptSec >= 9.5) {
    drawPopupBanner(
      ctx,
      scene.popupText,
      scene.popupSecondaryText,
      scene.popupTone,
      scriptSec - 9.5,
      440
    );
  }

  // L6: Scene 4 Mandatory Cek Fakta Card (y=1315..1480, scriptSec 7..11)
  if (
    scene.sceneNumber === 4 &&
    scene.spillFakta &&
    scriptSec >= 7 &&
    scriptSec < 12.2
  ) {
    drawSpillFaktaCard(ctx, scene.spillFakta, scriptSec - 7);
  }

  // L6: Word-by-Word Karaoke Subtitle (y=1560)
  drawKaraokeSubtitle(
    ctx,
    scene.narration,
    sceneElapsed,
    activeNarrativeDur,
    isSilentFreeze
  );

  // L6: Cinematic Vignette (pink subtle alert in Ep 9 S3)
  drawCinematicVignette(
    ctx,
    episode.id === 9 && scene.sceneNumber === 3
  );

  // L6: Top-left Pill Header ('EINSTEIN • EPISODE [X]') at x=60, y=150
  drawEpisodePillHeader(ctx, episode.id);

  // L6: Sang Penutur (Narrator) Microphone (y=204..288)
  drawNarratorMic(ctx, effectiveTime, audioAmplitude, isSilentFreeze);

  // L6: Cliffhanger Fade-to-Black + Red Slanted Stamp ("BERSAMBUNG…" / "MUSIM 2: SEGERA")
  if (isSilentFreeze) {
    drawCliffhangerOverlay(
      ctx,
      freezeElapsed,
      Boolean(scene.isSeasonFinale)
    );
  }

  // Scene Transition Overlay (Glitch 6-frame / Swipe-up 12-frame)
  if (scene.transitionIn && scene.transitionIn !== 'none') {
    drawTransitionOverlay(ctx, scene.transitionIn, sceneElapsed);
  }

  // Optional TikTok / Reels Safe Zone Guide
  if (showSafeZone) {
    drawSafeZoneOverlay(ctx);
  }

  ctx.restore();
}
