import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuidv4 } from "uuid";

import dayjs from "dayjs";
import { Location, User } from "../model";

type Data = {
  users: User[];
  locations: Location[];
};
const defaultData = { users: [], locations: [] };

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const adapter = new JSONFile<Data>(file);
const db = new Low(adapter, defaultData);

await db.read();

export async function saveLocation(location: Location) {
  db.data.locations.push({
    ...location,
    id: uuidv4(),
    handled: false,
    created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  });
  await db.write();
}

export function getUnhandledLocationNumber(kindom: string) {
  const unhandledLocations = db.data.locations.filter(
    (location) => location.kindom === kindom && !location.handled
  );
  return unhandledLocations.length;
}

export function getEarliestUnhandledLocation(kindom: string) {
  const unhandledLocations = db.data.locations.filter(
    (location) => location.kindom === kindom && !location.handled
  );
  return unhandledLocations[0];
}

export function getEveryKindowmEarlestUnhandledLocation() {
  const users = db.data.users;
  const locations = users
    .map((user) => {
      return getEarliestUnhandledLocation(user.kindom);
    })
    .filter((location) => !!location);
  return locations;
}
export function getLocationHistory(length: number) {
  const locations = db.data.locations;
  return locations.slice(0).reverse().slice(0, length).reverse();
}
export default db;
