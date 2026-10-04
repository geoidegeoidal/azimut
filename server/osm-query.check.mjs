import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overpassQuery } from './osm-query.mjs';
const bounds = [-70.69, -33.46, -70.68, -33.45];
test('bounds are constrained to a small area in Chile', () => {
  assert.throws(() => overpassQuery({ street: 'Matucana', bounds: [-180, -90, 180, 90] }));
  assert.throws(() => overpassQuery({ street: 'Matucana', bounds: [-71, -34, -70, -33] }));
});
test('street input is quoted and regular expression metacharacters escaped', () => {
  const query = overpassQuery({ street: 'Avenida Zzz.*"', bounds });
  assert.ok(query.includes('Zzz\\\\.\\\\*\\"'));
  assert.ok(query.includes('(._;>;);'));
});
test('searching without accents still finds an accented street', () => {
  assert.ok(overpassQuery({ street: 'Jose', bounds }).includes('[eéèêë]'));
});
