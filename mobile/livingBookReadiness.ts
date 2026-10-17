/**
 * A read-only first-frame probe for the existing canonical Living Book Canvas.
 * Does not modify rendererHtml(), page geometry, timing, artwork or behaviour.
 * Waits for the actual 2D canvas to paint before reporting WebView ready.
 * Tokens reject stale responses after a bounded native renderer restart.
 */
export type LivingBookProbeResult={generation:number;status:'ready'|'blank'|'error'|'tainted'};

export function parseLivingBookProbe(raw:string):LivingBookProbeResult|null{
  const match=/^archivist-living-v2:(\d+):(ready|blank|error|tainted)$/.exec(String(raw));
  if(!match)return null;
  const generation=Number(match[1]);
  if(!Number.isSafeInteger(generation)||generation<0)return null;
  return {generation,status:match[2] as LivingBookProbeResult['status']};
}

export function livingBookProbeScript(generation:number):string{
  if(!Number.isSafeInteger(generation)||generation<0)throw Error('Invalid Living Book generation');
  return `(function(){
    'use strict';
    var generation=${generation},attempt=0,finished=false;
    function report(status){
      if(finished)return;
      finished=true;
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
        'archivist-living-v2:'+generation+':'+status);
    }
    function check(){
      if(finished)return;
      var book=window.ArchivistLivingBook,canvas=document.getElementById('book');
      if(book&&typeof book.setState==='function'&&canvas
         &&canvas.width===1000&&canvas.height===840){
        try{
          var ctx=canvas.getContext('2d',{alpha:true});
          if(ctx){
            // 500x400 is the canonical book's central drawable region.
            // Sample widely but cheaply; a blank transparent Canvas is NOT ready.
            var pixels=ctx.getImageData(250,200,500,400).data;
            for(var i=3;i<pixels.length;i+=844){
              if(pixels[i]>10){report('ready');return;}
            }
          }
        }catch(e){
          // Covers can originate off-site: readback may be tainted after the
          // original cover loads. This is distinct from an empty native view.
          report('tainted');return;
        }
      }
      if(++attempt>=125){report('blank');return;}
      requestAnimationFrame(check);
    }
    requestAnimationFrame(function(){requestAnimationFrame(check);});
  })(); true;`;
}
