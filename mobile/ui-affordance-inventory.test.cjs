'use strict';
// Read-only inventory for the owner-requested UI review. No UI is restyled here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {test}=require('node:test');
const {effectiveSource}=require('./threeFixes/source.cjs');
function sourceFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
 if(['node_modules','android','ios','.expo','.git','assets'].includes(entry.name)||entry.name.startsWith('.'))return [];
 const file=path.join(dir,entry.name);
 return entry.isDirectory()?sourceFiles(file):entry.name.endsWith('.tsx')?[file]:[];
});}
function small(value,n=160){return String(value||'').replace(/\s+/g,' ').trim().slice(0,n);}
test('inventory current mobile interactive JSX and relevant styling for human review without modifying it',()=>{
 const records=[],styleMap={},definitions=[];let parsed=0;
 for(const file of sourceFiles(__dirname)){
  const code=effectiveSource(file,fs.readFileSync(file,'utf8')),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(sf.parseDiagnostics.length,0,'parse '+path.relative(__dirname,file));parsed++;
  function walk(node,scope=path.basename(file)){
   if(ts.isFunctionDeclaration(node)&&node.name)scope=node.name.text;
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&(ts.isArrowFunction(node.initializer)||ts.isFunctionExpression(node.initializer)))scope=node.name.text;
   if(ts.isFunctionDeclaration(node)&&node.name&&['Button','PageToolbar','PageHeader'].includes(node.name.text))definitions.push({component:node.name.text,source:small(node.getText(sf),1800)});
   if(ts.isCallExpression(node)&&node.expression.getText(sf)==='StyleSheet.create'&&node.arguments[0]&&ts.isObjectLiteralExpression(node.arguments[0])){
    for(const prop of node.arguments[0].properties)if(ts.isPropertyAssignment(prop))styleMap[prop.name.getText(sf).replace(/['"]/g,'')]=small(prop.initializer.getText(sf),420);
   }
   if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
    const tag=node.tagName.getText(sf),attrs={};
    for(const item of node.attributes.properties)if(ts.isJsxAttribute(item))attrs[item.name.getText(sf)]=item.initializer?small(item.initializer.getText(sf),260):'true';
    if(tag==='Button'||attrs.onPress||attrs.onClick||attrs.onLongPress){
     const parent=ts.isJsxOpeningElement(node)?node.parent:node;
     const visible=[];
     function text(child){if(ts.isJsxText(child)&&small(child.text))visible.push(small(child.text));else if(ts.isJsxExpression(child)&&child.expression)visible.push(small(child.expression.getText(sf),80));else if(ts.isJsxElement(child))child.children.forEach(text);}
     if(ts.isJsxElement(parent))parent.children.forEach(text);
     const label=small(attrs.label||attrs.accessibilityLabel||visible.join(' | ')||tag,150),style=attrs.style||'';
     const names=[...style.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map(match=>match[1]);
     const quiet=attrs.tone==='"quiet"',body=parent.getText(sf);
     const bareText=tag==='Pressable'&&body.includes('<Text')&&!/<(?:UiIcon|Image|LivePlayer|View)/.test(body.replace(/^<Pressable[^>]*>/,''))&&!/Button|Chip|chip|Segment|segment|Row|row|Card|card|Tile|tile|Switch|switch|nav|tab|Tab/.test(style);
     records.push({file:path.relative(__dirname,file),screen:scope,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,tag,label,tone:attrs.tone||'',style:small(style,150),styles:names,quiet,bareText,longPress:!!attrs.onLongPress,disabled:!!attrs.disabled});
    }
   }
   ts.forEachChild(node,child=>walk(child,scope));
  }
  walk(sf);
 }
 assert.ok(records.some(r=>r.screen==='Shelf'));assert.ok(records.some(r=>r.screen==='Profile'));
 const groups=new Map();for(const row of records){const key=row.file+' / '+row.screen,list=groups.get(key)||[];list.push(row);groups.set(key,list);}
 console.log('UI_AUDIT_SCOPE',JSON.stringify({parsedTsxFiles:parsed,interactiveSourceSites:records.length,screenAndComponentGroups:groups.size,note:'Source sites, not runtime rendered counts or device usability acceptance. Lines refer to effective source.'}));
 for(const [screen,rows]of groups)console.log('UI_AUDIT_SCREEN',JSON.stringify({screen,controls:rows.length,quiet:rows.filter(x=>x.quiet).length,textOnlyCandidates:rows.filter(x=>x.bareText).length,longPress:rows.filter(x=>x.longPress).length,labels:rows.map(x=>x.label).join(' / ').slice(0,1800)}));
 for(const row of records.filter(r=>r.quiet||r.bareText))console.log('UI_AUDIT_CANDIDATE',JSON.stringify(row));
 for(const item of definitions)console.log('UI_AUDIT_SHARED',JSON.stringify(item));
 const relevant=new Set(records.flatMap(r=>r.styles));
 for(const name of relevant)if(styleMap[name]&&/button|Button|headerAction|segment|Segment|chip|Chip|swatch|Swatch|link|Link|action|Action/.test(name))console.log('UI_AUDIT_STYLE',name,styleMap[name]);
 console.log('UI_AUDIT_READ_ONLY: no application source, stylesheet, settings, user data, or release artifact written.');
});
