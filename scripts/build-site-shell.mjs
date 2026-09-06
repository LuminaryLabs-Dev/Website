import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=['index.html','nexus-arcade/index.html','opensource.html','services.html','portfolio.html','team.html','contact.html','nexus-arcade/play/index.html'];
const links=[['Home','/index.html'],['Nexus Arcade','/nexus-arcade/'],['Open Source','/opensource.html'],['Services','/services.html'],['Portfolio','/portfolio.html'],['Team','/team.html'],['Contact','/contact.html']];
const header=await fs.readFile(path.join(root,'templates/site-header.html'),'utf8');
const footer=await fs.readFile(path.join(root,'templates/site-footer.html'),'utf8');
let drift=false;
for(const file of pages){
  const pathname='/'+file;
  const active=pathname.startsWith('/nexus-arcade/')?'/nexus-arcade/':pathname;
  const nav=header.replace('{{links}}',links.map(([label,href])=>`      <a href="${href}"${href===active?' class="active" aria-current="page"':''}>${label}</a>`).join('\n')).trim();
  const source=await fs.readFile(path.join(root,file),'utf8');
  if(!source.includes('<!-- site:header:start -->')||!source.includes('<!-- site:footer:start -->'))throw Error(`Missing shell markers: ${file}`);
  const next=source.replace(/<!-- site:header:start -->[\s\S]*?<!-- site:header:end -->/,nav).replace(/<!-- site:footer:start -->[\s\S]*?<!-- site:footer:end -->/,footer.trim());
  if(next!==source){drift=true;if(!process.argv.includes('--check'))await fs.writeFile(path.join(root,file),next);else console.error(`Shared shell differs: ${file}`);}
}
if(process.argv.includes('--check')&&drift)process.exitCode=1;
else console.log('Shared shell '+(process.argv.includes('--check')?'verified':'generated')+' for '+pages.length+' pages.');
