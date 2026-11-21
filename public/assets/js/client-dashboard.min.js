(function(){"use strict";const Le=window.__CLERK_PUBLISHABLE_KEY__||"pk_live_Y2xlcmsud2hpenN0dWRpby5hcnQk",ke="https://whiz-api.kaziaremon.workers.dev/api/v1",Pe={BDT:{symbol:"\u09F3",name:"Bangladeshi Taka",locale:"bn-BD",decimals:2},USD:{symbol:"$",name:"US Dollar",locale:"en-US",decimals:2},GBP:{symbol:"\xA3",name:"British Pound",locale:"en-GB",decimals:2},EUR:{symbol:"\u20AC",name:"Euro",locale:"de-DE",decimals:2},AED:{symbol:"AED",name:"UAE Dirham",locale:"ar-AE",decimals:2},SAR:{symbol:"SAR",name:"Saudi Riyal",locale:"ar-SA",decimals:2},CAD:{symbol:"CA$",name:"Canadian Dollar",locale:"en-CA",decimals:2},AUD:{symbol:"A$",name:"Australian Dollar",locale:"en-AU",decimals:2},SGD:{symbol:"S$",name:"Singapore Dollar",locale:"en-SG",decimals:2},INR:{symbol:"\u20B9",name:"Indian Rupee",locale:"en-IN",decimals:2},JPY:{symbol:"\xA5",name:"Japanese Yen",locale:"ja-JP",decimals:0},MYR:{symbol:"RM",name:"Malaysian Ringgit",locale:"ms-MY",decimals:2}};function D(t,n="USD"){const e=(n||"USD").toUpperCase(),s=Pe[e]||{symbol:e,locale:"en-US",decimals:2},o=s.decimals===0?1:100,r=(Number(t)||0)/o;try{return new Intl.NumberFormat(s.locale,{style:"currency",currency:e,minimumFractionDigits:s.decimals,maximumFractionDigits:s.decimals}).format(r)}catch{return s.symbol+r.toFixed(s.decimals)}}function y(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}let L=null,N=null,K=null;function _e(){let t=document.getElementById("whizGlassSelectPortal");return t?(t.style.zIndex="10005",t.style.pointerEvents="none"):(t=document.createElement("div"),t.id="whizGlassSelectPortal",t.className="whiz-glass-portal-root",t.setAttribute("aria-hidden","true"),t.style.cssText="position:fixed;top:0;left:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:10005;",document.body.appendChild(t)),t}function q(t,n){if(!t||!n)return;const e=t.getBoundingClientRect(),s=window.innerHeight,o=n.offsetHeight||240,r=s-e.bottom-12,l=e.top-12,a=r<o&&l>r;let d=a?e.top-o-6:e.bottom+6,f=e.width||t.offsetWidth||240,p=Math.max(8,Math.min(e.left,window.innerWidth-f-8)),m=a?Math.max(160,Math.min(280,l)):Math.max(160,Math.min(280,r));n.classList.toggle("dropup",a),n.style.position="fixed",n.style.top=Math.round(d)+"px",n.style.left=Math.round(p)+"px",n.style.width=Math.round(f)+"px",n.style.maxHeight=Math.round(m)+"px",n.style.zIndex="10010",n.style.pointerEvents="auto"}function H(){if(!L)return;const t=L,n=N,e=K;t.classList.remove("open","dropup"),t.style.display="none",n?.classList.remove("active"),n?.setAttribute("aria-expanded","false"),e&&t.parentNode!==e&&e.appendChild(t),t.style.position="",t.style.top="",t.style.left="",t.style.width="",t.style.maxHeight="",t.style.zIndex="",t.style.pointerEvents="",L=null,N=null,K=null}function de(){document.querySelectorAll("[data-glass-select]").forEach(n=>{const e=n.querySelector("select"),s=n.querySelector(".glass-select-trigger"),o=n.querySelector(".glass-select-menu")||document.getElementById("whizGlassSelectPortal")?.querySelector('[id="'+n.dataset.glassSelect+'Menu"]'),r=s?.querySelector(".select-label"),l=s?.querySelector(".select-icon");if(!s||!o)return;const a=()=>Array.from(o.querySelectorAll(".glass-select-option"));if(n.dataset.glassInitialized==="true"){const p=e?.value||"";a().forEach(x=>{const u=x.dataset.value===p;if(x.classList.toggle("selected",u),x.setAttribute("aria-selected",u?"true":"false"),u){if(r){const B=x.querySelector(".select-opt-text")?.textContent||x.querySelector("span:not(.currency-badge)")?.textContent||x.querySelector("span")?.textContent||x.textContent.trim();r.textContent=B}const g=s.querySelector(".select-currency-symbol"),w=x.querySelector(".currency-badge");g&&w&&(g.textContent=w.textContent)}});return}n.dataset.glassInitialized="true";function d(p,m=!0){e&&(e.value=p),a().forEach(u=>{const g=u.dataset.value===p;if(u.classList.toggle("selected",g),u.setAttribute("aria-selected",g?"true":"false"),g){if(r){const F=u.querySelector(".select-opt-text")?.textContent||u.querySelector("span:not(.currency-badge)")?.textContent||u.querySelector("span")?.textContent||u.textContent.trim();r.textContent=F}const w=s.querySelector(".select-currency-symbol"),B=u.querySelector(".currency-badge");w&&B&&(w.textContent=B.textContent)}}),m&&e&&e.dispatchEvent(new Event("change",{bubbles:!0}))}function f(p){(typeof p=="boolean"?p:o!==L||!o.classList.contains("open"))?(L&&L!==o&&H(),L=o,N=s,K=n,_e().appendChild(o),o.style.display="block",q(s,o),requestAnimationFrame(()=>{o.classList.add("open"),s.classList.add("active"),s.setAttribute("aria-expanded","true"),q(s,o);const u=a();(o.querySelector(".glass-select-option.selected")||u[0])?.focus()})):H()}s.addEventListener("click",p=>{p.preventDefault(),p.stopPropagation(),f()}),o.addEventListener("click",p=>{const m=p.target.closest(".glass-select-option");m&&(p.preventDefault(),p.stopPropagation(),d(m.dataset.value,!0),H(),s.focus())}),e&&(e.addEventListener("change",()=>{d(e.value,!1)}),e.value&&d(e.value,!1))})}document.addEventListener("click",t=>{L&&!L.contains(t.target)&&!N?.contains(t.target)&&H()}),window.addEventListener("resize",()=>{L&&N&&q(N,L)}),window.addEventListener("scroll",()=>{L&&N&&q(N,L)},{passive:!0,capture:!0});let $e=null;const i={currentUser:null,clientProfile:null,activeTab:"overview",services:[],projects:[],invoices:[],payments:[],finance:null,cif:null,receiptQuota:{used:0,max:2,remaining:2,isLimitReached:!1},overallProgress:0,organizations:[],selectedOrganizationId:null,completionChart:null,refreshIntervalId:null,isRefreshing:!1,clientContentFolders:[]};async function _(t,n={}){if(i.isPreview&&window.__whizClientMock)return window.__whizClientMock.handleRequest(t,n);const e={"Content-Type":"application/json",...n.headers||{}};if(i.selectedOrganizationId&&(e["X-Organization-Id"]=i.selectedOrganizationId),window.Clerk&&window.Clerk.session)try{const s=await window.Clerk.session.getToken();s&&(e.Authorization=`Bearer ${s}`)}catch(s){console.warn("Could not retrieve Clerk token:",s)}window.Clerk&&window.Clerk.user&&(e["X-Clerk-User-Id"]=window.Clerk.user.id);try{let s=t;t.startsWith("/api/")?s=window.location.protocol==="file:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?`https://whizstudio.art${t}`:t:s=`${ke}${t}`;const o=await fetch(s,{...n,headers:e}),r=await o.json().catch(()=>({}));return{ok:o.ok,status:o.status,data:r}}catch(s){return console.error("API Fetch Error:",s),{ok:!1,status:500,data:{success:!1,error:"Network connection failure."}}}}function b(t,n="info"){const e=document.getElementById("clientGlobalToast");e&&e.remove();const s=document.createElement("div");s.id="clientGlobalToast";const o=n==="error"?"bg-white border-rose-400 text-[#172B36]":n==="success"?"bg-white border-emerald-400 text-[#172B36]":"bg-white border-[#E3E9EF] text-[#172B36]",r=n==="error"?"fa-triangle-exclamation text-rose-500":n==="success"?"fa-circle-check text-emerald-500":"fa-circle-info text-brand-whiz";s.className=`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-medium transition-all transform translate-y-2 opacity-0 ${o}`,s.innerHTML=`<i class="fa-solid ${r}"></i><span>${t}</span>`,document.body.appendChild(s),requestAnimationFrame(()=>{s.classList.remove("translate-y-2","opacity-0")}),setTimeout(()=>{s.classList.add("translate-y-2","opacity-0"),setTimeout(()=>s.remove(),300)},4e3)}function I(t,n=!0){t||(t="overview"),t==="content-calendar"&&(t="content_calendar"),i.activeTab=t,["overview","services","tasks","finance","reviews","profile","support","settings","content_calendar"].forEach(a=>{const d=document.getElementById(`view_${a}`);d&&(a===t?d.classList.remove("hidden"):d.classList.add("hidden"))}),document.querySelectorAll("[data-client-tab]").forEach(a=>{const d=a.dataset.clientTab===t;if(a.closest("nav.lg\\:hidden"))d?(a.classList.add("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/25","shadow-2xs"),a.classList.remove("text-[#74817D]","border-transparent","font-semibold")):(a.classList.remove("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/25","shadow-2xs"),a.classList.add("text-[#74817D]","border-transparent","font-semibold"));else{const f=a.querySelector("i");d?(a.classList.add("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/20","shadow-2xs"),a.classList.remove("text-[#74817D]","border-transparent","font-medium","font-semibold"),f&&(f.classList.add("text-[#087F70]"),f.classList.remove("text-[#74817D]"))):(a.classList.remove("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/20","shadow-2xs"),a.classList.add("text-[#74817D]","border-transparent","font-semibold"),f&&(f.classList.remove("text-[#087F70]"),f.classList.add("text-[#74817D]")))}});const s={overview:"Campaign Overview",services:"My Active Services",tasks:"Deliverables Progress",finance:"Invoices",profile:"My Profile",support:"Support & Inquiries",settings:"Account Security",content_calendar:"Content Calendar"},o=document.getElementById("breadcrumbActiveTab");o&&(o.textContent=s[t]||t);const r=document.getElementById("clientSubheaderTitle");r&&(r.textContent=s[t]||t);const l=document.querySelector("main > div.overflow-y-auto");l&&(l.scrollTop=0),n&&(window.location.hash=t),t==="profile"&&G(i.cif||i.clientProfile),t==="support"&&te(),t==="overview"&&z(),t==="content_calendar"&&he()}async function T(t=!1){i.isRefreshing=!0;try{const n=await _("/portal/client-overview");if(n.ok&&n.data&&n.data.success&&n.data.data){const e=n.data.data;i.services=Array.isArray(e.services)?e.services:Array.isArray(e.activeServices)?e.activeServices:[],i.projects=Array.isArray(e.projects)?e.projects:Array.isArray(e.activeProjects)?e.activeProjects:[],i.payments=e.recentPayments||e.payments||[],i.invoices=e.invoices||[],i.finance=e.finance||null,i.cif=e.cif||null,e.receiptQuota&&(i.receiptQuota=e.receiptQuota),X(),U(),R(),i.overallProgress=Math.round(Number(e.overallProgressPercent||0)),i.organizations=e.organizations||[],ce(),ue(),me(),ye()}else{const[e,s,o]=await Promise.all([_("/services/my-services"),_("/projects"),_("/finance/invoices")]);e.ok&&e.data&&e.data.data&&(i.services=e.data.data.services||e.data.data||[]),s.ok&&s.data&&s.data.data&&(i.projects=s.data.data.projects||s.data.data||[]),o.ok&&o.data&&o.data.data&&(i.invoices=o.data.data.invoices||[],i.payments=o.data.data.payments||[]),X(),ce(),ue(),me(),ye()}}catch(n){console.warn("Data preload notice:",n)}finally{i.isRefreshing=!1}}function X(){try{const t=localStorage.getItem("whiz_synced_ledger_records");if(!t)return;const n=JSON.parse(t);if(!Array.isArray(n)||n.length===0)return;n.forEach(e=>{const s=e.invoice_number||e.invoice_no;i.invoices.some(a=>e.id&&String(a.id)===String(e.id)||s&&(a.invoice_number===s||a.invoice_no===s))||i.invoices.unshift({id:e.id||"inv_"+Date.now(),invoice_number:s||"INV-2026-"+Math.floor(100+Math.random()*900),service_name:e.service_name||e.title||e.description||"Agency Retainer Service",serviceName:e.service_name||e.title||e.description||"Agency Retainer Service",issue_date:e.issue_date||e.payment_date||new Date().toISOString().split("T")[0],due_date:e.due_date||new Date(Date.now()+30*864e5).toISOString().split("T")[0],total_cents:e.total_cents||e.amount_cents||0,amount_paid_cents:e.amount_paid_cents||e.amount_cents||0,outstanding_balance_cents:e.outstanding_balance_cents!==void 0?e.outstanding_balance_cents:0,currency:e.currency||"USD",status:e.status||"paid",payment_method:e.payment_method||"Online",payment_reference:e.payment_reference||"LEDGER-VERIFIED",created_at:e.created_at||new Date().toISOString()});const r=e.receipt_number||e.receipt_no;i.payments.some(a=>e.id&&String(a.id)===String(e.id)||r&&(a.receipt_number===r||a.receipt_no===r))||i.payments.unshift({id:e.id||"pay_"+Date.now(),receipt_number:r||"RCPT-2026-"+Math.floor(100+Math.random()*900),receiptNumber:r||"RCPT-2026-"+Math.floor(100+Math.random()*900),amount_cents:e.amount_cents||e.total_cents||0,amountCents:e.amount_cents||e.total_cents||0,currency:e.currency||"USD",payment_date:e.payment_date||new Date().toISOString().split("T")[0],paymentDate:e.payment_date||new Date().toISOString().split("T")[0],payment_method:e.payment_method||"Online",paymentMethod:e.payment_method||"Online",payment_reference:e.payment_reference||"LEDGER-VERIFIED",invoice_number:s||" - ",created_at:e.created_at||new Date().toISOString()})})}catch(t){console.warn("[Ledger Sync] Failed to merge synced records:",t)}}function z(){const t=document.getElementById("clientOverviewGreetingTitle"),n=document.getElementById("clientOverviewGreetingSubtext");if(!t&&!n)return;const e=new Date().getHours();let s="Good Morning";e>=12&&e<17?s="Good Afternoon":(e>=17||e<4)&&(s="Good Evening");const o=i.clientProfile?.fullName||i.clientProfile?.full_name||i.cif?.fullName||i.currentUser?.firstName||i.currentUser?.fullName||window.Clerk?.user?.firstName||window.Clerk?.user?.fullName||"";let r="";if(o){const a=o.trim().split(/\s+/);r=a[0],["md","md.","mr","mr.","ms","ms.","dr","dr."].includes(r.toLowerCase())&&a.length>1&&(r=a[1])}else r="Client";r&&(r=r.charAt(0).toUpperCase()+r.slice(1).toLowerCase()),t&&(t.textContent=`${s}, ${r}!`);const l=["Welcome back! Let's achieve great things today.","Here is the latest snapshot of your project's progress.","Ready to see your business grow?","Your campaigns and operational deliverables are running smoothly.","Review your live milestones, verified deliverables, and invoices below.","enabling your brand with dedicated digital growth and execution."];if(n){const a=l[Math.floor(Math.random()*l.length)];n.textContent=a}}function ce(){z();const t=document.getElementById("statActiveServices"),n=document.getElementById("statCompletedTasks"),e=document.getElementById("statInvoicesCount");if(t&&(t.textContent=i.services.length),n){const u=i.projects.reduce((B,F)=>B+(F.completedTasksCount||0),0),g=i.projects.reduce((B,F)=>B+(F.totalTasksCount||0),0);n.textContent=g>0?`${u} / ${g}`:`${u}`;const w=document.getElementById("statCompletedTasksSubtext");w&&(w.textContent=g>0?"Completed / Total Tasks":"Completed Tasks")}e&&(e.textContent=i.invoices.length);const s=document.getElementById("clientOverallProgressBadge");s&&(s.textContent=`${i.overallProgress}%`);const o=document.getElementById("statOverallProgressPercent");o&&(o.textContent=`${i.overallProgress}%`);const r=document.getElementById("chartClientCompletion"),l=document.getElementById("chartClientEmptyState");if(r){if(i.services.length===0)l&&l.classList.remove("hidden"),i.completionChart&&(i.completionChart.destroy(),i.completionChart=null);else if(l&&l.classList.add("hidden"),typeof Chart<"u"){i.completionChart&&i.completionChart.destroy();const u=r.getContext("2d");i.completionChart=new Chart(u,{type:"doughnut",data:{labels:["Completed","Remaining"],datasets:[{data:[i.overallProgress,Math.max(0,100-i.overallProgress)],backgroundColor:["#147D64","#E3E9EF"],borderWidth:0,hoverOffset:2}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"76%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:g=>` ${g.label}: ${g.raw}%`}}}}})}}const a=i.finance?.currency||"USD",d=document.getElementById("clientSummaryTotalBilled"),f=document.getElementById("clientSummaryTotalPaid"),p=document.getElementById("clientSummaryBalance"),m=document.getElementById("clientSummaryContractValue");m&&(m.textContent=D(i.finance?.contractValueCents||0,a)),d&&(d.textContent=D(i.finance?.totalInvoicedCents||0,a)),f&&(f.textContent=D(i.finance?.totalPaidCents||0,a)),p&&(p.textContent=D(i.finance?.outstandingBalanceCents||0,a));const x=document.getElementById("overviewServicesList");x&&(i.services.length===0?x.innerHTML=`
        <div class="p-5 sm:p-7 rounded-2xl bg-[#F7FAF9] border border-[#E6ECE9] text-center space-y-3.5">
          <div class="w-11 h-11 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center mx-auto text-base shadow-2xs">
            <i class="fa-solid fa-shapes"></i>
          </div>
          <div class="space-y-1 max-w-sm mx-auto">
            <p class="font-bold text-xs text-[#202D2A]">No active marketing services attached yet</p>
            <p class="text-[11px] text-[#74817D] leading-relaxed">Explore our marketing packages and dedicated campaign execution to accelerate your brand.</p>
          </div>
          <div class="pt-1">
            <a href="/#services" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F70] hover:bg-[#066559] active:bg-[#054f46] text-white text-xs font-bold transition-all shadow-xs cursor-pointer touch-manipulation">
              <i class="fa-solid fa-compass text-xs"></i>
              <span>Browse Service Catalog</span>
            </a>
          </div>
        </div>
      `:(x.innerHTML=i.services.map(u=>{const g=Math.round(Number(u.progress_percent||u.progressPercent||0));return`
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6ECE9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
            <div class="flex items-start sm:items-center space-x-3.5 min-w-0 w-full sm:w-auto">
              <div class="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/25 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-bold text-[#202D2A] truncate">${y(u.service_name||u.serviceName||"Agency Service")}</h4>
                <p class="text-[11px] text-[#74817D] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span>Status: <strong class="text-[#087F70] uppercase font-bold">${y(u.status||"Active")}</strong></span>
                  <span class="text-slate-300">\u2022</span>
                  <span>Progress: <strong class="text-[#087F70] font-mono font-bold">${g}%</strong></span>
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E6ECE9]">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${y(u.status||"Active")}
              </span>
              <button type="button" data-client-tab="services" class="px-3 py-1.5 rounded-lg bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] hover:text-[#087F70] text-[11px] font-semibold transition-all border border-[#E6ECE9] hover:border-[#087F70]/20 cursor-pointer touch-manipulation">
                Details
              </button>
            </div>
          </div>
        `}).join(""),x.querySelectorAll("[data-client-tab]").forEach(u=>{u.addEventListener("click",()=>I(u.dataset.clientTab))})))}function ue(){const t=document.getElementById("servicesFullList"),n=document.getElementById("servicesPortfolioCount");if(n&&(n.textContent=`${i.services.length} Active Services`),!!t){if(i.services.length===0){t.innerHTML=`
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-layer-group text-2xl text-slate-400 block mb-1"></i>
          <p>No active services provisioned for this account.</p>
        </div>
      `;return}t.innerHTML=i.services.map(e=>{const s=Math.round(Number(e.progress_percent||e.progressPercent||0));return`
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center space-x-3.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/25 flex items-center justify-center font-bold text-base shrink-0">
                <i class="fa-solid fa-shapes"></i>
              </div>
              <div class="min-w-0">
                <h4 class="text-sm sm:text-base font-bold text-[#172B36] truncate">${y(e.service_name||e.serviceName||e.name||"Marketing Service")}</h4>
                <p class="text-xs text-slate-500 mt-0.5">Active Service Engagement</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              ${y(e.status||"Active")}
            </span>
          </div>

          <!-- Progress Bar & Delivery Status -->
          <div class="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-[#E3E9EF]">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-semibold">Service Delivery Progress</span>
              <span class="font-mono font-bold text-[#087F70] text-sm">${s}%</span>
            </div>
            <div class="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-[#E3E9EF]">
              <div class="bg-gradient-to-r from-[#087F70] to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${s}%"></div>
            </div>
          </div>
        </div>
      `}).join("")}}function me(){const t=document.getElementById("tasksFullList"),n=document.getElementById("tasksDeliverablesCount");if(n&&(n.textContent=`${i.projects.length} Active Campaigns`),!!t){if(i.projects.length===0){t.innerHTML=`
        <div class="p-8 sm:p-12 rounded-3xl bg-white border border-[#E3E9EF] text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-[#172B36]">No active project campaigns provisioned yet</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">When your service agreement is activated, milestone progress updates will appear here.</p>
          </div>
        </div>
      `;return}t.innerHTML=i.projects.map(e=>{const s=Math.min(100,Math.max(0,Math.round(Number(e.progress_percent||e.progressPercent||0)))),o=Number(e.completedTasksCount||0),r=Number(e.totalTasksCount||0),l=Math.max(0,r-o);return`
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h4 class="text-sm sm:text-base font-bold text-[#172B36] flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-[#087F70] text-xs"></i>
                <span>${y(e.name||e.projectName||"Campaign Execution")}</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Campaign Status: <strong class="text-slate-600">${y(e.status||"Active")}</strong></p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${y(e.status||"Active")}
            </span>
          </div>

          <!-- Progress Bar & Percentage -->
          <div class="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-[#E3E9EF]">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-semibold">Campaign Delivery Progress</span>
              <span class="font-mono font-bold text-[#087F70] text-sm">${s}%</span>
            </div>
            <div class="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-[#E3E9EF]">
              <div class="bg-gradient-to-r from-[#087F70] to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${s}%"></div>
            </div>
          </div>

          <!-- High-Level Aggregate Task Counters (Zero Granular SOP Leakage) -->
          <div class="grid grid-cols-3 gap-3 pt-2">
            <div class="p-3 rounded-2xl bg-[#F7F9FC] border border-[#E3E9EF] text-center">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Tasks</span>
              <span class="text-base sm:text-lg font-black text-[#172B36] font-mono mt-0.5 block">${r}</span>
            </div>
            <div class="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-center">
              <span class="text-[10px] uppercase font-bold text-emerald-700 block">Completed</span>
              <span class="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">${o}</span>
            </div>
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">In Progress</span>
              <span class="text-base sm:text-lg font-black text-slate-700 font-mono mt-0.5 block">${l}</span>
            </div>
          </div>
        </div>
      `}).join("")}}function G(t){const n=t||i.cif||{},e=(l,a)=>{const d=document.getElementById(l);d&&(d.value=a??"")},s=window.Clerk?.user,o=(n.email||i.currentUser?.email||s?.primaryEmailAddress?.emailAddress||"").toLowerCase(),r=n.fullName||n.full_name||i.currentUser?.fullName||(s?`${s.firstName||""} ${s.lastName||""}`.trim():"")||"Client";e("profileFullName",r),e("profileEmail",o),e("profilePhone",n.phone||""),e("profileCompanyName",n.companyName||n.company_name||i.currentUser?.companyName||""),e("profileBillingName",n.billingName||n.billing_name||r),e("profileCurrency",n.billingCurrency||n.billing_currency||"USD"),e("profileAddress",n.billingAddress||n.billing_address||""),e("profileCity",n.city||""),e("profileCountry",n.country||"Bangladesh"),e("profilePostalCode",n.postalCode||n.postal_code||""),e("profileTaxId",n.taxId||n.tax_id||""),de(),Z(),fe(n.isLocked||n.is_locked===1)}function fe(t){const n=!!t,e=document.getElementById("btnSaveClientProfile"),s=document.getElementById("profileLockedNoticeBanner");["profileFullName","profileBillingName","profileCompanyName","profilePhone","profileAddress","profileCity","profileCountry","profilePostalCode","profileCurrency","profileTaxId"].forEach(r=>{const l=document.getElementById(r);if(l){n?(l.disabled=!0,l.classList.add("bg-slate-100","cursor-not-allowed","text-slate-600","border-slate-200"),l.classList.remove("bg-slate-50","bg-white")):(l.disabled=!1,l.classList.remove("bg-slate-100","cursor-not-allowed","text-slate-600","border-slate-200"),l.classList.add("bg-slate-50"));const a=l.closest(".glass-select-wrapper")?.querySelector(".glass-select-trigger");a&&(a.disabled=n,a.classList.toggle("opacity-60",n),a.classList.toggle("cursor-not-allowed",n))}}),e&&(n?e.classList.add("hidden"):e.classList.remove("hidden")),s&&(n?s.classList.remove("hidden"):s.classList.add("hidden"))}function Z(){const t=[{id:"profileFullName",label:"Full Legal Name"},{id:"profileBillingName",label:"Billing Name"},{id:"profileEmail",label:"Verified Email"},{id:"profilePhone",label:"Phone Number"},{id:"profileAddress",label:"Full Billing Address"},{id:"profileCity",label:"City"},{id:"profileCountry",label:"Country"},{id:"profileCurrency",label:"Billing Currency"}];let n=0;const e=[];t.forEach(x=>{const u=document.getElementById(x.id);(u?u.value.trim():"").length>0?n++:e.push(x.label)});const s=Math.round(n/t.length*100),o=s===100,r=document.getElementById("profileStatusProgressBar"),l=document.getElementById("profileStatusPercentBadge"),a=document.getElementById("profileStatusBannerTitle"),d=document.getElementById("profileStatusBannerDesc"),f=document.getElementById("profileStatusBannerIcon"),p=document.getElementById("profileMissingFieldsAlert"),m=document.getElementById("profileMissingFieldsList");r&&(r.style.width=`${s}%`,r.className=o?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-amber-500 transition-all duration-300"),l&&(l.textContent=`${s}% Complete`,l.className=o?"text-xs font-extrabold text-emerald-700 font-mono px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200":"text-xs font-extrabold text-amber-700 font-mono px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200"),o?(a&&(a.textContent="Profile Verified (100%)"),d&&(d.textContent="All 8 mandatory billing fields verified. Official PDF invoice generation active."),f&&(f.className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0",f.innerHTML='<i class="fa-solid fa-circle-check"></i>'),p&&p.classList.add("hidden")):(a&&(a.textContent=`Profile Incomplete (${s}%)`),d&&(d.textContent="Complete all 8 mandatory fields to enable official invoice PDF downloads."),f&&(f.className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0",f.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i>'),p&&(p.classList.remove("hidden"),m&&(m.textContent=e.join(", "))))}async function pe(t){t&&t.preventDefault&&t.preventDefault();const n=document.getElementById("btnSaveClientProfile"),e=n?n.innerHTML:"";n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving changes...');try{const s=a=>(document.getElementById(a)?.value||"").trim(),o={fullName:s("profileFullName"),email:s("profileEmail")||i.currentUser?.email||"",phone:s("profilePhone"),companyName:s("profileCompanyName"),billingName:s("profileBillingName"),billingCurrency:s("profileCurrency")||"USD",billingAddress:s("profileAddress"),city:s("profileCity"),country:s("profileCountry")||"Bangladesh",postalCode:s("profilePostalCode"),taxId:s("profileTaxId")},r=[{field:o.fullName,name:"Full Legal Name",id:"profileFullName"},{field:o.billingName,name:"Billing / Invoicing Entity Name",id:"profileBillingName"},{field:o.phone,name:"Phone Number",id:"profilePhone"},{field:o.billingAddress,name:"Full Billing Street Address",id:"profileAddress"},{field:o.city,name:"City",id:"profileCity"},{field:o.country,name:"Country",id:"profileCountry"},{field:o.billingCurrency,name:"Preferred Billing Currency",id:"profileCurrency"}];for(const a of r)if(!a.field){const d=document.getElementById(a.id);throw d&&d.focus(),new Error(`Please provide your ${a.name}.`)}const l=await _("/portal/client/cif",{method:"POST",body:JSON.stringify(o)});if(l.status===403||l.data?.code==="PROFILE_LOCKED"){b(l.data?.error||"Your profile is verified and locked. Contact Whiz Studio Support to request changes.","error"),fe(!0);return}if(!l.ok||!l.data||!l.data.success)throw new Error(l.data?.error||"Failed to save profile.");i.cif=l.data.data,i.clientProfile&&Object.assign(i.clientProfile,l.data.data),U(),G(i.cif),Z(),b(l.data.message||"Profile saved and verified successfully!","success")}catch(s){console.error("Save profile error:",s),b(s.message||"Error saving profile details.","error")}finally{n&&(n.disabled=!1,n.innerHTML=e||'<i class="fa-solid fa-floppy-disk"></i> <span>Save Changes</span>')}}function O(t,n,e="Processing..."){t&&(n?(t.dataset.origText=t.innerHTML,t.disabled=!0,t.innerHTML=`<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>${e}</span>`):(t.disabled=!1,t.dataset.origText&&(t.innerHTML=t.dataset.origText,delete t.dataset.origText)))}function ee(){try{const n=!!window.Clerk?.user?.passwordEnabled,e=document.getElementById("settingsPasswordStatusBadge"),s=document.getElementById("settingsPasswordHelpText"),o=document.getElementById("btnOpenPasswordModalText"),r=document.getElementById("modalClientPasswordTitle"),l=document.getElementById("containerCurrentPassword");if(e&&(e.textContent=n?"Password Active":"No Password Set",e.className=n?"px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200":"px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200"),s&&(s.textContent=n?"Your account is protected with a password in addition to Google Single Sign-On.":"You registered with Google SSO. You can optionally set a permanent password for direct email/password sign-in."),o&&(o.textContent=n?"Change Password":"Set Password"),r&&(r.textContent=n?"Change Account Password":"Set Account Password"),l)if(n){l.classList.remove("hidden");const a=document.getElementById("inputCurrentPassword");a&&(a.required=!0)}else{l.classList.add("hidden");const a=document.getElementById("inputCurrentPassword");a&&(a.required=!1)}}catch(t){console.warn("updatePasswordUi error:",t)}}function Fe(){try{const t=window.Clerk?.user;if(!t)return;const n=(i.clientProfile?.email||t.primaryEmailAddress?.emailAddress||"").toLowerCase(),e=document.getElementById("settingsEmail");e&&(e.textContent=n);const s=document.getElementById("settingsClerkUserId");s&&(s.innerHTML='<i class="fa-solid fa-shield-check text-[#147D64] mr-1.5"></i><span>Hardware-Backed SSO Session Active</span>');const o=document.getElementById("settingsAuthProvider"),r=t.externalAccounts?.some(l=>l.provider==="google");o&&(o.textContent=r?"Google Single Sign-On (SSO)":"Email Authentication"),ee()}catch(t){console.warn("populateSettingsView error:",t)}}function U(){const t=document.getElementById("cifStatusCard"),n=document.getElementById("cifStatusIcon"),e=document.getElementById("cifStatusTitle"),s=document.getElementById("cifStatusDescription"),o=document.getElementById("cifPercentageBadge"),r=document.getElementById("cifProgressBar"),l=document.getElementById("cifMissingFieldsContainer"),a=document.getElementById("cifMissingFieldsList"),d=document.getElementById("btnCifAction"),f=i.cif||{},p=f.completionPercentage!==void 0?f.completionPercentage:f.isComplete?100:0,m=!!((f.isComplete||p===100)&&(f.isLocked||f.is_locked===1)),x=f.missingFields||[],u=document.getElementById("clientHeaderVerificationBadge"),g=document.getElementById("clientHeaderVerificationDot"),w=document.getElementById("clientHeaderVerificationText");u&&w&&g&&(u.classList.remove("hidden"),m?(u.className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",g.className="w-1.5 h-1.5 rounded-full bg-emerald-500",w.textContent="Verified",u.title="CIF Profile 100% verified. Invoice generation active."):(u.className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",g.className="w-1.5 h-1.5 rounded-full bg-rose-500",w.textContent="Unverified",u.title="CIF profile incomplete. Click to complete profile."),u.dataset.bound||(u.dataset.bound="true",u.addEventListener("click",()=>I("profile")))),o&&(o.textContent=`${p}% Complete`),r&&(r.style.width=`${p}%`,r.className=m?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-amber-500 transition-all duration-300"),m?(n&&(n.className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm",n.innerHTML='<i class="fa-solid fa-circle-check"></i>'),e&&(e.textContent="CIF Profile Complete (100%)"),s&&(s.textContent="All mandatory billing fields verified. Official PDF generation is enabled."),l&&l.classList.add("hidden"),d&&(d.textContent="Edit Profile Details",d.className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shadow-xs cursor-pointer",d.onclick=()=>I("profile"))):(n&&(n.className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm",n.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i>'),e&&(e.textContent=`CIF Profile Incomplete (${p}%)`),s&&(s.textContent="Complete all mandatory fields to unlock official PDF downloads."),l&&(l.classList.remove("hidden"),a&&(a.textContent=x.length>0?x.join(", "):"Mandatory invoice fields required")),d&&(d.textContent="Complete Profile",d.className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#147D64] hover:bg-[#12694f] text-white transition-all shadow-xs cursor-pointer",d.onclick=()=>I("profile")))}const V=2,Q="whiz_invoice_daily_rate_limit";function W(){const t=new Date().toISOString().split("T")[0];let n=null;try{const e=localStorage.getItem(Q);e&&(n=JSON.parse(e))}catch(e){console.warn("[RateLimit] Failed to read stored quota:",e)}if(!n||n.date!==t){n={date:t,max:V,used:0,remaining:V,isLimitReached:!1,timestamps:[]};try{localStorage.setItem(Q,JSON.stringify(n))}catch{}}else n.max=V,n.remaining=Math.max(0,V-(n.used||0)),n.isLimitReached=n.remaining<=0;return n}function Ae(){const t=W();if(t.remaining<=0)return t.isLimitReached=!0,!1;t.used=(t.used||0)+1,t.remaining=Math.max(0,t.max-t.used),t.isLimitReached=t.remaining<=0,Array.isArray(t.timestamps)||(t.timestamps=[]),t.timestamps.push(new Date().toISOString());try{localStorage.setItem(Q,JSON.stringify(t))}catch{}return i.receiptQuota=t,R(),!0}function R(){const t=W();let n=t;if(i.receiptQuota&&typeof i.receiptQuota.remaining=="number"){n={date:t.date,max:i.receiptQuota.max||2,remaining:i.receiptQuota.remaining,used:i.receiptQuota.used||0,isLimitReached:!!(i.receiptQuota.isLimitReached||i.receiptQuota.remaining<=0)};try{localStorage.setItem(Q,JSON.stringify(n))}catch{}}i.receiptQuota=n;const e=document.getElementById("quotaRemainingText"),s=document.getElementById("quotaBadgePill"),o=n.isLimitReached||n.remaining<=0;e&&(e.textContent=o?`Daily download limit reached (0/${n.max})`:`Daily PDF Allowance: ${n.remaining}/${n.max} remaining`),s&&(o?s.className="px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-2 shadow-xs":s.className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#087F70]/10 text-[#087F70] border border-[#087F70]/20 flex items-center gap-2 shadow-xs"),document.querySelectorAll(".btn-download-receipt").forEach(l=>{o?(l.disabled=!0,l.classList.add("opacity-50","cursor-not-allowed"),l.classList.remove("hover:bg-[#066559]"),l.setAttribute("title","Daily download limit reached.")):l.hasAttribute("data-loading")||(l.disabled=!1,l.classList.remove("opacity-50","cursor-not-allowed"),l.classList.add("hover:bg-[#066559]"),l.setAttribute("title","Download official system-generated receipt"))})}async function ge(){try{const t=await _("/portal/client/cif");t.ok&&t.data&&t.data.success&&(i.cif=t.data.data,U(),xe(i.cif))}catch(t){console.warn("Failed to load CIF profile:",t)}}function xe(t){if(!t)return;const n=(e,s)=>{const o=document.getElementById(e);o&&(o.value=s||"")};n("cifInputFullName",t.fullName),n("cifInputBillingName",t.billingName),n("cifInputCompanyName",t.companyName),n("cifInputEmail",t.email),n("cifInputPhone",t.phone),n("cifInputAddress",t.billingAddress),n("cifInputCity",t.city),n("cifInputCountry",t.country),n("cifInputPostalCode",t.postalCode),n("cifInputCurrency",t.billingCurrency||"USD"),n("cifInputTaxId",t.taxId),De()}function De(){const t=["cifInputFullName","cifInputBillingName","cifInputEmail","cifInputPhone","cifInputAddress","cifInputCity","cifInputCountry","cifInputCurrency"];let n=0;t.forEach(r=>{const l=document.getElementById(r);l&&l.value.trim().length>0&&n++});const e=Math.round(n/t.length*100),s=document.getElementById("modalCifPercentText"),o=document.getElementById("modalCifProgressBar");s&&(s.textContent=`${e}% (${n}/8 Mandatory Fields)`),o&&(o.style.width=`${e}%`,o.className=e===100?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-[#147D64] transition-all duration-300")}function Oe(){const t=document.getElementById("modalClientCif");t&&(i.cif&&xe(i.cif),t.classList.remove("hidden"))}function Ne(){const t=document.getElementById("modalClientCif");t&&t.classList.add("hidden")}async function Ue(t){t.preventDefault();const n=document.getElementById("btnSaveCif");n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...');try{const e={fullName:document.getElementById("cifInputFullName")?.value.trim(),billingName:document.getElementById("cifInputBillingName")?.value.trim(),companyName:document.getElementById("cifInputCompanyName")?.value.trim(),email:document.getElementById("cifInputEmail")?.value.trim(),phone:document.getElementById("cifInputPhone")?.value.trim(),billingAddress:document.getElementById("cifInputAddress")?.value.trim(),city:document.getElementById("cifInputCity")?.value.trim(),country:document.getElementById("cifInputCountry")?.value.trim(),postalCode:document.getElementById("cifInputPostalCode")?.value.trim(),billingCurrency:document.getElementById("cifInputCurrency")?.value||"USD",taxId:document.getElementById("cifInputTaxId")?.value.trim()},s=await _("/portal/client/cif",{method:"POST",body:JSON.stringify(e)});if(!s.ok||!s.data||!s.data.success)throw new Error(s.data?.error||"Failed to save CIF profile.");i.cif=s.data.data,U(),Ne(),b(s.data.message||"CIF profile saved successfully!","success")}catch(e){b(e.message||"Error saving CIF profile.","error")}finally{n&&(n.disabled=!1,n.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save &amp; Validate CIF')}}function ye(){const t=document.getElementById("financeFullList"),n=document.getElementById("financeReceiptsCount");if(!t)return;U(),R();const e=i.payments||[];n&&(n.textContent=`${e.length} Verified Transactions Recorded in Ledger`);let s="";if(i.finance&&i.finance.byCurrency){const a=Object.values(i.finance.byCurrency);a.length>0&&(s=`
          <div class="grid grid-cols-1 sm:grid-cols-${Math.min(a.length,3)} gap-4 mb-6">
            ${a.map(d=>`
              <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2">
                <div class="flex items-center justify-between pb-2 border-b border-[#E3E9EF]">
                  <span class="text-xs font-black uppercase text-[#087F70] bg-[#087F70]/10 px-2 py-0.5 rounded-md border border-[#087F70]/20">${y(d.currency)}</span>
                  <span class="text-[10px] uppercase font-bold text-slate-500">Currency Ledger</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced</span>
                    <span class="font-bold text-[#172B36] font-mono">${D(d.totalInvoicedCents||0,d.currency)}</span>
                  </div>
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                    <span class="font-bold text-emerald-600 font-mono">${D(d.totalPaidCents||0,d.currency)}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-[10px] uppercase font-bold text-slate-400">Due Balance</span>
                  <span class="font-black font-mono ${d.outstandingBalanceCents>0?"text-amber-600":"text-emerald-600"}">${D(d.outstandingBalanceCents||0,d.currency)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        `)}if(e.length===0){t.innerHTML=`
        ${s}
        <div class="p-8 sm:p-12 rounded-3xl bg-white border border-[#E3E9EF] text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-[#172B36]">No transaction history recorded yet</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">When your payments are committed to the ledger by Whiz Studio finance, they will appear here with instant zero-storage receipt downloads.</p>
          </div>
        </div>
      `;return}const o=i.receiptQuota||W(),r=o.isLimitReached||o.remaining<=0,l=a=>{const d=String(a||"bank_transfer").toLowerCase();return d.includes("mobile")||d.includes("bkash")||d.includes("nagad")||d.includes("mfs")?"Mobile Banking (MFS)":d.includes("bank")||d.includes("wire")?"Bank Transfer / Wire":d.includes("card")?"Credit / Debit Card":d.includes("cash")?"Cash / Cheque":d.includes("online")?"Online Banking":d.replace(/_/g," ").replace(/\b\w/g,f=>f.toUpperCase())};t.innerHTML=`
      ${s}
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E3E9EF]">
          <div>
            <h3 class="text-sm font-black text-[#172B36] flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-[#087F70]"></i>
              <span>Transaction History</span>
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Verified financial transactions and electronic receipts</p>
          </div>
          <span class="text-xs font-semibold text-slate-500">${e.length} Records</span>
        </div>

        <!-- Mobile Cards View -->
        <div class="md:hidden space-y-3">
          ${e.map(a=>{const d=a.payment_date||a.paymentDate||"N/A",f=a.service_name||a.serviceName||a.serviceProvided||"Agency Retainer Service",p=l(a.payment_method||a.paymentMethod),m=D(a.amount_cents||a.amountCents||0,a.currency||"USD"),x=a.receipt_number||a.receiptNumber||"RCPT-1001";return`
              <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <span class="text-[10px] font-mono font-bold text-[#087F70]">${y(d)}</span>
                    <h4 class="text-xs font-bold text-[#172B36] truncate mt-0.5">${y(f)}</h4>
                    <span class="text-[11px] text-slate-500">${y(p)}</span>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-sm font-mono font-black text-[#172B36]">${m}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-100">
                  <button type="button" class="btn-download-receipt w-full py-2.5 rounded-xl ${r?"bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200":"bg-[#087F70] hover:bg-[#066559] active:bg-[#055046] text-white shadow-xs cursor-pointer"} text-xs font-bold flex items-center justify-center gap-2 transition-all" data-id="${a.id}" data-receipt="${x}" ${r?'disabled title="Daily download limit reached."':'title="Download Receipt"'}>
                    <i class="fa-solid ${r?"fa-lock":"fa-file-arrow-down"} text-xs"></i>
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            `}).join("")}
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block rounded-3xl bg-white border border-[#E3E9EF] overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600 min-w-[700px]">
              <thead class="bg-slate-50/80 border-b border-[#E3E9EF] text-[11px] uppercase font-bold text-slate-500">
                <tr>
                  <th class="p-4">Date</th>
                  <th class="p-4">Service Provided</th>
                  <th class="p-4">Payment Method</th>
                  <th class="p-4">Amount</th>
                  <th class="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E3E9EF]">
                ${e.map(a=>{const d=a.payment_date||a.paymentDate||"N/A",f=a.service_name||a.serviceName||a.serviceProvided||"Agency Retainer Service",p=l(a.payment_method||a.paymentMethod),m=D(a.amount_cents||a.amountCents||0,a.currency||"USD"),x=a.receipt_number||a.receiptNumber||"RCPT-1001";return`
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-4 font-mono font-medium text-slate-600">${y(d)}</td>
                      <td class="p-4">
                        <div class="font-bold text-[#172B36]">${y(f)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">Receipt Ref: ${y(x)}</div>
                      </td>
                      <td class="p-4 text-slate-600 font-medium">${y(p)}</td>
                      <td class="p-4 font-mono font-black text-[#172B36]">${m}</td>
                      <td class="p-4 text-right">
                        <button type="button" class="btn-download-receipt inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${r?"bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200":"bg-[#087F70] hover:bg-[#066559] active:bg-[#055046] text-white shadow-xs cursor-pointer"} text-xs font-bold transition-all" data-id="${a.id}" data-receipt="${x}" ${r?'disabled title="Daily download limit reached."':'title="Download Receipt"'}>
                          <i class="fa-solid ${r?"fa-lock":"fa-file-arrow-down"} text-xs"></i>
                          <span>Download Receipt</span>
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,t.querySelectorAll(".btn-download-receipt").forEach(a=>{a.addEventListener("click",()=>{Te(a.dataset.id,a.dataset.receipt,a)})})}async function Te(t,n,e){const s=i.receiptQuota||W();if(s.isLimitReached||s.remaining<=0){b("Daily download limit reached.","error");return}if(i.cif&&!i.cif.isComplete){I("profile"),b("Please complete your Profile (CIF) before downloading receipts.","error");return}const o=e?e.innerHTML:"";e&&(e.disabled=!0,e.setAttribute("data-loading","true"),e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin text-xs mr-1.5"></i><span>Preparing Invoice...</span>');try{const r=`whiz_rcpt_${n}_${Date.now()}`,l=await _("/pdf/authorize-receipt",{method:"POST",body:JSON.stringify({paymentId:t,receiptNumber:n,idempotencyKey:r})});if(!l.ok||!l.data||!l.data.success){if(l.data?.code==="DAILY_QUOTA_EXCEEDED"){b("Daily download limit reached.","error"),i.receiptQuota={...s,remaining:0,isLimitReached:!0},R();return}if(l.data?.code==="CIF_INCOMPLETE"){I("profile"),b(l.data.error||"Please complete your Profile before downloading invoices.","error");return}throw new Error(l.data?.error||"Failed to authorize invoice download.")}l.data.quota&&(i.receiptQuota=l.data.quota,Ae());const a=l.data.data;let d;if(window.WhizDocumentPdf&&typeof window.WhizDocumentPdf.compileWhizDocumentPdf=="function")d=await window.WhizDocumentPdf.compileWhizDocumentPdf(a);else if(typeof window.compileWhizDocumentPdf=="function")d=await window.compileWhizDocumentPdf(a);else throw new Error("PDF Engine not loaded. Please refresh the page.");const f=new Blob([d],{type:"application/pdf"}),p=a.invoiceNumber||n||"OFFICIAL",m=`WhizStudio_Invoice_${p}.pdf`,x=URL.createObjectURL(f),u=document.createElement("a");u.href=x,u.download=m,document.body.appendChild(u),u.click(),u.remove(),URL.revokeObjectURL(x),b(`Invoice ${p} generated and downloaded successfully!`,"success")}catch(r){console.error("Receipt download error:",r),b(r.message||"Failed to generate receipt PDF.","error")}finally{e&&(e.innerHTML=o,e.disabled=!1,e.removeAttribute("data-loading")),R()}}function je(){const t=document.getElementById("modalDocumentPreview");t&&t.classList.add("hidden");const n=document.getElementById("previewDocIframe");n&&(n.src="about:blank")}let be=0;async function ve(){const t=document.getElementById("clientAuthGuard"),n=document.getElementById("clientMainLayout"),e=new URLSearchParams(window.location.search);if(e.get("preview")==="1"||e.get("preview")==="true"||e.get("demo")==="1"||window.self!==window.top&&e.get("preview")!=="0"){i.isPreview=!0;const o=window.__whizClientMock?window.__whizClientMock.data||(typeof window.__whizClientMock.getData=="function"?window.__whizClientMock.getData():null):null,r=o&&o.user||{id:"usr_client_01",fullName:"Sarah Jenkins",full_name:"Sarah Jenkins",email:"sarah@apexglobal.io",username:"sarahjenkins",role:"client",companyName:"Apex Global Inc.",company_name:"Apex Global Inc.",phone:"+1 (555) 349-2041",city:"San Francisco",country:"United States"};i.currentUser=r,i.clientProfile=r;const l=r.fullName,a=r.email;document.querySelectorAll(".client-greeting-name").forEach(m=>m.textContent=l),document.querySelectorAll(".clientDisplayName").forEach(m=>m.textContent=l),document.querySelectorAll(".clientDisplayEmail").forEach(m=>m.textContent=a),z();const d=l.split(" ").map(m=>m[0]).join("").slice(0,2).toUpperCase()||"SJ";document.querySelectorAll(".userAvatarText").forEach(m=>m.textContent=d);const f=document.getElementById("settingsEmail");f&&(f.textContent=a);const p=document.getElementById("settingsAuthStatus");p&&(p.innerHTML='<i class="fa-solid fa-shield-check text-[#087F70]"></i> Verified (Google & Email SSO)'),t&&t.classList.add("hidden"),n&&n.classList.remove("hidden");try{await ge()}catch(m){console.warn("loadCifProfile non-fatal:",m)}try{G(i.cif||i.clientProfile)}catch(m){console.warn("Non-fatal profile form population warning:",m)}I("overview"),T();return}if(!window.Clerk){if(be++,be>50){console.error("Clerk SDK load timeout in client dashboard"),t&&(t.innerHTML=`
            <div class="mb-5 flex items-center justify-center">
              <img src="/assets/images/whiz-logo-v2.png?v=202611" alt="Whiz Studio" class="h-12 w-auto object-contain">
            </div>
            <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Authentication Service Unavailable</h2>
            <p class="text-xs text-rose-500 mt-2 max-w-sm">Unable to connect to secure authentication services. Please verify your internet connection or disable tracking blockers.</p>
            <div class="mt-5 flex items-center justify-center gap-3">
              <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry Connection</button>
              <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
            </div>
          `);return}setTimeout(ve,100);return}try{window.Clerk.loaded||await Promise.race([window.Clerk.load({publishableKey:Le}),new Promise((g,w)=>setTimeout(()=>w(new Error("Authentication system connection timeout")),8e3))]);const o=window.Clerk.user;if(!o){window.location.href="/?login=client";return}i.currentUser=o;const r=await _("/portal/me");r.ok&&r.data&&r.data.success&&r.data.data&&(i.clientProfile=r.data.data.user);const l=i.clientProfile?.fullName||i.clientProfile?.full_name||o.fullName||o.username||"Client",a=(i.clientProfile?.email||(o.primaryEmailAddress?o.primaryEmailAddress.emailAddress:"")).toLowerCase();document.querySelectorAll(".client-greeting-name").forEach(g=>g.textContent=l),document.querySelectorAll(".clientDisplayName").forEach(g=>g.textContent=l),document.querySelectorAll(".clientDisplayEmail").forEach(g=>g.textContent=a),z();const d=document.getElementById("settingsEmail");d&&(d.textContent=a);const f=document.getElementById("settingsAuthStatus");f&&(f.innerHTML='<i class="fa-solid fa-shield-check text-[#147D64]"></i> Verified (Google & Email SSO)');try{Fe()}catch(g){console.warn("Non-fatal settings view population warning:",g)}try{await ge()}catch(g){console.warn("loadCifProfile non-fatal:",g)}try{G(i.cif||i.clientProfile)}catch(g){console.warn("Non-fatal profile form population warning:",g)}const p=l.split(" ").map(g=>g[0]).join("").slice(0,2).toUpperCase()||"CL";document.querySelectorAll(".userAvatarText").forEach(g=>g.textContent=p);const m=(i.clientProfile?.role||"").toLowerCase(),x=!!(i.clientProfile?.isSuperAdmin||m==="super_admin"||m==="owner"||a==="kaziaremon@gmail.com");if(!!(i.clientProfile?.isStaff||x||m==="admin"||m==="owner"||m==="super_admin")){if(!(new URLSearchParams(window.location.search).get("preview")==="true")){console.log("[Route Guard] Administrative user accessed client portal. Redirecting to admin dashboard..."),window.location.replace("/admin/dashboard/");return}const B=document.getElementById("adminPortalLinkContainer");B&&B.classList.remove("hidden");const F=document.getElementById("mobileAdminPortalLinkContainer");F&&F.classList.remove("hidden")}t&&t.classList.add("hidden"),n&&n.classList.remove("hidden"),I("overview"),T()}catch(o){console.error("Client Auth Guard Error:",o),t&&(t.innerHTML=`
          <div class="mb-5 flex items-center justify-center">
            <img src="/assets/images/whiz-logo-v2.png?v=202611" alt="Whiz Studio" class="h-12 w-auto object-contain">
          </div>
          <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Workspace Initialization Failed</h2>
          <p class="text-xs text-rose-500 mt-2 max-w-sm">${y(o.message||"An unexpected error occurred while preparing your workspace.")}</p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry</button>
            <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
          </div>
        `)}}async function te(){const t=document.getElementById("clientSupportTicketsContainer");if(t)try{const n=await _("/portal/support/my");if(n.ok&&n.data){const e=Array.isArray(n.data.data)?n.data.data:[];Me(e)}else t.innerHTML='<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests found.</div>'}catch(n){console.error("loadClientSupportTickets error:",n),t.innerHTML='<div class="p-6 rounded-2xl bg-rose-50 text-center text-xs text-rose-500 font-medium">Failed to load support requests.</div>'}}function Me(t){const n=document.getElementById("clientSupportTicketsContainer");if(!n)return;if(!t||t.length===0){n.innerHTML='<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests submitted yet. Use the form above to reach our team.</div>';return}const e={open:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">Open</span>',in_progress:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>',resolved:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>',closed:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">Closed</span>'};n.innerHTML=t.map(s=>{const o=s.created_at?new Date(s.created_at).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}):"N/A",r=e[s.status]||e.open;return`
        <div class="p-4 rounded-2xl bg-slate-50 border border-[#E3E9EF] space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-[#172B36]">${y(s.subject)}</span>
            ${r}
          </div>
          <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">${y(s.message)}</p>
          ${s.admin_notes?`
            <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 mt-2 space-y-1">
              <div class="font-bold text-[10px] uppercase tracking-wider text-emerald-700">Team Response / Notes:</div>
              <div>${y(s.admin_notes)}</div>
            </div>
          `:""}
          <div class="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <span>Ticket: ${y(s.id)}</span>
            <span>Submitted: ${y(o)}</span>
          </div>
        </div>
      `}).join("")}async function he(t=!1){const n=document.getElementById("clientContentCalContainer"),e=document.getElementById("btnRefreshClientContentCal");if(e){const o=e.querySelector("i");o&&o.classList.add("fa-spin")}const s=(i.currentUser?.email||i.clientProfile?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||"").toLowerCase().trim();if(n)try{const o=s?`?email=${encodeURIComponent(s)}`:"",r=await _(`/api/client/content-calendar${o}`);r.ok&&r.data?.success?(i.clientContentFolders=r.data.folders||[],J(),t&&b("Content calendar updated.","success")):(i.clientContentFolders=[],J())}catch(o){console.error("Error loading client content calendar:",o),n.innerHTML=`
        <div class="p-8 rounded-2xl bg-white border border-[#E6ECE9] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-500 block mb-1"></i>
          <p>Unable to load content calendar at this time.</p>
        </div>
      `}finally{if(e){const o=e.querySelector("i");o&&o.classList.remove("fa-spin")}}}function J(t=null){const n=document.getElementById("clientContentCalContainer");if(!n)return;const e=i.clientContentFolders||[];if(e.length===0){n.innerHTML=`
        <div class="p-12 rounded-3xl bg-white border border-[#E6ECE9] text-center space-y-3.5 shadow-2xs">
          <div class="w-14 h-14 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center mx-auto text-2xl shadow-2xs">
            <i class="fa-solid fa-calendar-xmark"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-base text-[#172B36]">No Content Calendar Published</h4>
            <p class="text-xs text-[#74817D] max-w-sm mx-auto leading-relaxed">
              Your content calendar has not been uploaded yet or is currently being prepared by the Whiz Studio team.
            </p>
          </div>
        </div>
      `;return}if(t){const s=e.find(o=>o.id===t);if(s){we(s,e.length>1);return}}if(e.length===1){we(e[0],!1);return}n.innerHTML=`
      <div class="space-y-5">
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E6ECE9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-[#172B36] tracking-tight">Active Deliverable Retainers</h3>
            <p class="text-xs text-[#74817D] mt-0.5">Select a service retainer below to view its scheduled publication titles.</p>
          </div>
          <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 shrink-0 self-start sm:self-auto">
            ${e.length} Service Retainers
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${e.map(s=>{const o=(s.items||[]).length,r=s.created_at?new Date(s.created_at).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}):"Recently";return`
              <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E6ECE9] shadow-2xs hover:border-[#087F70]/40 hover:shadow-xs transition-all flex flex-col justify-between gap-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="w-10 h-10 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center text-base shrink-0 shadow-2xs">
                      <i class="fa-solid fa-folder-closed"></i>
                    </span>
                    <span class="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20">
                      ${o} Deliverable${o===1?"":"s"}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-sm font-bold text-[#172B36] line-clamp-1">
                      ${y(s.service_name||"Content Retainer")}
                    </h4>
                    <p class="text-xs text-[#74817D] mt-0.5">
                      Updated ${y(r)}
                    </p>
                  </div>
                </div>

                <div class="pt-3 border-t border-[#E6ECE9] flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-[#74817D]">
                    ${y(s.company_name||"Client Workspace")}
                  </span>
                  <button type="button" class="btn-open-client-folder px-3 py-1.5 rounded-xl text-xs font-bold bg-[#087F70] text-white hover:bg-[#066155] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs" data-folder-id="${y(s.id)}">
                    <span>View Calendar</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            `}).join("")}
        </div>
      </div>
    `,n.querySelectorAll(".btn-open-client-folder").forEach(s=>{s.addEventListener("click",()=>{const o=s.dataset.folderId;o&&J(o)})})}function we(t,n=!1){const e=document.getElementById("clientContentCalContainer");if(!e)return;const s=t.items||[],o=s.length;e.innerHTML=`
      <div class="space-y-5">
        <!-- Service Header & Navigation -->
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E6ECE9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1.5">
            ${n?`
              <button type="button" id="btnBackToClientFolders" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F70] hover:text-[#066155] transition-colors cursor-pointer mb-1">
                <i class="fa-solid fa-arrow-left text-[10px]"></i>
                <span>Back to All Services</span>
              </button>
            `:""}
            <div class="flex flex-wrap items-center gap-2.5">
              <h3 class="text-lg font-bold text-[#172B36] tracking-tight">
                ${y(t.service_name||"Content Retainer")}
              </h3>
              <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20">
                ${o} Deliverable${o===1?"":"s"}
              </span>
            </div>
            <p class="text-xs text-[#74817D]">
              ${y(t.company_name||"Client")} \u2022 Title-Only Publication Schedule
            </p>
          </div>
        </div>

        <!-- Titles List -->
        ${o===0?`
          <div class="p-10 rounded-2xl bg-white border border-[#E6ECE9] text-center space-y-2">
            <i class="fa-solid fa-file-circle-check text-2xl text-slate-300 block"></i>
            <p class="text-xs text-[#74817D]">No content items currently scheduled for this service.</p>
          </div>
        `:`
          <div class="space-y-2.5">
            ${s.map(r=>{const l=r.serial_number||1,a=r.title||`Content ${l}`;return`
                <div class="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#E6ECE9] shadow-2xs hover:border-[#087F70]/30 transition-all flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
                      #${l}
                    </span>
                    <div class="min-w-0">
                      <h4 class="text-xs sm:text-sm font-bold text-[#172B36] truncate leading-snug">
                        ${y(a)}
                      </h4>
                      <p class="text-[10px] text-[#74817D] mt-0.5">
                        Scheduled Editorial Post
                      </p>
                    </div>
                  </div>

                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F7FAF9] text-[#087F70] border border-[#E6ECE9] shrink-0">
                    <i class="fa-solid fa-circle-check text-[9px] text-[#087F70]"></i>
                    Approved Title
                  </span>
                </div>
              `}).join("")}
          </div>
        `}
      </div>
    `,n&&document.getElementById("btnBackToClientFolders")?.addEventListener("click",()=>{J(null)})}function Ee(){const t=(window.location.hash||"").replace("#","").trim();if(t){const c=t==="content-calendar"?"content_calendar":t;["overview","services","tasks","finance","reviews","profile","support","settings","content_calendar"].includes(c)&&I(c,!1)}window.addEventListener("hashchange",()=>{const c=(window.location.hash||"").replace("#","").trim(),v=c==="content-calendar"?"content_calendar":c;["overview","services","tasks","finance","reviews","profile","support","settings","content_calendar"].includes(v)&&I(v,!1)}),document.querySelectorAll("[data-client-tab]").forEach(c=>{c.addEventListener("click",()=>{I(c.dataset.clientTab);const v=document.getElementById("clientMobileDrawer"),E=document.getElementById("clientMobileBackdrop");v&&E&&(v.classList.add("-translate-x-full"),E.classList.add("hidden"))})});const n=document.getElementById("clientMobileToggleBtn"),e=document.getElementById("clientMobileCloseBtn"),s=document.getElementById("clientMobileDrawer"),o=document.getElementById("clientMobileBackdrop");function r(){s&&o&&(s.classList.remove("-translate-x-full"),o.classList.remove("hidden"),document.body.classList.add("overflow-hidden"))}function l(){s&&o&&(s.classList.add("-translate-x-full"),o.classList.add("hidden"),document.body.classList.remove("overflow-hidden"))}n&&n.addEventListener("click",r),e&&e.addEventListener("click",l),o&&o.addEventListener("click",l),s&&s.querySelectorAll("[data-client-tab]").forEach(c=>{c.addEventListener("click",l)});const a=document.getElementById("clientUserMenuBtn"),d=document.getElementById("clientUserAccountDropdown"),f=document.getElementById("clientUserMenuChevron");function p(){if(!d)return;d.classList.contains("hidden")?(d.classList.remove("hidden"),f&&f.classList.add("rotate-180"),a&&a.setAttribute("aria-expanded","true")):m()}function m(){d&&(d.classList.add("hidden"),f&&f.classList.remove("rotate-180"),a&&a.setAttribute("aria-expanded","false"))}a&&a.addEventListener("click",c=>{c.stopPropagation(),p()}),document.addEventListener("click",c=>{d&&!d.classList.contains("hidden")&&!d.contains(c.target)&&!a?.contains(c.target)&&m()}),document.addEventListener("keydown",c=>{c.key==="Escape"&&(m(),l())}),document.querySelectorAll(".client-dropdown-account-link, .client-dropdown-tab-link").forEach(c=>{c.addEventListener("click",()=>{m();const v=c.dataset.clientAction,E=c.dataset.tab;v?I("settings"):E&&I(E)})}),document.getElementById("btnRefreshClientDashboardMobile")?.addEventListener("click",async()=>{const c=document.getElementById("btnRefreshClientIconMobile");c&&c.classList.add("fa-spin");try{await T(),b("Portal synchronized successfully.","success")}catch{b("Failed to refresh data.","error")}finally{c&&c.classList.remove("fa-spin")}}),document.querySelectorAll(".btn-client-signout").forEach(c=>{c.addEventListener("click",async()=>{i.refreshIntervalId&&clearInterval(i.refreshIntervalId),document.cookie="whiz_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure";try{localStorage.removeItem("whiz_last_role"),sessionStorage.clear()}catch{}window.Clerk&&await window.Clerk.signOut(),window.location.replace("/")})}),document.getElementById("btnRequestProfileUpdate")?.addEventListener("click",()=>{I("support");const c=document.querySelector('#supportRequestForm input[name="subject"]');c&&(c.value=`Profile Information Update Request  -  ${i.currentUser?.fullName||"Client"}`);const v=document.querySelector('#supportRequestForm textarea[name="message"]');v&&(v.value=`Please describe the profile fields you would like our administrative team to update (e.g. phone, address, legal entity, tax ID):

- Field to update:
- New value:
- Reason:`,v.focus())}),document.getElementById("supportRequestForm")?.addEventListener("submit",async c=>{c.preventDefault();const v=c.target,E=v.subject.value.trim(),C=v.message.value.trim(),k=document.getElementById("btnSubmitClientSupport");if(!E||!C){b("Please enter both subject and message.","warn");return}O(k,!0,"Sending...");const h=await _("/portal/support/submit",{method:"POST",body:JSON.stringify({subject:E,message:C,email:i.currentUser?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||"",fullName:i.currentUser?.fullName||window.Clerk?.user?.fullName||""})});O(k,!1),h.ok&&h.data?.success?(b("Support request submitted successfully! Our team will review it shortly.","success"),v.reset(),te()):b(h.data?.error||"Failed to submit request.","error")}),document.getElementById("btnRefreshClientSupport")?.addEventListener("click",()=>{te(),b("Support history refreshed.","info")}),document.getElementById("btnRefreshClientContentCal")?.addEventListener("click",()=>{he(!0)}),document.getElementById("btnRefreshClientDashboard")?.addEventListener("click",async()=>{const c=document.getElementById("btnRefreshClientIcon");c&&c.classList.add("fa-spin");try{await T(),b("Dashboard synchronized successfully.","success")}catch{b("Failed to refresh data.","error")}finally{c&&c.classList.remove("fa-spin")}}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&!i.isRefreshing&&i.currentUser&&T(!0)}),window.addEventListener("focus",()=>{!i.isRefreshing&&i.currentUser&&T(!0)}),i.refreshIntervalId&&clearInterval(i.refreshIntervalId),i.refreshIntervalId=setInterval(()=>{document.visibilityState==="visible"&&!i.isRefreshing&&i.currentUser&&T(!0)},25e3);const x=document.getElementById("formClientProfile");x&&(x.addEventListener("submit",pe),x.querySelectorAll("input, select, textarea").forEach(c=>{c.addEventListener("input",Z)}));const u=document.getElementById("btnSaveClientProfile");u&&u.addEventListener("click",pe),document.getElementById("btnCloseProfileRequiredModal")?.addEventListener("click",()=>{document.getElementById("modalProfileRequired")?.classList.add("hidden")});const g=document.getElementById("btnOpenPasswordModal"),w=document.getElementById("modalClientPassword"),B=document.getElementById("btnClosePasswordModal"),F=document.getElementById("btnCancelPasswordModal"),Y=document.getElementById("formClientPassword"),Ce=document.getElementById("btnOpenClerkSecurityProfile");g&&g.addEventListener("click",()=>{ee();const c=document.getElementById("passwordErrorMsg");c&&c.classList.add("hidden"),Y&&Y.reset(),w?.classList.remove("hidden")});const ne=()=>{w?.classList.add("hidden")};B&&B.addEventListener("click",ne),F&&F.addEventListener("click",ne),Ce&&Ce.addEventListener("click",()=>{window.Clerk&&typeof window.Clerk.openUserProfile=="function"?window.Clerk.openUserProfile():b("Clerk User Profile is loading. Please try again.","info")}),Y&&Y.addEventListener("submit",async c=>{c.preventDefault();const v=window.Clerk?.user;if(!v){b("Authentication session not loaded.","error");return}const E=document.getElementById("inputCurrentPassword"),C=document.getElementById("inputNewPassword"),k=document.getElementById("inputConfirmPassword"),h=document.getElementById("passwordErrorMsg"),M=document.getElementById("btnSubmitPassword"),j=E?E.value:"",S=C?C.value:"",A=k?k.value:"";if(h&&h.classList.add("hidden"),S.length<8){h&&(h.textContent="New password must be at least 8 characters.",h.classList.remove("hidden"));return}if(S!==A){h&&(h.textContent="Passwords do not match. Please verify.",h.classList.remove("hidden"));return}M&&(M.disabled=!0,M.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...');try{if(!!v.passwordEnabled){if(!j)throw new Error("Please enter your current password.");await v.updatePassword({currentPassword:j,newPassword:S,signOutOfOtherSessions:!1}),b("Account password changed successfully!","success")}else await v.createPassword({newPassword:S,signOutOfOtherSessions:!1}),b("Account password set successfully! You can now log in with email/password.","success");ne(),ee()}catch(P){console.error("Password operation error:",P);const $=P?.errors?.[0]?.message||P.message||"Failed to update password.";h?(h.textContent=$,h.classList.remove("hidden")):b($,"error")}finally{M&&(M.disabled=!1,M.innerHTML='<i class="fa-solid fa-check"></i> <span id="btnSubmitPasswordText">Save Password</span>')}});function Re(){const c=document.getElementById("clientReviewStarGroup"),v=document.getElementById("clientReviewRatingVal"),E=document.getElementById("clientReviewRatingLabel"),C=document.getElementById("clientReviewForm"),k=document.getElementById("clientReviewName"),h=document.getElementById("btnRefreshClientReviews"),M={1:"1 Star - Unsatisfactory",2:"2 Stars - Needs Improvement",3:"3 Stars - Satisfactory",4:"4 Stars - Great Results",5:"5 Stars - Outstanding"};function j(S){if(!c)return;c.querySelectorAll(".client-star-btn").forEach(P=>{Number(P.dataset.rating)<=S?(P.textContent="\u2605",P.className="client-star-btn text-2xl text-amber-400 focus:outline-none hover:scale-110 transition-transform"):(P.textContent="\u2606",P.className="client-star-btn text-2xl text-slate-300 focus:outline-none hover:scale-110 transition-transform")}),v&&(v.value=S),E&&(E.textContent=M[S]||`${S} Stars`)}c&&c.querySelectorAll(".client-star-btn").forEach(S=>{S.addEventListener("click",()=>{const A=Number(S.dataset.rating)||5;j(A)})}),k&&!k.value&&(k.value=i.currentUser?.fullName||window.Clerk?.user?.fullName||""),C&&C.addEventListener("submit",async S=>{S.preventDefault();const A=S.target,P=A.clientName.value.trim()||i.currentUser?.fullName||window.Clerk?.user?.fullName||"Verified Client",$=A.role?.value.trim()||"Verified Client",Se=A.service?.value.trim()||"Digital Marketing Retainer",Ie=Number(A.rating?.value)||5,ae=A.reviewText?.value.trim(),ie=document.getElementById("btnSubmitClientReview");if(!ae){b("Please enter your review feedback.","warn");return}O(ie,!0,"Submitting...");try{const oe=await fetch("/api/submit-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientName:P,reviewText:ae,rating:Ie,service:Se,role:$,email:i.currentUser?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||""})}),re=await oe.json();if(O(ie,!1),oe.ok&&re.success){b("Review submitted securely! Dispatched to moderation queue.","success");const Be=`whiz_client_reviews_${i.currentUser?.email||"anon"}`;let le=[];try{le=JSON.parse(localStorage.getItem(Be)||"[]")}catch{}le.unshift({id:re.id||`rev_${Date.now()}`,clientName:P,role:$,service:Se,rating:Ie,reviewText:ae,moderation_status:"pending",timestamp:new Date().toISOString()}),localStorage.setItem(Be,JSON.stringify(le)),A.reset(),j(5),k&&(k.value=i.currentUser?.fullName||window.Clerk?.user?.fullName||""),se()}else b(re.error||"Failed to submit review.","error")}catch{O(ie,!1),b("Network error while submitting review.","error")}}),h&&h.addEventListener("click",()=>{se(),b("Review submissions updated.","info")}),se()}function se(){const c=document.getElementById("clientReviewsHistoryContainer");if(!c)return;const v=`whiz_client_reviews_${i.currentUser?.email||"anon"}`;let E=[];try{E=JSON.parse(localStorage.getItem(v)||"[]")}catch{}if(E.length===0){c.innerHTML=`
          <div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">
            No previous review submissions recorded for this account.
          </div>
        `;return}c.innerHTML=E.map(C=>{const k=C.timestamp?new Date(C.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Recently",h="\u2605".repeat(Math.min(5,Math.max(1,C.rating)))+"\u2606".repeat(5-Math.min(5,Math.max(1,C.rating)));return`
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#E3E9EF] space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span class="text-xs font-bold text-[#172B36]">${y(C.service||"Growth Service")}</span>
                <span class="text-[11px] text-slate-500 block">${k}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-amber-400 text-sm tracking-wider">${h}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  <i class="fa-solid fa-clock mr-1"></i>Moderation Queue
                </span>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">${y(C.reviewText)}</p>
          </div>
        `}).join("")}window.addEventListener("storage",c=>{c.key==="whiz_synced_ledger_records"&&T(!0),c.key==="whiz_invoice_daily_rate_limit"&&R()}),de(),Re(),ve()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ee):Ee()})();
