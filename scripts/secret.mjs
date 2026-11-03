import { randomBytes } from "node:crypto";

// Prints a random value for ADMIN_SESSION_SECRET.
console.log(randomBytes(32).toString("hex"));
