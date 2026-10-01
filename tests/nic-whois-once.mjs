import net from "node:net";
import assert from "node:assert/strict";

const domain="tramipago.com.ar";
const raw=await new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:"whois.nic.ar",port:43},()=>socket.write(domain+"\r\n"));
  let data="";
  socket.setEncoding("utf8");
  socket.on("data",chunk=>data+=chunk);
  socket.on("end",()=>resolve(data));
  socket.on("error",reject);
  socket.setTimeout(15000,()=>socket.destroy(new Error("WHOIS timeout")));
});
assert.ok(raw.toLowerCase().includes(domain),"NIC WHOIS no devolvió el dominio consultado");
const safe=String(raw).split(/\r?\n/).filter(line=>
  /^(domain|nserver|created|changed|expires|expire|registered|status|registrar|source)\s*:/i.test(line.trim())
);
console.log("NIC_WHOIS_SAFE");
for(const line of safe)console.log(line);
console.log("PASS NIC_WHOIS: dominio presente en WHOIS oficial de NIC Argentina; datos personales omitidos.");
