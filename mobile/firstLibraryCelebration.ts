/** A scan completion is not a celebration unless a real published work is visible. */
export type FirstLibraryCelebrationInput={
  eligible:boolean;finishedScan:boolean;onboardingDone:boolean;hasPublishedLocalWork:boolean;
  scanning:boolean;restoring:boolean;otherCelebrationActive:boolean;alreadyClaimed:boolean;
};
export function shouldCelebrateFirstLibrary(i:FirstLibraryCelebrationInput){
  return i.eligible&&i.finishedScan&&i.onboardingDone&&i.hasPublishedLocalWork
    &&!i.scanning&&!i.restoring&&!i.otherCelebrationActive&&!i.alreadyClaimed;
}
