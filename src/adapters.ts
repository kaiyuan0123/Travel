import { byId, places, type Item, type Place } from "./data";
import { distance } from "./engine";
export const placesAdapter = {
  list: (city: string) => places.filter((p) => p.city === city),
  get: (id: string): Place => byId[id],
};
export const mapAdapter = {
  style: "https://tiles.openfreemap.org/styles/liberty",
};
const exampleRoutes: {
  ids: string[];
  path: [number, number][];
  minutes: number[];
}[] = [
  {
    ids: ["opera", "library", "munch", "akershus"],
    path: [
      [10.753, 59.9075],
      [10.7522, 59.908],
      [10.7521, 59.908],
      [10.7534, 59.9077],
      [10.7553, 59.907],
      [10.7552, 59.9061],
      [10.7546, 59.9065],
      [10.7526, 59.9071],
      [10.7505, 59.9077],
      [10.7469, 59.9071],
      [10.7418, 59.9065],
      [10.7387, 59.9065],
      [10.7369, 59.9075],
    ],
    minutes: [5, 12, 25],
  },
  {
    ids: ["bryggen", "fish", "floyen"],
    path: [
      [5.3245, 60.397],
      [5.3244, 60.3964],
      [5.3246, 60.3954],
      [5.3269, 60.3958],
      [5.3291, 60.3966],
      [5.332, 60.397],
      [5.3372, 60.3982],
      [5.3431, 60.3991],
    ],
    minutes: [8, 35],
  },
  {
    ids: ["kode", "lake"],
    path: [
      [5.3287, 60.3898],
      [5.3291, 60.3897],
      [5.3302, 60.39],
      [5.3293, 60.3902],
    ],
    minutes: [5],
  },
];
export function routeFor(items: Item[]) {
  const ids = items.map((i) => i.placeId);
  const fixture = exampleRoutes.find((r) => r.ids.join("|") === ids.join("|"));
  return {
    source: fixture ? "demo" : "estimate",
    coordinates: fixture?.path ?? ids.map((id) => byId[id].coordinates),
    minutes:
      fixture?.minutes ??
      items
        .slice(1)
        .map((i, n) =>
          Math.ceil(
            distance(
              byId[items[n].placeId].coordinates,
              byId[i.placeId].coordinates,
            ) / 65,
          ),
        ),
  };
}
export const locationAdapter = {
  eligible: (
    position: [number, number] | null,
    accuracy: number | null,
    place: Place,
  ) =>
    position !== null &&
    accuracy !== null &&
    accuracy <= 100 &&
    distance(position, place.coordinates) <= 200,
};
