import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { argv } from "node:process";

const BASE_DIR = resolve("./scripts/icons");
const ASSETS_DIR = join(BASE_DIR, "assets");

const pathSpawnCss = resolve(
  argv
    .find((arg) => arg.startsWith("--spawn-to="))
    .split("=")
    .at(1),
);

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function encodeSvg(rawSvg) {
  let encoded = rawSvg.replace(/\s+/g, " ");
  encoded = replaceAll(encoded, "%", "%25");
  encoded = replaceAll(encoded, "> <", "><"); // normalise spaces elements
  encoded = replaceAll(encoded, "; }", ";}"); // normalise spaces css
  encoded = replaceAll(encoded, "<", "%3c");
  encoded = replaceAll(encoded, ">", "%3e");
  encoded = replaceAll(encoded, '"', "'");
  encoded = replaceAll(encoded, "#", "%23"); // needed for ie and firefox
  encoded = replaceAll(encoded, "{", "%7b");
  encoded = replaceAll(encoded, "}", "%7d");
  encoded = replaceAll(encoded, "|", "%7c");
  encoded = replaceAll(encoded, "^", "%5e");
  encoded = replaceAll(encoded, "`", "%60");
  encoded = replaceAll(encoded, "@", "%40");
  const uri = 'url("data:image/svg+xml;charset=UTF-8,' + encoded + '")';
  return uri;
}

const fileNames = await readdir(ASSETS_DIR);

let cssContent = `
[class^="icon-"], [class*=" icon-"] {
  background-repeat: no-repeat no-repeat;
  background-position: center center;
  background-size: cover;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
  width: var(--backward-compatibility-icon-size, 16px);
  height: var(--backward-compatibility-icon-size, 16px);
  mask-position: center;
  background-color: currentColor;
}\n\n`;

for (const fileName of fileNames) {
  const iconContent = encodeSvg(await readFile(join(ASSETS_DIR, fileName), "utf-8"));
  cssContent += `.icon-${fileName.replace(".svg", "")} { mask-image: ${iconContent}; } `;
}
writeFile(pathSpawnCss, cssContent);
