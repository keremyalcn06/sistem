kimport { mkdir, cp } from "fs/promises";

await mkdir("android-webroot", { recursive: true });

await cp(
  ".output/public",
  "android-webroot",
  {
    recursive: true
  }
);

console.log("Android web assets prepared");
