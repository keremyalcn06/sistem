import fs from "fs";
import path from "path";

const source = ".output/public";
const index = path.join(source, "index.html");

if (!fs.existsSync(source)) {
  fs.mkdirSync(source, { recursive: true });
}

if (!fs.existsSync(index)) {
  fs.writeFileSync(
    index,
    `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>SYSTEM</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/assets/index-DXQAunR-.js"></script>
</body>
</html>`
  );
}

console.log("Android assets prepared");
