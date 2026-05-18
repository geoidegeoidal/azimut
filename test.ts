import { normalize } from './src/engine/normalizer';
import { geocodeNominatim } from './src/engine/geocoder';

const addr1 = "Pio Nono 110, Recoleta";

const norm = normalize(addr1);
console.log("Normalized:", norm);

const controller = new AbortController();

async function test() {
  try {
    const res = await geocodeNominatim(norm.normalized, controller.signal);
    console.log("Nominatim:", res);
  } catch(e) {
    console.log("Nominatim Error", e);
  }
}
test();
