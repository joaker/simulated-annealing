import Guest from '../types/guest';
import GuestList from '../types/guest-list';
import { sameTable, scoreTable } from './scorer';

const scoreImproved = (change: number) => change > 0;
const accept = true;
const reject = false;

const scaleMax = 10;
const scaleTemperature = (temperature: number, maxTemperature: number) => (temperature / maxTemperature) * scaleMax;


export const shouldAcceptChange = (change: number, temperature: number, maxTemperature: number) => {
  if (scoreImproved(change)) return accept;

  const scaledTemperature = scaleTemperature(temperature, maxTemperature);

  // TODO: Toy with this number a bit
  // Acceptance Probabilities: http://artint.info/html/ArtInt_89.html
  const acceptanceMargin = Math.exp(change / scaledTemperature);
  const fate = Math.random();

  // Do we explore, even though it's a bad change?
  const explore = (fate < acceptanceMargin) ? accept : reject;

  return explore;
}


/**
 * Selects a guest index at random, given a max guest count
 * @param guestCount total number of guests
 * @returns returns the ith index
 */
const pickGuest = (guestCount: number) => Math.floor(Math.random() * guestCount);

/**
 * Selects the subarray from the array of all guests that represents the table where the user is
 * @param guestIndex index of the guest
 * @param tableSize size of each table
 * @param guests guest array
 * @returns 
 */
const getTable = (guestIndex: number, tableSize: number, guests: Guest[]) => {
  const start = guestIndex - (guestIndex % tableSize);
  const end = start + tableSize;
  const tableGuests = guests.slice(start, end);
  return {
    start: start,
    end: end,
    guests: tableGuests,
  };
};

/**
 * Perform one optimization step
 * @param guestList Guest array
 * @param tableSize Size of each table
 * @param temperature The "temperature" which decides how easily we accept change.  Higher temp == more change
 * @param maxTemperature The maximum temperature
 * @param mode best | like | hate
 * @returns The updated guest list
 */
export const step = (guestList: GuestList, tableSize: number, temperature: number, maxTemperature: number, mode: string) => {

  // get the guests from the guest list
  const guests = guestList.guests;

  // if there's no guests, return the input
  if (!guests) return guestList;

  const guestCount = guests.length;

  // if there's no guests, return the input
  if (!guestCount) return guestList;

  // pick two guests to operate on
  const guest1Index = pickGuest(guestCount);
  const guest2Index = pickGuest(guestCount);

  // if both guests are at the same table, return the input
  if (sameTable(guest1Index, guest2Index, tableSize)) return guestList;

  const table1 = getTable(guest1Index, tableSize, guests);
  const table2 = getTable(guest2Index, tableSize, guests);

  // If the tables are the same, don't bother
  const t1Score = scoreTable(table1.guests, mode);
  const t2Score = scoreTable(table2.guests, mode);

  const initialScore = t1Score + t2Score;

  const guest1TableIndex = guest1Index - (table1.start);
  const guest2TableIndex = guest2Index - (table2.start);

  const firstGuest = guests[guest1Index];
  const secondGuest = guests[guest2Index];

  // swap the guests' tables
  table1.guests.splice(guest1TableIndex, 1, secondGuest);
  table2.guests.splice(guest2TableIndex, 1, firstGuest);

  // rescore the tables
  const t1NextScore = scoreTable(table1.guests, mode);
  const t2NextScore = scoreTable(table2.guests, mode);
  const nextScore = t1NextScore + t2NextScore;

  const change = nextScore - initialScore;

  const accepted = shouldAcceptChange(change, temperature, maxTemperature);

  if (!accepted) return guestList;

  // const percentOfTemp = temperature / maxTemperature;
  // const swap = (diff > 0) || (Math.random() < percentOfTemp);
  // if(!swap) return state;

  // Swap the guests
  guests.splice(guest1Index, 1, secondGuest);
  guests.splice(guest2Index, 1, firstGuest);

  return {
    guests,
    score: guestList.score + change,
  };
}

export default step;
