export const maxColumns = 12;
export const offsetColumns = 2;
export const contentColumns = 10;

export const tablesPerRow = 10;
export const guestsPerTable = 16;

export const tableCount = 16;
export const rowCount = tableCount / tablesPerRow + ((tableCount % tablesPerRow) ? 1 : 0);

export const tableColumnCount = 3;
export const tableRowCount = 3;


export const seatsPerTable = 16;
export const DEFAULT_TABLE_SIZE = seatsPerTable;
export const guestCount = seatsPerTable * tableCount;

export const minGuestCount = 20;
export const maxGuestCount = 5*1000;

export const minSeatsPerTable = 4;
export const maxSeatsPerTable = 100;
export const seatsPerTableValues = [2, 3, 4, 6, 8, 9, 10, 12, 16, 25, 50, 100];

export const layoutDimensions = {rowCount, columnCount: tablesPerRow};

export const maxScore = 100;


export const toTemperature = (size: number) => Math.pow(10, size);
export const toSize = (temperature: number) => Math.log10(temperature);

export const minSize = 3;
export const defaultSize = 4; // 10000
export const maxSize = 6; // 10,000,000
export const interval = 0.5;

export const minTemperature = toTemperature(minSize);
export const defaultTemperature = toTemperature(defaultSize);
export const maxTemperature = toTemperature(defaultSize);
export const DEFAULT_MAX_TEMPERATURE = maxTemperature;

export const fromDifficultyRating = (rating: number) => (rating * 2);
export const toDifficultyRating = (value: number) => {
  const rating = (value / 2);
  return rating;

}
export const difficultyRatings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const difficulty = 8;
export const easy = 2;
export const normal = 8;
export const hard = 12;

export const defaultMode = 'best'; // default optimization mode
export const defaultModePart = 'hate'; // default optimization mode


export const config = {
  size: 100,
  rate: 4,
  delay: 20,
  updateDelay: 100,
}

export default config;



export const MODES = {
    Hate: 'hate',
    Like: 'like',
    Best: 'best',
};

export const MODE_TO_PARTS = {
    [MODES.Hate]: [MODES.Hate],
    [MODES.Like]: [MODES.Like],
    [MODES.Best]: [MODES.Hate, MODES.Like],
}

export const MODE_PART_WEIGHTS = {
    [MODES.Hate]: -1,
    [MODES.Like]: 1,
}

export const DEFAULT_MODE = MODES.Best;