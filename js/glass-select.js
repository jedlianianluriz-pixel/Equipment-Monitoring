/* glass dropdown: enhances every <select>, keeps the real select (value, change events, validation).
   Selects with data-manage also get an Edit button to add / delete their options. */
(function(){
var SV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
var CH=SV.replace('<svg','<svg class="gsel-ch"')+'<path d="M6 9l6 6 6-6"/></svg>',
    CK=SV+'<path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    PEN=SV+'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
    TR=SV+'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    PL=SV+'<path d="M12 5v14M5 12h14"/></svg>';
function E(x){return String(x).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var pop=document.createElement("div");pop.className="gsel-pop";pop.setAttribute("role","listbox");document.body.appendChild(pop);
var pairs=[],cur=null,hl=-1,mode="pick",confirmV=-1,baseMin=200;
function label(sel){var o=sel.options[sel.selectedIndex];return o?o.textContent:""}
function sync(p){var sel=p.sel,b=p.btn;
 var t=label(sel);if(b.firstChild.textContent!==t)b.firstChild.textContent=t;
 if(b.disabled!==sel.disabled)b.disabled=sel.disabled}
function fire(sel){sel.dispatchEvent(new Event("input",{bubbles:true}));sel.dispatchEvent(new Event("change",{bubbles:true}))}
function say(m){if(window.toast)try{toast(m)}catch(e){}}
function enhance(sel){
 if(sel.dataset.gsel||sel.multiple||sel.size>1)return;
 sel.dataset.gsel="1";
 var b=document.createElement("button");b.type="button";
 b.className=(sel.className||"")+" gsel-btn";
 b.setAttribute("aria-haspopup","listbox");b.setAttribute("aria-expanded","false");
 b.innerHTML='<span class="gsel-txt"></span>'+CH;
 sel.classList.add("gsel-native");sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");
 sel.parentNode.insertBefore(b,sel.nextSibling);
 var p={sel:sel,btn:b};pairs.push(p);sync(p);
 sel.addEventListener("focus",function(){b.focus()});
 sel.addEventListener("change",function(){sync(p)});
 b.addEventListener("click",function(){cur&&cur.btn===b?close():open(p)});
 b.addEventListener("keydown",function(e){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();open(p)}})
}
function items(){return pop.querySelectorAll(".gsel-opt")}
function setHl(i,scroll){var it=items();if(!it.length)return;hl=(i+it.length)%it.length;
 it.forEach(function(x,k){x.classList.toggle("hl",k===hl)});if(scroll!==false)it[hl].scrollIntoView({block:"nearest"})}

function render(keepHl){
 var sel=cur.sel,mg=sel.dataset.manage,h="",ed=mode==="edit";
 if(ed){
  h+='<div class="gsel-ehead"><b>Edit options</b><button type="button" class="gsel-done">Done</button></div><div class="gsel-list">';
  var n=0;
  Array.prototype.forEach.call(sel.options,function(o,i){
   if(o.value===""||o.value==="__new")return;
   if(confirmV===i)h+='<div class="gsel-erow confirm"><span>Delete “'+E(o.textContent)+'”?</span><button type="button" class="gsel-yes" data-i="'+i+'">Delete</button><button type="button" class="gsel-no">Cancel</button></div>';
   else h+='<div class="gsel-erow"><span>'+E(o.textContent)+'</span><button type="button" class="gsel-del" data-i="'+i+'" aria-label="Delete '+E(o.textContent)+'" title="Delete">'+TR+'</button></div>';
   n++});
  if(!n)h+='<div class="gsel-none">No options yet</div>';
  h+='</div><div class="gsel-foot"><div class="gsel-add"><input type="text" class="gsel-in" placeholder="Add new option…" maxlength="60" autocomplete="off"><button type="button" class="gsel-addbtn">'+PL+'<span>Add</span></button></div></div>';
 }else{
  h+='<div class="gsel-list">';
  Array.prototype.forEach.call(sel.options,function(o,i){
   if(o.value==="__new")return;
   h+='<button type="button" class="gsel-opt" role="option" data-i="'+i+'" aria-selected="'+(i===sel.selectedIndex)+'"'+(o.disabled?' aria-disabled="true"':'')+
      ' style="animation-delay:'+Math.min(i*22,220)+'ms"><span>'+E(o.textContent)+'</span>'+CK+'</button>'});
  h+='</div>';
  if(mg)h+='<div class="gsel-foot"><button type="button" class="gsel-edit">'+PEN+'<span>Edit</span></button></div>'
 }
 pop.innerHTML=h;
 pop.classList.toggle("editing",ed);
 if(!ed)setHl(keepHl!==undefined?keepHl:(sel.selectedIndex<0?0:sel.selectedIndex),keepHl===undefined)
}
function place(){
 var r=cur.btn.getBoundingClientRect(),vw=window.innerWidth,vh=window.innerHeight;
 pop.classList.remove("up");pop.style.maxHeight="";
 pop.style.width="max-content";pop.style.minWidth=Math.max(r.width,mode==="edit"?270:200)+"px";pop.style.maxWidth=Math.min(420,vw-16)+"px";
 var w=pop.offsetWidth;
 pop.style.left=Math.max(8,Math.min(r.left,vw-w-8))+"px";
 var below=vh-r.bottom-16,above=r.top-16,full=Math.min(pop.scrollHeight,340);
 if(below<Math.min(full,220)&&above>below){pop.classList.add("up");pop.style.maxHeight=Math.min(340,above)+"px";pop.style.top="auto";pop.style.bottom=(vh-r.top+8)+"px"}
 else{pop.style.maxHeight=Math.min(340,below)+"px";pop.style.bottom="auto";pop.style.top=(r.bottom+8)+"px"}
}
function open(p){
 close(true);cur=p;mode="pick";confirmV=-1;
 render();place();
 p.btn.setAttribute("aria-expanded","true");
 pop.classList.add("open");pop.setAttribute("tabindex","-1")
}
function close(silent){
 if(!cur)return;cur.btn.setAttribute("aria-expanded","false");pop.classList.remove("open");
 var b=cur.btn;cur=null;hl=-1;mode="pick";confirmV=-1;if(!silent)b.focus({preventScroll:true})
}
function pick(i){
 if(!cur)return;var sel=cur.sel,o=sel.options[i];if(!o||o.disabled)return;var p=cur;
 close();
 if(sel.selectedIndex!==i){sel.selectedIndex=i;fire(sel)}
 sync(p)
}
function toPick(){mode="pick";confirmV=-1;render();place()}
function toEdit(){mode="edit";confirmV=-1;render();place();var i=pop.querySelector(".gsel-in");if(i)i.focus()}
function doAdd(){
 var sel=cur.sel,inp=pop.querySelector(".gsel-in"),v=window.optAdd?window.optAdd(sel.dataset.manage,inp.value):"";
 if(!v){inp.focus();return}
 var had=false;Array.prototype.forEach.call(sel.options,function(o){if(o.value===v)had=true});
 window.optRebuild(sel,v);fire(sel);sync(cur);
 say(had?"Option already exists — selected":"Option added: "+v);
 render();place();var i=pop.querySelector(".gsel-in");if(i)i.focus()
}
function doDel(i){
 var sel=cur.sel,o=sel.options[i];if(!o)return;var v=o.value,was=sel.value;
 window.optRemove(sel.dataset.manage,v);
 window.optRebuild(sel,was===v?"":was);if(was===v)fire(sel);sync(cur);
 say("Option deleted: "+v);
 confirmV=-1;render();place()
}
pop.addEventListener("click",function(e){
 var t=e.target,q=function(c){return t.closest("."+c)};
 var it=q("gsel-opt");if(it){if(it.getAttribute("aria-disabled")!=="true")pick(+it.dataset.i);return}
 if(q("gsel-edit")){toEdit();return}
 if(q("gsel-done")){toPick();return}
 var d=q("gsel-del");if(d){confirmV=+d.dataset.i;render();place();var y=pop.querySelector(".gsel-yes");if(y)y.focus();return}
 if(q("gsel-no")){confirmV=-1;render();place();return}
 var y=q("gsel-yes");if(y){doDel(+y.dataset.i);return}
 if(q("gsel-addbtn")){doAdd();return}
});
pop.addEventListener("mousemove",function(e){if(mode!=="pick")return;var it=e.target.closest(".gsel-opt");if(it){var k=[].indexOf.call(items(),it);if(k!==hl)setHl(k,false)}});
document.addEventListener("keydown",function(e){
 if(!cur)return;
 var k=e.key,onInput=e.target&&e.target.classList&&e.target.classList.contains("gsel-in");
 if(onInput){
  if(k==="Enter"){e.preventDefault();e.stopPropagation();doAdd()}
  else if(k==="Escape"){e.preventDefault();e.stopPropagation();toPick()}
  e.stopPropagation&&k!=="Tab"&&e.stopPropagation();return
 }
 if(k==="Escape"){e.preventDefault();e.stopPropagation();mode==="edit"?toPick():close();return}
 if(mode==="edit")return;
 if(k==="ArrowDown"){e.preventDefault();setHl(hl+1)}
 else if(k==="ArrowUp"){e.preventDefault();setHl(hl-1)}
 else if(k==="Home"){e.preventDefault();setHl(0)}
 else if(k==="End"){e.preventDefault();setHl(items().length-1)}
 else if(k==="Enter"||k===" "){
  if(e.target&&e.target.closest&&e.target.closest(".gsel-edit"))return;
  e.preventDefault();e.stopPropagation();if(hl>=0&&items()[hl])pick(+items()[hl].dataset.i)}
 else if(k==="Tab"){close(true)}
 else if(k.length===1){var c=k.toLowerCase(),it=items(),n=it.length;for(var j=1;j<=n;j++){var x=(hl+j)%n;if(it[x].textContent.trim().toLowerCase().indexOf(c)===0){setHl(x);break}}}
},true);
document.addEventListener("mousedown",function(e){if(cur&&!pop.contains(e.target)&&!cur.btn.contains(e.target))close(true)},true);
window.addEventListener("resize",function(){close(true)});
window.addEventListener("scroll",function(e){if(cur&&!pop.contains(e.target))close(true)},true);
function scan(root){
 if(root.nodeType!==1)return;
 if(root.tagName==="SELECT")enhance(root);
 root.querySelectorAll&&root.querySelectorAll("select").forEach(enhance)
}
scan(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(scan)})}).observe(document.body,{childList:true,subtree:true});
setInterval(function(){
 for(var i=pairs.length-1;i>=0;i--){var p=pairs[i];
  if(!p.sel.isConnected){if(cur===p)close(true);p.btn.remove();pairs.splice(i,1)}
  else sync(p)}
},250)
})();
