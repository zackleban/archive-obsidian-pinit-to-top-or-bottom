import test from "node:test";
import assert from "node:assert/strict";
import { load, TFile, TFolder } from "./helpers.mjs";
const {default:Pinit}=await load(process.env.PINIT_SOURCE ?? "src/main.ts");
function fixture(saved=null){
  const app={workspace:{getLeavesOfType:()=>[]},vault:{getAbstractFileByPath:p=>p,configDir:"custom-config",adapter:{read:async()=>{throw Error("missing");}}}};
  const plugin=new Pinit(app);plugin.saved=saved;return {plugin,app};
}
test("normalizes duplicate, invalid and conflicting persisted pins",async()=>{
  const {plugin}=fixture({top:["a.md","a.md",null,42,"/",""],bottom:["a.md","z.md","z.md"]});
  await plugin.loadSettings();assert.deepEqual(plugin.settings,{top:["a.md"],bottom:["z.md"]});
  const items=["z.md","x.md","a.md"].map(p=>({file:new TFile(p)}));
  assert.deepEqual(plugin.arrange(items).map(i=>i.file.path),["a.md","x.md","z.md"]);
});
test("pin switches side, unpin restores and moves only among siblings",async()=>{
  const {plugin}=fixture();plugin.settings={top:["A/one.md","B/other.md","A/two.md"],bottom:[]};
  await plugin.move("A/two.md",-1);assert.deepEqual(plugin.settings.top,["A/two.md","B/other.md","A/one.md"]);
  assert.equal(plugin.canMove("A/two.md",-1),false);
  await plugin.pin("A/two.md","bottom");assert.equal(plugin.sideOf("A/two.md"),"bottom");
  await plugin.unpin("A/two.md");assert.equal(plugin.sideOf("A/two.md"),null);
});
test("folder rename and deletion use path boundaries",()=>{
  const {plugin}=fixture();plugin.settings={top:["A","A/note.md","AB/note.md"],bottom:["A/deep/note.md"]};
  plugin.onRename("Moved","A");assert.deepEqual(plugin.settings.top,["Moved","Moved/note.md","AB/note.md"]);
  plugin.onDelete("Moved");assert.deepEqual(plugin.settings,{top:["AB/note.md"],bottom:[]});
});
test("first-run migration deduplicates and uses custom config directory",async()=>{
  const {plugin,app}=fixture();const paths=[];
  app.vault.adapter.read=async path=>{paths.push(path);return JSON.stringify(path.includes("/pinit/")?{pins:{one:["a.md","a.md"],two:["b.md"]}}:{pinnedPaths:["a.md","z.md"]});};
  await plugin.loadSettings();assert.deepEqual(plugin.settings,{top:["a.md","b.md"],bottom:["z.md"]});
  assert.ok(paths.every(p=>p.startsWith("custom-config/plugins/")));
  assert.deepEqual(plugin.saved,plugin.settings);
});
test("an unloaded plugin cannot patch a late layout callback",()=>{
  const {plugin,app}=fixture();plugin.onunload();
  app.workspace.getLeavesOfType=()=>{throw Error("should not inspect workspace");};
  plugin.patchFileExplorer();
});

test("sorting integrations receive pins only while the explorer wrapper is active",()=>{
  const {plugin,app}=fixture();
  plugin.settings={top:["a.md"],bottom:["z.md"]};
  class Explorer {
    getSortedFolderItems(){return [];}
    requestSort(){}
  }
  app.workspace.getLeavesOfType=()=>[{view:new Explorer()}];
  assert.equal(plugin.getActivePins(),null);
  plugin.patchFileExplorer();
  assert.deepEqual(plugin.getActivePins(),{top:["a.md"],bottom:["z.md"]});
  plugin.onunload();
  assert.equal(plugin.getActivePins(),null);
  assert.deepEqual(plugin.settings,{top:["a.md"],bottom:["z.md"]});
});

// These tests load the real source with a storage/explorer double, not Obsidian.
function assertItems(actual, expected, supplied = expected) {
  assert.equal(actual.length, supplied.length, "sorting must preserve item count");
  for (const item of supplied) {
    assert.equal(actual.filter(candidate => candidate === item).length, 1, "each supplied identity appears once");
  }
  expected.forEach((item, index) => assert.equal(actual[index], item, `identity at index ${index}`));
}

const renameCases = [
  {
    name: "top duplicate with stale destination after source",
    before: { top: ["Old.md", "Renamed.md"], bottom: [] },
    after: { top: ["Renamed.md"], bottom: [] },
    oldPath: "Old.md", path: "Renamed.md",
  },
  ...["top", "bottom"].flatMap(side => [false, true].map(destinationFirst => ({
    name: `${side} duplicate preserves ${destinationFirst ? "destination" : "source"} first occurrence`,
    before: { top: [], bottom: [], [side]: [
      destinationFirst ? "Renamed.md" : "Old.md", "Keep.md",
      destinationFirst ? "Old.md" : "Renamed.md", "Missing.md",
    ] },
    after: { top: [], bottom: [], [side]: ["Renamed.md", "Keep.md", "Missing.md"] },
    oldPath: "Old.md", path: "Renamed.md",
  }))),
  ...["top", "bottom"].map(side => ({
    name: `${side} source colliding across sides keeps top`,
    before: {
      top: ["Top.md", side === "top" ? "Old.md" : "Renamed.md", "Missing-top.md"],
      bottom: ["Bottom.md", side === "bottom" ? "Old.md" : "Renamed.md", "Missing-bottom.md"],
    },
    after: { top: ["Top.md", "Renamed.md", "Missing-top.md"], bottom: ["Bottom.md", "Missing-bottom.md"] },
    oldPath: "Old.md", path: "Renamed.md",
  })),
  {
    name: "folder and descendants collide without touching boundary siblings",
    before: {
      top: ["Old", "Keep.md", "Moved", "Moved/note.md", "Old/note.md", "Old/bottom.md", "Oldish/note.md", "Missing.md"],
      bottom: ["Moved/bottom.md", "Old/deep/note.md", "Bottom.md", "Moved/deep/note.md", "Oldish", "Missing-bottom.md"],
    },
    after: {
      top: ["Moved", "Keep.md", "Moved/note.md", "Moved/bottom.md", "Oldish/note.md", "Missing.md"],
      bottom: ["Moved/deep/note.md", "Bottom.md", "Oldish", "Missing-bottom.md"],
    },
    oldPath: "Old", path: "Moved",
  },
  {
    name: "ordinary note move preserves unrelated order and missing pins",
    before: { top: ["Keep.md", "Old.md", "Old.md.backup"], bottom: ["Missing.md"] },
    after: { top: ["Keep.md", "Folder/Renamed.md", "Old.md.backup"], bottom: ["Missing.md"] },
    oldPath: "Old.md", path: "Folder/Renamed.md",
  },
];

for (const scenario of renameCases) {
  test(`rename invariants: ${scenario.name}`, async () => {
    const { plugin, app } = fixture(structuredClone(scenario.before));
    await plugin.loadSettings();
    // Missing pins stay in settings but are absent from the supplied explorer rows.
    const livePaths = [...new Set([...scenario.after.top, ...scenario.after.bottom])]
      .filter(path => !path.startsWith("Missing"));
    const peerPaths = scenario.name === "top duplicate with stale destination after source" ? ["Peer.md"] : ["Peer-z.md", "Peer-a.md"];
    const items = [...peerPaths, ...livePaths.toReversed()].map(path => ({ file: path.includes(".") ? new TFile(path) : new TFolder(path) }));
    app.vault.getAbstractFileByPath = path => items.find(item => item.file.path === path)?.file ?? null;
    const pick = paths => paths.flatMap(path => items.filter(item => item.file.path === path));
    const expected = [...pick(scenario.after.top), ...pick(peerPaths), ...pick(scenario.after.bottom)];
    plugin.onRename(scenario.path, scenario.oldPath);
    // Check the immediate sort as well as the persisted/reloaded state.
    assertItems(plugin.arrange(items), expected, items);
    assert.deepEqual(plugin.settings, scenario.after);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(plugin.saved, scenario.after);
    const { plugin: reloaded } = fixture(structuredClone(plugin.saved));
    await reloaded.loadSettings();
    assert.deepEqual(reloaded.settings, scenario.after);
    assertItems(reloaded.arrange(items), expected, items);
  });
}

test("sorting consumes duplicate/conflicting stored pins once without mutating settings or inputs", () => {
  const { plugin } = fixture();
  plugin.settings = { top: ["a.md", "a.md", "Missing.md"], bottom: ["a.md", "z.md", "z.md"] };
  const before = structuredClone(plugin.settings);
  const items = ["z.md", "peer-2.md", "a.md", "peer-1.md"].map(path => ({ file: new TFile(path) }));
  const input = [...items];
  const expected = [items[2], items[1], items[3], items[0]];
  assertItems(plugin.arrange(items), expected, items);
  assertItems(plugin.arrange(items), expected, items);
  assert.deepEqual(plugin.settings, before);
  assert.deepEqual(items, input);
});
