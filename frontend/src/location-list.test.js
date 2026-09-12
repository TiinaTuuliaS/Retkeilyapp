import test from 'node:test';
import assert from 'node:assert/strict';
import { filterLocations } from './location-list.js';

const near = { id: 1, name: 'Suoliojan nuotiopaikka', latitude: 61.448, longitude: 23.814 };
const far = { id: 2, name: 'UKK laavu', latitude: 68.2, longitude: 28.1 };
const missing = { id: 3, name: 'Sijainnittoman kohteen nimi', latitude: null, longitude: null };
const all = [near, far, missing];
const bounds = { south: 61.4, north: 61.5, west: 23.8, east: 23.9 };
test('panning changes the list; missing coordinates are excluded', () => {
  assert.deepEqual(filterLocations(all, all, '', bounds), [near]);
  assert.deepEqual(filterLocations(all, all, '', { south: 68, north: 69, west: 28, east: 29 }), [far]);
  assert.deepEqual(filterLocations(all, [far], '', bounds), []);
});
test('name search ignores viewport and park scope, including unlocated records', () => {
  assert.deepEqual(filterLocations(all, [near], ' UKK ', bounds), [far]);
  assert.deepEqual(filterLocations(all, [near], 'sijainnittoman', bounds), [missing]);
  assert.deepEqual(filterLocations(all, all, '  ', bounds), [near]);
});
test('initial bounds and wrapped world copies are handled', () => {
  assert.deepEqual(filterLocations(all, all, '', null), []);
  assert.deepEqual(filterLocations(all, all, '', { ...bounds, west: 383.8, east: 383.9 }), [near]);
});
