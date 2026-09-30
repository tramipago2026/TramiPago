import fs from "node:fs";
import path from "node:path";

const SKIP_DIRS=new Set([".git","node_modules",".next","dist","build","coverage"]);
const SKIP_EXTS=new Set([".png",".jpg",".jpeg",".webp",".gif",".ico",".pdf",".zip",".gz",".woff",".woff2",".ttf",".mp4",".mp3"]);
const SELF=path.normalize("tests/secret-scan.mjs");

const patterns=[
  {name:"Supabase secret key", re:new RegExp("sb_"+"secret_[A-Za-z0-9_-]{20,}","g")},
  {name:"GitHub classic token", re:new RegExp("gh"+"p_[A-Za-z0-9]{20,}","g")},
  {name:"GitHub fine-grained token", re:new RegExp("github_"+"pat_[A-Za-z0-9_]{20,}","g")},
  {name:"Private key", re:new RegExp("-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----","g")},
  {name:"Service role assignment", re:new RegExp("SUPABASE_SERVICE_ROLE_KEY\\s*=\\s*[^\\s$][^\\r\\n]{15,}","g")}
];

const findings=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP_DIRS.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){walk(full);continue;}
    const rel=path.normalize(path.relative(".",full));
    if(rel===SELF)continue;
    if(SKIP_EXTS.has(path.extname(entry.name).toLowerCase()))continue;
    let text;
    try{text=fs.readFileSync(full,"utf8");}catch{continue;}
    for(const {name,re} of patterns){
      re.lastIndex=0;
      if(re.test(text))findings.push({file:rel,type:name});
    }
  }
}
walk(".");
if(findings.length){
  for(const finding of findings)console.error(`SECRET_SCAN_FAIL ${finding.type}: ${finding.file}`);
  process.exit(1);
}
console.log("PASS REPOSITORY_SECRET_SCAN");
