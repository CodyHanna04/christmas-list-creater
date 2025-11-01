// lib/cookies.js
import Cookies from "js-cookie";

const KEY = "visitor_name";
export function getVisitorName() {
  return Cookies.get(KEY) || null;
}
export function setVisitorName(name) {
  Cookies.set(KEY, name, { expires: 365, sameSite: "Lax", path: "/" });
}
export function clearVisitorName() {
  Cookies.remove(KEY, { path: "/" });
}
