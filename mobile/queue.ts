export class SavedQueue<T extends {id:number}> {
  items:T[]=[];revision=0;ready=false;busy=false;private active=true;private writes=Promise.resolve();
  constructor(private api:(path:string,method?:string,data?:unknown)=>Promise<any>,private changed:()=>void,private error:(message:string)=>void){}
  dispose(){this.active=false;}
  async reload(){
    try{const data=await this.api('/api/queue');if(!this.active)return;this.items=data.items;this.revision=data.revision;this.ready=true;this.changed();}
    catch(e){if(this.active)this.error((e as Error).message);}
  }
  edit(change:(items:T[])=>T[]):Promise<void>{
    this.writes=this.writes.then(async()=>{
      if(!this.active)return;
      if(!this.ready){this.error('Queue is not loaded. Retry the connection.');return;}
      this.busy=true;this.changed();
      try{
        const next=change([...this.items]);
        const data=await this.api('/api/queue','PUT',{ids:next.map(b=>b.id),revision:this.revision});
        if(!this.active)return;this.items=next;this.revision=data.revision;
      }catch(e){if(this.active){this.error((e as Error).message);await this.reload();}}
      finally{if(this.active){this.busy=false;this.changed();}}
    });return this.writes;
  }
}
export function reorder<T>(items:T[],index:number,offset:number):T[]{
  const target=index+offset;if(index<0||index>=items.length||target<0||target>=items.length)return items;
  const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next;
}
