import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const results = { children: [], replaceChildren(...nodes) { this.children = nodes; } };
const title = { textContent: "" };
let requests = 0;
runInNewContext(readFileSync(new URL("../assets/v2.js", import.meta.url), "utf8"), {
  document: { querySelector(query) { return query === "#v2-search-results" ? results : query === "#search-term" ? title : null; }, createElement() { return {textContent:""}; } },
  window: { addEventListener() {} }, location: {search:"?q=%20%20"}, URLSearchParams,
  fetch() { requests++; throw new Error("Empty search must work without a network"); },
});
assert.equal(requests, 0);
assert.match(title.textContent, /Ingresá un trámite/);
assert.match(results.children[0].textContent, /Usá el buscador/);
console.log("PASS empty search: useful message without a catalog request");
