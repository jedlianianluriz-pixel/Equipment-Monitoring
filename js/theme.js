function applyTheme(t){t=t==="light"?"light":"dark";document.documentElement.setAttribute("data-theme",t);document.querySelectorAll(".themesw button").forEach(b=>{let on=b.dataset.theme===t;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});try{localStorage.setItem("jt_theme",t)}catch(e){}try{let n={};try{n=JSON.parse(window.name||"{}")}catch(e){}n.jt_theme=t;window.name=JSON.stringify(n)}catch(e){}}
document.querySelectorAll(".themesw button").forEach(b=>b.addEventListener("click",()=>applyTheme(b.dataset.theme)));
applyTheme(document.documentElement.getAttribute("data-theme"));
