import { Location } from "../../model";
import db from "../../db";

export function isLocationValid(location: Location) {
  const { kindom, password } = location;
  const users = db.data.users;
  const userExist = users.find(
    (item) => item.kindom === kindom && item.password === password
  );
  console.log(users, db.data.locations);
  console.log(kindom, password);
  return userExist ? true : false;
}