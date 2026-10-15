import "server-only";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";

export function passwordErrors(password) {
  return typeof password === "string" && password.length >= 15 && password.length <= 128 ? {} : { password: "Use a password between 15 and 128 characters." };
}
let active = 0; const waiting = [];
async function bounded(task) {
  if (active < 2) active++;
  else { if (waiting.length >= 16) throw new Error("Password service busy"); await new Promise(resolve => waiting.push(resolve)); }
  try { return await task(); }
  finally { const next = waiting.shift(); if (next) next(); else active--; }
}
export const hashPassword = password => bounded(() => argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }));
export const verifyPassword = (hash, password) => bounded(() => argon2.verify(hash, password));
let dummy;
export function dummyHash() { return dummy ??= hashPassword(randomBytes(32).toString("base64url")).catch(error => { dummy = null; throw error; }); }
