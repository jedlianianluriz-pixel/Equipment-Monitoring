/* V4 — collapsible sidebar, Setup panel, color themes */
(function(){
var PALS=["aurora","ocean","emerald","sunset","violet","rose","gold","graphite"],DELAY=5000;
function pget(k){var v=null;try{v=localStorage.getItem(k)}catch(e){try{v=(JSON.parse(window.name||"{}"))[k]}catch(_){}}return v}
function pset(k,v){try{localStorage.setItem(k,v)}catch(e){}try{var n={};try{n=JSON.parse(window.name||"{}")}catch(e){}n[k]=v;window.name=JSON.stringify(n)}catch(e){}}

/* ---------- color theme ---------- */
function applyPalette(p){
 if(PALS.indexOf(p)<0)p="aurora";
 var h=document.documentElement;
 if(p==="aurora")h.removeAttribute("data-palette");else h.setAttribute("data-palette",p);
 document.querySelectorAll(".sp-pal").forEach(function(b){b.setAttribute("aria-checked",b.dataset.pal===p?"true":"false")});
 pset("jt_palette",p)
}
document.querySelectorAll(".sp-pal").forEach(function(b){b.addEventListener("click",function(){applyPalette(b.dataset.pal)})});
applyPalette(pget("jt_palette")||"aurora");

/* ---------- light / dark inside the panel (reuses the existing applyTheme) ---------- */
function syncMode(){var t=document.documentElement.getAttribute("data-theme")==="light"?"light":"dark";
 document.querySelectorAll(".ssw button").forEach(function(b){var on=b.dataset.theme===t;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)})}
document.querySelectorAll(".ssw button").forEach(function(b){b.addEventListener("click",function(){applyTheme(b.dataset.theme);syncMode()})});
syncMode();

/* ---------- sidebar: minimize / maximize ---------- */
var app=document.querySelector(".app"),sb=document.getElementById("sidebar"),tg=document.getElementById("sbToggle"),
    navBtns=document.querySelectorAll(".nav button"),
    min=false,timer=null,hover=false,auto=pget("jt_sb_auto")!=="0";
function desktop(){return window.matchMedia("(min-width:1001px)").matches}
function loggedIn(){var g=document.getElementById("loginGate");return !g||g.style.display==="none"}
function clear(){clearTimeout(timer);timer=null}
function schedule(){
 clear();
 if(!auto||min||hover||!loggedIn()||!desktop())return;
 if(sb.querySelector(":focus-visible"))return;
 timer=setTimeout(function(){setMin(true)},DELAY)
}
function paint(){
 app.classList.toggle("sb-min",min);
 tg.setAttribute("aria-expanded",min?"false":"true");
 tg.title=min?"Expand sidebar":"Minimize sidebar";
 tg.querySelector(".sbtxt").textContent=min?"Expand":"Minimize";
 navBtns.forEach(function(b){var t=b.querySelector(".navtxt");if(!t)return;if(min)b.title=t.textContent.trim();else b.removeAttribute("title")})
}
function setMin(v){min=!!v;paint();if(min)clear();else schedule()}
sb.addEventListener("click",function(e){
 if(!desktop())return;
 if(e.target.closest(".nav button"))return;   /* navigation clicks keep their normal behaviour */
 setMin(!min)
});
sb.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse"){hover=true;clear()}});
sb.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){hover=false;schedule()}});
sb.addEventListener("focusin",clear);
sb.addEventListener("focusout",function(){setTimeout(schedule,0)});
window.addEventListener("resize",function(){desktop()?schedule():clear()});
window.sbOnLogin=function(){hover=false;setMin(false)};         /* starts expanded, minimizes itself after 5 s */
window.sbOnLogout=function(){clear();hover=false;min=false;paint()};

/* ---------- Setup panel ---------- */
var btn=document.getElementById("setupBtn"),pan=document.getElementById("setupPanel"),sw=document.getElementById("spAuto");
sw.checked=auto;
sw.addEventListener("change",function(){auto=sw.checked;pset("jt_sb_auto",auto?"1":"0");auto?schedule():clear()});
function place(){var r=btn.getBoundingClientRect();pan.style.top=Math.round(r.bottom+10)+"px";pan.style.right=Math.max(12,Math.round(window.innerWidth-r.right))+"px"}
function openP(){place();syncMode();pan.classList.add("open");btn.setAttribute("aria-expanded","true")}
function closeP(){pan.classList.remove("open");btn.setAttribute("aria-expanded","false")}
window.spClose=closeP;
btn.addEventListener("click",function(){pan.classList.contains("open")?closeP():openP()});
document.getElementById("spClose").addEventListener("click",function(){closeP();btn.focus()});
document.addEventListener("mousedown",function(e){if(pan.classList.contains("open")&&!pan.contains(e.target)&&!btn.contains(e.target))closeP()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&pan.classList.contains("open")){closeP();btn.focus()}});
window.addEventListener("resize",function(){if(pan.classList.contains("open"))place()});
document.getElementById("spReset").addEventListener("click",function(){applyPalette("aurora");sw.checked=true;auto=true;pset("jt_sb_auto","1");schedule()});

/* page was restored with an active session (enter() already ran before this script) */
if(loggedIn())window.sbOnLogin()
})();
