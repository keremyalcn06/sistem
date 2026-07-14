import { mkdir, cp, writeFile } from "fs/promises";

const target = "android/app/src/main/assets/public";

await mkdir(target, { recursive: true });

await cp(
  ".output/public",
  target,
  { recursive: true }
);

await writeFile(
  `${target}/index.html`,
  `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SYSTEM</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/assets/index-DXQAunR-.js"></script>
</body>
</html>`
);

console.log("Android assets prepared");
