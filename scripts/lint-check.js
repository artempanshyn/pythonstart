import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REQUIRED_FILES = [
  "index.html",
  "package.json",
  "package-lock.json",
  "README.md",
  "data/topics.js",
  "js/messages.uk.js",
  "js/validation.js",
  "js/topics.js",
  "js/storage.js",
  "docs/architecture.md",
  "docs/code-review-and-qa.md",
];
const JS_DIRECTORIES = ["data", "js", "tests"];
const CONFLICT_MARKER = /^(?:(?:<{7}|>{7}|\|{7})(?:\s|$)|={7}\s*$)/m;
const EVAL_CALL = /\beval\s*\(/;
const errors = [];

function* javascriptFiles(directory) {
  for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) yield* javascriptFiles(path);
    else if (entry.isFile() && path.endsWith(".js")) yield path;
  }
}

for (const path of REQUIRED_FILES) {
  try {
    if (!readFileSync(join(ROOT, path), "utf8").trim()) {
      errors.push(`[ВМІСТ] Порожній файл: ${path}`);
    }
  } catch (error) {
    const reason = error.code === "ENOENT" ? "Відсутній обов’язковий файл" : "Файл не читається";
    errors.push(`[СТРУКТУРА] ${reason}: ${path}`);
  }
}

for (const directory of JS_DIRECTORIES) {
  try {
    for (const path of javascriptFiles(directory)) {
      const source = readFileSync(join(ROOT, path), "utf8");
      if (CONFLICT_MARKER.test(source)) errors.push(`[GIT] Нерозв’язаний конфлікт: ${path}`);
      if (EVAL_CALL.test(source)) errors.push(`[БЕЗПЕКА] Заборонений шаблон eval(): ${path}`);

      const syntax = spawnSync(process.execPath, ["--check", path], { cwd: ROOT, encoding: "utf8" });
      if (syntax.status !== 0) {
        errors.push(`[СИНТАКСИС] ${path}\n${syntax.error?.message ?? syntax.stderr.trim()}`);
      }
    }
  } catch (error) {
    errors.push(`[СТРУКТУРА] Не вдалося перевірити ${directory}: ${error.code ?? error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error("PythonStart Linter: FAIL");
  process.exitCode = 1;
} else {
  console.log("PythonStart Linter: PASS");
}
