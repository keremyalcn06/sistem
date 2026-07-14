import { cp, mkdir } from "fs/promises";

await mkdir("android/app/src/main/assets/public", {
  recursive: true
});

await cp(
  ".output/public",
  "android/app/src/main/assets/public",
  {
    recursive:true
  }
);

console.log("Android assets copied");
