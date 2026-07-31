import type { Cafe, CafeBranch } from '../types';

/**
 * The five counters students actually queue at on the VIT Bhopal campus.
 * Mayuri runs two branches, so brand and branch are modelled separately.
 */

export const CAFES: Cafe[] = [
  {
    id: 'underbelly',
    name: 'Under Belly',
    tagline: 'Good food, good mood',
    brandColor: '#D95D39',
    description:
      'The big all-rounder near AB-1. Dosas at 8am, tandoori by night, and the longest menu board on campus.',
    cuisine: ['South Indian', 'North Indian', 'Chinese', 'Bakery'],
  },
  {
    id: 'mayuri',
    name: "Mayuri's",
    tagline: 'Chai, chaat and everything in between',
    brandColor: '#F3A712',
    description:
      'Quick bites between lectures — samosa, kachori, momos and shakes, served fast at two counters.',
    cuisine: ['Chaat', 'Snacks', 'Beverages'],
  },
  {
    id: 'dakshin',
    name: 'AB Dakshin',
    tagline: 'Food for thought',
    brandColor: '#196B45',
    description:
      'Pure South Indian. Dosa, idli, vada and filter coffee poured the way it should be.',
    cuisine: ['South Indian', 'Filter Coffee'],
  },
  {
    id: 'bistro',
    name: 'Bistro by Safal Café',
    tagline: 'Slow mornings, good coffee',
    brandColor: '#A92F34',
    description:
      'The sit-down one. Espresso, wood-fired-style 7" pizzas and pasta under warm pendant lights.',
    cuisine: ['Continental', 'Coffee', 'Pizza'],
  },
];

export const BRANCHES: CafeBranch[] = [
  {
    id: 'underbelly',
    cafeId: 'underbelly',
    name: 'Under Belly',
    shortName: 'Under Belly',
    location: 'Near AB-1, ground floor',
    opensAt: '08:00',
    closesAt: '22:30',
    rating: 4.3,
    ratingCount: 1284,
    basePrepMinutes: 9,
    activeOrderCount: 12,
    isOpen: true,
    description:
      'Everything from ghee sambar idly to tandoori chicken. Busiest between 1pm and 2pm — order ahead if you have a 2pm lab.',
    pickupPoint: 'Counter 1, AB-1 food court',
  },
  {
    id: 'mayuri-ab',
    cafeId: 'mayuri',
    name: "Mayuri's — AB-1",
    shortName: 'Mayuri AB-1',
    location: 'Academic Block 1, arcade',
    opensAt: '08:30',
    closesAt: '20:00',
    rating: 4.1,
    ratingCount: 862,
    basePrepMinutes: 6,
    activeOrderCount: 18,
    isOpen: true,
    description:
      'The between-lectures counter. Samosa, kachori and chai turn around in minutes, so the queue moves even at peak.',
    pickupPoint: 'Mayuri counter, AB-1 arcade',
  },
  {
    id: 'mayuri-special',
    cafeId: 'mayuri',
    name: "Mayuri's — Special Block",
    shortName: 'Mayuri Special',
    location: 'Special Block, near hostel gate',
    opensAt: '09:00',
    closesAt: '23:30',
    rating: 4.0,
    ratingCount: 517,
    basePrepMinutes: 7,
    activeOrderCount: 4,
    isOpen: true,
    description:
      'Same kitchen, hostel-side hours. Open late for Maggi, egg bhurji and midnight chai after the AB-1 counter shuts.',
    pickupPoint: 'Mayuri counter, Special Block',
  },
  {
    id: 'dakshin',
    cafeId: 'dakshin',
    name: 'AB Dakshin',
    shortName: 'AB Dakshin',
    location: 'Special Block, food court',
    opensAt: '07:30',
    closesAt: '21:00',
    rating: 4.5,
    ratingCount: 943,
    basePrepMinutes: 8,
    activeOrderCount: 7,
    isOpen: true,
    description:
      'Batter ground on site. Best filter coffee on campus and the only place doing a proper Mysore masala dosa.',
    pickupPoint: 'Dakshin counter, Special Block',
  },
  {
    id: 'bistro-safal',
    cafeId: 'bistro',
    name: 'Bistro by Safal Café',
    shortName: 'Bistro',
    location: 'Special Block, first floor',
    opensAt: '09:00',
    closesAt: '22:00',
    rating: 4.4,
    ratingCount: 671,
    basePrepMinutes: 12,
    activeOrderCount: 3,
    isOpen: true,
    description:
      'Sit down with a laptop and a cold brew. Pizzas and pasta take a little longer, so the pickup window is worth checking.',
    pickupPoint: 'Bistro counter, Special Block 1F',
  },
];

/** Token prefixes so a student can tell UB-14 from DK-14 at a glance. */
export const TOKEN_PREFIX: Record<string, string> = {
  underbelly: 'UB',
  'mayuri-ab': 'MA',
  'mayuri-special': 'MS',
  dakshin: 'DK',
  'bistro-safal': 'BS',
};

export const getCafe = (cafeId: string) => CAFES.find((c) => c.id === cafeId);

export const getBranchCafe = (branch: CafeBranch) => getCafe(branch.cafeId);
