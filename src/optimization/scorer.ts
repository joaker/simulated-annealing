import { Guest } from '../types/guest.js';
import { DEFAULT_MODE, MODES, MODE_PART_WEIGHTS, MODE_TO_PARTS } from './constants.js';

export const sameTable = (guest1Index: number, guest2Index: number, tableSize: number) => {
    const start1 = guest1Index - (guest1Index % tableSize);
    const start2 = guest2Index - (guest2Index % tableSize);
    const same = start1 == start2;
    return same;
}



export const hateWeight = 1;
export const likeWeight = 0;

export const createSelectAssociations = (mode: string) => (guest: Guest) => mode === MODES.Like ? guest.likes : guest.hates;

export const toIDs = (guests: Guest[]) => guests.map(g => g.id);

export const getGuestScores = (guest: Guest, neighborIDs: number[], mode: string = DEFAULT_MODE) => {
    const scores: any = {};

    const modeParts: string[] = MODE_TO_PARTS[mode];

    for (let modePart of modeParts) {
        const modePartWeight: number = MODE_PART_WEIGHTS[modePart as string];
        const rawPartScore = scoreGuest(guest, neighborIDs, modePart);
        const weightedPartScore = rawPartScore * modePartWeight;
        scores[modePart] = weightedPartScore;
    }

    return scores;

}

export const scoreGuest = (guest: Guest, neighborIDs: number[], modePart: string = MODES.Like) => {
    const relates = createSelectAssociations(modePart)(guest);
    const score = neighborIDs.filter(gid => relates.includes(gid)).length;
    return score;
}

const countMatches = (guests: Guest[], ids: number[], modePart: string = MODES.Like) => {

    // Don't have guest IDs?  Then populate them
    if (!ids) ids = toIDs(guests);

    // match
    const matchCounts = guests.map(g => {
        const guestScore = scoreGuest(g, ids, modePart);
        return guestScore;
    });

    const totalMatches = matchCounts.reduce((total, c) => (total + c), 0);

    return totalMatches;
}

const makeCounter = (table: Guest[]) => {
    const guestIDs = toIDs(table);
    const counter = (mode: string, weight = 1) => countMatches(table, guestIDs, mode);
    return counter;
}

export const scoreTable = (table: Guest[], mode = MODES.Best) => {
    // Create a function to count matches in this table
    const counter = makeCounter(table);

    // Get the associations (positive, negative, etc)
    const modeParts = MODE_TO_PARTS[mode];

    // score each type
    const partialScores = modeParts.map(mp => counter(mp));
    const score = partialScores.reduce((total, partial, index) => {
        const modePart = modeParts[index];
        const partWeight = MODE_PART_WEIGHTS[modePart];
        const nextTotal = total + partial * partWeight;
        return nextTotal;
    }, 0);

    return score;

}
