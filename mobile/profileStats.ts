export type VerifiedProfileStats = {
  name: string;
  owner: boolean;
  works: number;
  formats: number;
  series: number;
  startedAudio: number;
  completedAudio: number;
  inProgressAudio: number;
  startedReading: number;
  completedReading: number;
  inProgressReading: number;
  inProgress: number;
  completed: number;
  rated?: number;
  favourites?: number;
  averageRating?: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

function achievement(id: string, title: string, description: string, progress: number, target: number): Achievement {
  return {id,title,description,progress:Math.max(0,progress),target,unlocked:progress>=target};
}

export function achievementsFor(stats: VerifiedProfileStats): Achievement[] {
  return [
    achievement('first-shelf','First shelf','Add your first work to Archivist.',stats.works,1),
    achievement('format-explorer','Format explorer','Build a library across three different media formats.',stats.formats,3),
    achievement('series-keeper','Series keeper','Catalogue five distinct series.',stats.series,5),
    achievement('first-finish','First finish','Finish your first book, comic or audiobook.',stats.completed,1),
    achievement('ten-finished','Ten finished','Finish ten works.',stats.completed,10),
    achievement('curator','Curator','Build a library of 100 works.',stats.works,100),
    achievement('deep-archive','Deep archive','Build a library of 1,000 works.',stats.works,1000),
  ];
}

export function clampProgress(progress: number, target: number) {
  if (target <= 0) return 1;
  return Math.max(0,Math.min(1,progress/target));
}
