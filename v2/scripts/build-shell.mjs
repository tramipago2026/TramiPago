import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";

const root=fileURLToPath(new URL("../",import.meta.url));
const sandbox={window:{},document:{querySelector(){return null;}}};
runInNewContext(fs.readFileSync(path.join(root,"assets/shell-v2.js"),"utf8"),sandbox);
const model=sandbox.window.TramiPagoShell, check=process.argv.includes("--check");
let pages=0;
function walk(folder){
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
    const file=path.join(folder,item.name);
    if(item.isDirectory()){walk(file);continue;}
    if(item.name!=="index.html")continue;
    const route="/v2/"+path.relative(root,path.dirname(file)).replaceAll(path.sep,"/").replace(/^\.$/,"");
    const canonical=route.endsWith("/")?route:route+"/";
    if(canonical==="/v2/admin/")continue;
    const previous=fs.readFileSync(file,"utf8");
    let html=previous.replace(/(<header\b[^>]*>)[\s\S]*?<\/header>/,(_,open)=>open+model.header(canonical)+"</header>");
    html=html.replace(/(<footer\b[^>]*>)[\s\S]*?<\/footer>/,(_,open)=>open+model.footer()+"</footer>");
    html=html.replace(/<main\b([^>]*)>/,(_,attrs)=>/\bid=/.test(attrs)?"<main"+attrs+">":'<main id="contenido"'+attrs+">");
    if(!html.includes('class="skip-link"'))html=html.replace(/<header\b/,'<a class="skip-link" href="#contenido">Saltar al contenido</a><header');
    if(!html.includes("data-v2-shared-header")||!html.includes("data-v2-shared-footer"))throw Error("Missing shared shell host: "+canonical);
    if(check&&html!==previous)throw Error("Shell differs from its single source: "+canonical+"; run node v2/scripts/build-shell.mjs");
    if(!check&&html!==previous)fs.writeFileSync(file,html);
    pages++;
  }
}
walk(root);
if(pages!==141)throw Error("Unexpected public page inventory: "+pages);
console.log("PASS shared shell: "+pages+" pages generated/checked from one header and footer source");
