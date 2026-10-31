/* network status — based on what the device/browser reports */
(function(){
var btn=document.getElementById("netBtn"),pan=document.getElementById("netPanel"),txt=document.getElementById("netTxt");
var flaps=[],last=null,firstRun=true,changedAt=Date.now();
function conn(){return navigator.connection||navigator.mozConnection||navigator.webkitConnection||null}
function measure(){
 var c=conn(),online=navigator.onLine!==false,now=Date.now();
 flaps=flaps.filter(function(t){return now-t<30000});
 var r={online:online,type:c&&c.type?c.type:"",eff:c&&c.effectiveType?c.effectiveType:"",dl:c&&c.downlink>0?c.downlink:0,rtt:c&&c.rtt>0?c.rtt:0,save:!!(c&&c.saveData),api:!!c};
 if(!online){r.state="offline";r.lv=0;return r}
 var lv=4;
 if(r.eff==="slow-2g"||r.eff==="2g")lv=1;
 else if(r.eff==="3g")lv=2;
 else{
  if(r.rtt>300||(r.dl&&r.dl<2))lv=3;
  if(r.rtt>600||(r.dl&&r.dl<0.8))lv=2
 }
 if(flaps.length>=2)lv=Math.min(lv,2);
 r.lv=lv;r.state=lv>=3?"stable":"unstable";return r
}
function kind(r){return r.type==="cellular"?"cell":(r.type==="ethernet"?"eth":"wifi")}
var NAMES={wifi:"Wi-Fi",cellular:"Cellular",ethernet:"Ethernet",bluetooth:"Bluetooth",wimax:"WiMAX",other:"Other",none:"None",unknown:""};
var LABEL={stable:"Stable connection",unstable:"Unstable connection",offline:"No internet"};
var SUB={stable:"Online — all good",unstable:"Online — slow or unreliable",offline:"Working offline — data stays on this device"};
function set(id,v){document.getElementById(id).textContent=v}
function paint(){
 var r=measure();
 btn.dataset.state=pan.dataset.state=r.state;
 btn.dataset.lv=pan.dataset.lv=String(r.lv);
 btn.dataset.kind=kind(r);
 txt.textContent=LABEL[r.state];
 btn.title=LABEL[r.state]+" — click for details";
 set("npTitle",LABEL[r.state]);set("npSub",SUB[r.state]);
 var tn=NAMES[r.type];
 set("npType",r.online?(tn||(r.api?"Not reported":"Not reported")):"—");
 set("npEff",r.online&&r.eff?r.eff.toUpperCase().replace("SLOW-2G","Slow 2G"):"—");
 set("npDl",r.online&&r.dl?r.dl+" Mbps":"—");
 set("npRtt",r.online&&r.rtt?r.rtt+" ms":"—");
 set("npSave",r.api?(r.save?"On":"Off"):"—");
 set("npAt","Updated "+new Date().toLocaleTimeString());
 if(last!==r.state){
  if(!firstRun&&window.toast){try{toast(r.state==="offline"?"No internet — you can keep working, data is saved on this device":r.state==="unstable"?"Connection is unstable":"Connection is stable again")}catch(e){}}
  last=r.state;changedAt=Date.now()
 }
 firstRun=false
}
function mark(){flaps.push(Date.now());paint()}
window.addEventListener("online",mark);window.addEventListener("offline",mark);
var c=conn();if(c&&c.addEventListener)c.addEventListener("change",paint);
setInterval(paint,5000);
paint();
/* panel */
function place(){var r=btn.getBoundingClientRect();pan.style.top=Math.round(r.bottom+10)+"px";pan.style.right=Math.max(12,Math.round(window.innerWidth-r.right))+"px"}
function openP(){if(window.spClose)spClose();paint();place();pan.classList.add("open");btn.setAttribute("aria-expanded","true")}
function closeP(){pan.classList.remove("open");btn.setAttribute("aria-expanded","false")}
btn.addEventListener("click",function(){pan.classList.contains("open")?closeP():openP()});
document.getElementById("npRe").addEventListener("click",paint);
document.addEventListener("mousedown",function(e){if(pan.classList.contains("open")&&!pan.contains(e.target)&&!btn.contains(e.target))closeP()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&pan.classList.contains("open")){closeP();btn.focus()}});
window.addEventListener("resize",function(){if(pan.classList.contains("open"))place()});
var prevClose=window.spClose;
})();
