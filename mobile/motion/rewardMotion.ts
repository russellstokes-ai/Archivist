import type {ArchivistMotionKind} from './ArchivistMotion';
/** Changes illustration only; the existing award ledger remains the only award source. */
export function rewardAnimationForTitle(title:string):ArchivistMotionKind{
 const t=title.toLowerCase();
 if(/deep archive|1000|2000|master archivist/.test(t))return 'firework-burst';
 if(/curator|series keeper|100 works/.test(t))return 'trophy';
 if(/format explorer|explorer|legend/.test(t))return 'twinkle-crown';
 if(/ten finished|stories completed|first finish|25|50|100/.test(t))return 'level-up-confetti';
 return 'badge';
}
