import assert from "node:assert/strict";
import test from "node:test";
import { lookFor, portraitSignature } from "../../src/portraits.ts";

const COLLECTION = Array.from({ length: 20 }, (_, i) => String(1001 + i));
const FACE = ["ears", "eyes", "mark", "cheeks", "pose", "paws", "bgShape", "mouth"];

test("collection portraits differ in fur, prop, and face", () => {
  const looks = COLLECTION.map((id) => lookFor(id));
  assert.equal(new Set(looks.map((l) => l.fur)).size, 20);
  assert.equal(new Set(looks.map((l) => l.accessory)).size, 20);
  assert.equal(new Set(COLLECTION.map(portraitSignature)).size, 20);
  for (let i = 0; i < COLLECTION.length - 1; i++) {
    const a = looks[i];
    const b = looks[i + 1];
    const diff = FACE.filter((k) => a[k] !== b[k]);
    assert.ok(diff.length >= 3, `#${COLLECTION[i]} and #${COLLECTION[i + 1]} only differ by ${diff.join(", ") || "nothing"}`);
  }
});

test("portrait choice is stable and ids outside the collection do not collapse", () => {
  assert.equal(portraitSignature("8001"), portraitSignature("8001"));
  assert.notEqual(portraitSignature("8001"), portraitSignature("8002"));
  assert.notEqual(portraitSignature("1001"), portraitSignature("8001"));
  assert.notEqual(lookFor("1001").accessory, lookFor("01001").accessory);
  const outside = [];
  for (let n = 1; n <= 80; n++) outside.push(String(2000 + n));
  outside.push("8889", "8890", "999999999999999999999", "abc", "");
  assert.equal(new Set(outside.map(portraitSignature)).size, outside.length);
  const furs = new Set(outside.map((id) => lookFor(id).fur));
  const ears = new Set(outside.map((id) => lookFor(id).ears));
  const props = new Set(outside.map((id) => lookFor(id).accessory));
  assert.ok(furs.size >= 8, `only ${furs.size} furs`);
  assert.ok(ears.size >= 6, `only ${ears.size} ear shapes`);
  assert.ok(props.size >= 6, `only ${props.size} props`);
});
