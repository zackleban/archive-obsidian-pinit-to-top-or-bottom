import test from "node:test";
import assert from "node:assert/strict";
import { load, TFile } from "./helpers.mjs";
const {default:Pinit}=await load("src/main.ts");
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
