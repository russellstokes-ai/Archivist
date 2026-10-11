import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),port=Number(process.env.PORT)||4178;
const type={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css'};
createServer(async(req,res)=>{
 const url=new URL(req.url||'/', 'http://localhost');
 const urlPath=url.pathname==='/'?'/tools/motion-lab/gallery.html':url.pathname;
 const file=resolve(root,'.'+decodeURIComponent(urlPath));
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const contents=await readFile(file);res.writeHead(200,{'Content-Type':type[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(contents);}
 catch{res.writeHead(404).end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log('Archivist Motion Lab http://127.0.0.1:'+port));
