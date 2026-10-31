/* live clock — uses the device's locale, 12/24-hour setting and time zone */
(function(){
var tf,df,wf,tz="";
try{
 tf=new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit",second:"2-digit"});
 wf=new Intl.DateTimeFormat(undefined,{weekday:"long"});
 df=new Intl.DateTimeFormat(undefined,{year:"numeric",month:"long",day:"numeric"});
 tz=tf.resolvedOptions().timeZone||""
}catch(e){}
var bx=document.getElementById("clockBox"),t=document.getElementById("clkTime"),dy=document.getElementById("clkDay"),dt=document.getElementById("clkDate");
function esc(x){return String(x).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
function tick(){
 var n=new Date(),h="";
 if(tf){tf.formatToParts(n).forEach(function(p){h+=p.type==="dayPeriod"?"<small>"+esc(p.value)+"</small>":esc(p.value)});dy.textContent=wf.format(n);dt.textContent=df.format(n)}
 else{h=n.toLocaleTimeString();dy.textContent=n.toLocaleDateString(undefined,{weekday:"long"});dt.textContent=n.toLocaleDateString()}
 if(t.innerHTML!==h)t.innerHTML=h;
 bx.title=(tz?tz+" · ":"")+"synced with this device";
 setTimeout(tick,1000-(Date.now()%1000)+5)
}
tick()
})();
