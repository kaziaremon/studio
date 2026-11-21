(function(){"use strict";const Be=window.__CLERK_PUBLISHABLE_KEY__||"pk_live_Y2xlcmsud2hpenN0dWRpby5hcnQk",Le="https://whiz-api.kaziaremon.workers.dev/api/v1",ke={BDT:{symbol:"\u09F3",name:"Bangladeshi Taka",locale:"bn-BD",decimals:2},USD:{symbol:"$",name:"US Dollar",locale:"en-US",decimals:2},GBP:{symbol:"\xA3",name:"British Pound",locale:"en-GB",decimals:2},EUR:{symbol:"\u20AC",name:"Euro",locale:"de-DE",decimals:2},AED:{symbol:"AED",name:"UAE Dirham",locale:"ar-AE",decimals:2},SAR:{symbol:"SAR",name:"Saudi Riyal",locale:"ar-SA",decimals:2},CAD:{symbol:"CA$",name:"Canadian Dollar",locale:"en-CA",decimals:2},AUD:{symbol:"A$",name:"Australian Dollar",locale:"en-AU",decimals:2},SGD:{symbol:"S$",name:"Singapore Dollar",locale:"en-SG",decimals:2},INR:{symbol:"\u20B9",name:"Indian Rupee",locale:"en-IN",decimals:2},JPY:{symbol:"\xA5",name:"Japanese Yen",locale:"ja-JP",decimals:0},MYR:{symbol:"RM",name:"Malaysian Ringgit",locale:"ms-MY",decimals:2}};function D(t,n="USD"){const e=(n||"USD").toUpperCase(),s=ke[e]||{symbol:e,locale:"en-US",decimals:2},o=s.decimals===0?1:100,l=(Number(t)||0)/o;try{return new Intl.NumberFormat(s.locale,{style:"currency",currency:e,minimumFractionDigits:s.decimals,maximumFractionDigits:s.decimals}).format(l)}catch{return s.symbol+l.toFixed(s.decimals)}}function b(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}let B=null,N=null,Y=null;function Pe(){let t=document.getElementById("whizGlassSelectPortal");return t?(t.style.zIndex="10005",t.style.pointerEvents="none"):(t=document.createElement("div"),t.id="whizGlassSelectPortal",t.className="whiz-glass-portal-root",t.setAttribute("aria-hidden","true"),t.style.cssText="position:fixed;top:0;left:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:10005;",document.body.appendChild(t)),t}function q(t,n){if(!t||!n)return;const e=t.getBoundingClientRect(),s=window.innerHeight,o=n.offsetHeight||240,l=s-e.bottom-12,r=e.top-12,i=l<o&&r>l;let d=i?e.top-o-6:e.bottom+6,g=e.width||t.offsetWidth||240,f=Math.max(8,Math.min(e.left,window.innerWidth-g-8)),m=i?Math.max(160,Math.min(280,r)):Math.max(160,Math.min(280,l));n.classList.toggle("dropup",i),n.style.position="fixed",n.style.top=Math.round(d)+"px",n.style.left=Math.round(f)+"px",n.style.width=Math.round(g)+"px",n.style.maxHeight=Math.round(m)+"px",n.style.zIndex="10010",n.style.pointerEvents="auto"}function H(){if(!B)return;const t=B,n=N,e=Y;t.classList.remove("open","dropup"),t.style.display="none",n?.classList.remove("active"),n?.setAttribute("aria-expanded","false"),e&&t.parentNode!==e&&e.appendChild(t),t.style.position="",t.style.top="",t.style.left="",t.style.width="",t.style.maxHeight="",t.style.zIndex="",t.style.pointerEvents="",B=null,N=null,Y=null}function le(){document.querySelectorAll("[data-glass-select]").forEach(n=>{const e=n.querySelector("select"),s=n.querySelector(".glass-select-trigger"),o=n.querySelector(".glass-select-menu")||document.getElementById("whizGlassSelectPortal")?.querySelector('[id="'+n.dataset.glassSelect+'Menu"]'),l=s?.querySelector(".select-label"),r=s?.querySelector(".select-icon");if(!s||!o)return;const i=()=>Array.from(o.querySelectorAll(".glass-select-option"));if(n.dataset.glassInitialized==="true"){const f=e?.value||"";i().forEach(x=>{const u=x.dataset.value===f;if(x.classList.toggle("selected",u),x.setAttribute("aria-selected",u?"true":"false"),u){if(l){const I=x.querySelector(".select-opt-text")?.textContent||x.querySelector("span:not(.currency-badge)")?.textContent||x.querySelector("span")?.textContent||x.textContent.trim();l.textContent=I}const p=s.querySelector(".select-currency-symbol"),w=x.querySelector(".currency-badge");p&&w&&(p.textContent=w.textContent)}});return}n.dataset.glassInitialized="true";function d(f,m=!0){e&&(e.value=f),i().forEach(u=>{const p=u.dataset.value===f;if(u.classList.toggle("selected",p),u.setAttribute("aria-selected",p?"true":"false"),p){if(l){const L=u.querySelector(".select-opt-text")?.textContent||u.querySelector("span:not(.currency-badge)")?.textContent||u.querySelector("span")?.textContent||u.textContent.trim();l.textContent=L}const w=s.querySelector(".select-currency-symbol"),I=u.querySelector(".currency-badge");w&&I&&(w.textContent=I.textContent)}}),m&&e&&e.dispatchEvent(new Event("change",{bubbles:!0}))}function g(f){(typeof f=="boolean"?f:o!==B||!o.classList.contains("open"))?(B&&B!==o&&H(),B=o,N=s,Y=n,Pe().appendChild(o),o.style.display="block",q(s,o),requestAnimationFrame(()=>{o.classList.add("open"),s.classList.add("active"),s.setAttribute("aria-expanded","true"),q(s,o);const u=i();(o.querySelector(".glass-select-option.selected")||u[0])?.focus()})):H()}s.addEventListener("click",f=>{f.preventDefault(),f.stopPropagation(),g()}),o.addEventListener("click",f=>{const m=f.target.closest(".glass-select-option");m&&(f.preventDefault(),f.stopPropagation(),d(m.dataset.value,!0),H(),s.focus())}),e&&(e.addEventListener("change",()=>{d(e.value,!1)}),e.value&&d(e.value,!1))})}document.addEventListener("click",t=>{B&&!B.contains(t.target)&&!N?.contains(t.target)&&H()}),window.addEventListener("resize",()=>{B&&N&&q(N,B)}),window.addEventListener("scroll",()=>{B&&N&&q(N,B)},{passive:!0,capture:!0});let Re=null;const a={currentUser:null,clientProfile:null,activeTab:"overview",services:[],projects:[],invoices:[],payments:[],finance:null,cif:null,receiptQuota:{used:0,max:2,remaining:2,isLimitReached:!1},overallProgress:0,organizations:[],selectedOrganizationId:null,completionChart:null,refreshIntervalId:null,isRefreshing:!1,clientContentFolders:[]};async function _(t,n={}){if(a.isPreview&&window.__whizClientMock)return window.__whizClientMock.handleRequest(t,n);const e={"Content-Type":"application/json",...n.headers||{}};if(a.selectedOrganizationId&&(e["X-Organization-Id"]=a.selectedOrganizationId),window.Clerk&&window.Clerk.session)try{const s=await window.Clerk.session.getToken();s&&(e.Authorization=`Bearer ${s}`)}catch(s){console.warn("Could not retrieve Clerk token:",s)}window.Clerk&&window.Clerk.user&&(e["X-Clerk-User-Id"]=window.Clerk.user.id);try{let s=t;t.startsWith("/api/")?s=window.location.protocol==="file:"||window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?`https://whizstudio.art${t}`:t:s=`${Le}${t}`;const o=await fetch(s,{...n,headers:e}),l=await o.json().catch(()=>({}));return{ok:o.ok,status:o.status,data:l}}catch(s){return console.error("API Fetch Error:",s),{ok:!1,status:500,data:{success:!1,error:"Network connection failure."}}}}function y(t,n="info"){const e=document.getElementById("clientGlobalToast");e&&e.remove();const s=document.createElement("div");s.id="clientGlobalToast";const o=n==="error"?"bg-white border-rose-400 text-[#172B36]":n==="success"?"bg-white border-emerald-400 text-[#172B36]":"bg-white border-[#E3E9EF] text-[#172B36]",l=n==="error"?"fa-triangle-exclamation text-rose-500":n==="success"?"fa-circle-check text-emerald-500":"fa-circle-info text-brand-whiz";s.className=`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-medium transition-all transform translate-y-2 opacity-0 ${o}`,s.innerHTML=`<i class="fa-solid ${l}"></i><span>${t}</span>`,document.body.appendChild(s),requestAnimationFrame(()=>{s.classList.remove("translate-y-2","opacity-0")}),setTimeout(()=>{s.classList.add("translate-y-2","opacity-0"),setTimeout(()=>s.remove(),300)},4e3)}function F(t){a.activeTab=t,["overview","services","tasks","finance","reviews","profile","support","settings","content_calendar"].forEach(r=>{const i=document.getElementById(`view_${r}`);i&&(r===t?i.classList.remove("hidden"):i.classList.add("hidden"))}),document.querySelectorAll("[data-client-tab]").forEach(r=>{const i=r.dataset.clientTab===t;if(r.closest("nav.lg\\:hidden"))i?(r.classList.add("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/25","shadow-2xs"),r.classList.remove("text-[#74817D]","border-transparent","font-semibold")):(r.classList.remove("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/25","shadow-2xs"),r.classList.add("text-[#74817D]","border-transparent","font-semibold"));else{const d=r.querySelector("i");i?(r.classList.add("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/20","shadow-2xs"),r.classList.remove("text-[#74817D]","border-transparent","font-medium","font-semibold"),d&&(d.classList.add("text-[#087F70]"),d.classList.remove("text-[#74817D]"))):(r.classList.remove("bg-[#EAF5F1]","text-[#087F70]","font-bold","border-[#087F70]/20","shadow-2xs"),r.classList.add("text-[#74817D]","border-transparent","font-semibold"),d&&(d.classList.remove("text-[#087F70]"),d.classList.add("text-[#74817D]")))}});const e={overview:"Campaign Overview",services:"My Active Services",tasks:"Deliverables Progress",finance:"Invoices",profile:"My Profile",support:"Support & Inquiries",settings:"Account Security",content_calendar:"Content Calendar"},s=document.getElementById("breadcrumbActiveTab");s&&(s.textContent=e[t]||t);const o=document.getElementById("clientSubheaderTitle");o&&(o.textContent=e[t]||t);const l=document.querySelector("main > div.overflow-y-auto");l&&(l.scrollTop=0),t==="profile"&&G(a.cif||a.clientProfile),t==="support"&&ee(),t==="overview"&&z(),t==="content_calendar"&&ve()}async function T(t=!1){a.isRefreshing=!0;try{const n=await _("/portal/client-overview");if(n.ok&&n.data&&n.data.success&&n.data.data){const e=n.data.data;a.services=Array.isArray(e.services)?e.services:Array.isArray(e.activeServices)?e.activeServices:[],a.projects=Array.isArray(e.projects)?e.projects:Array.isArray(e.activeProjects)?e.activeProjects:[],a.payments=e.recentPayments||e.payments||[],a.invoices=e.invoices||[],a.finance=e.finance||null,a.cif=e.cif||null,e.receiptQuota&&(a.receiptQuota=e.receiptQuota),K(),U(),R(),a.overallProgress=Math.round(Number(e.overallProgressPercent||0)),a.organizations=e.organizations||[],de(),ce(),ue(),xe()}else{const[e,s,o]=await Promise.all([_("/services/my-services"),_("/projects"),_("/finance/invoices")]);e.ok&&e.data&&e.data.data&&(a.services=e.data.data.services||e.data.data||[]),s.ok&&s.data&&s.data.data&&(a.projects=s.data.data.projects||s.data.data||[]),o.ok&&o.data&&o.data.data&&(a.invoices=o.data.data.invoices||[],a.payments=o.data.data.payments||[]),K(),de(),ce(),ue(),xe()}}catch(n){console.warn("Data preload notice:",n)}finally{a.isRefreshing=!1}}function K(){try{const t=localStorage.getItem("whiz_synced_ledger_records");if(!t)return;const n=JSON.parse(t);if(!Array.isArray(n)||n.length===0)return;n.forEach(e=>{const s=e.invoice_number||e.invoice_no;a.invoices.some(i=>e.id&&String(i.id)===String(e.id)||s&&(i.invoice_number===s||i.invoice_no===s))||a.invoices.unshift({id:e.id||"inv_"+Date.now(),invoice_number:s||"INV-2026-"+Math.floor(100+Math.random()*900),service_name:e.service_name||e.title||e.description||"Agency Retainer Service",serviceName:e.service_name||e.title||e.description||"Agency Retainer Service",issue_date:e.issue_date||e.payment_date||new Date().toISOString().split("T")[0],due_date:e.due_date||new Date(Date.now()+30*864e5).toISOString().split("T")[0],total_cents:e.total_cents||e.amount_cents||0,amount_paid_cents:e.amount_paid_cents||e.amount_cents||0,outstanding_balance_cents:e.outstanding_balance_cents!==void 0?e.outstanding_balance_cents:0,currency:e.currency||"USD",status:e.status||"paid",payment_method:e.payment_method||"Online",payment_reference:e.payment_reference||"LEDGER-VERIFIED",created_at:e.created_at||new Date().toISOString()});const l=e.receipt_number||e.receipt_no;a.payments.some(i=>e.id&&String(i.id)===String(e.id)||l&&(i.receipt_number===l||i.receipt_no===l))||a.payments.unshift({id:e.id||"pay_"+Date.now(),receipt_number:l||"RCPT-2026-"+Math.floor(100+Math.random()*900),receiptNumber:l||"RCPT-2026-"+Math.floor(100+Math.random()*900),amount_cents:e.amount_cents||e.total_cents||0,amountCents:e.amount_cents||e.total_cents||0,currency:e.currency||"USD",payment_date:e.payment_date||new Date().toISOString().split("T")[0],paymentDate:e.payment_date||new Date().toISOString().split("T")[0],payment_method:e.payment_method||"Online",paymentMethod:e.payment_method||"Online",payment_reference:e.payment_reference||"LEDGER-VERIFIED",invoice_number:s||" - ",created_at:e.created_at||new Date().toISOString()})})}catch(t){console.warn("[Ledger Sync] Failed to merge synced records:",t)}}function z(){const t=document.getElementById("clientOverviewGreetingTitle"),n=document.getElementById("clientOverviewGreetingSubtext");if(!t&&!n)return;const e=new Date().getHours();let s="Good Morning";e>=12&&e<17?s="Good Afternoon":(e>=17||e<4)&&(s="Good Evening");const o=a.clientProfile?.fullName||a.clientProfile?.full_name||a.cif?.fullName||a.currentUser?.firstName||a.currentUser?.fullName||window.Clerk?.user?.firstName||window.Clerk?.user?.fullName||"";let l="";if(o){const i=o.trim().split(/\s+/);l=i[0],["md","md.","mr","mr.","ms","ms.","dr","dr."].includes(l.toLowerCase())&&i.length>1&&(l=i[1])}else l="Client";l&&(l=l.charAt(0).toUpperCase()+l.slice(1).toLowerCase()),t&&(t.textContent=`${s}, ${l}!`);const r=["Welcome back! Let's achieve great things today.","Here is the latest snapshot of your project's progress.","Ready to see your business grow?","Your campaigns and operational deliverables are running smoothly.","Review your live milestones, verified deliverables, and invoices below.","enabling your brand with dedicated digital growth and execution."];if(n){const i=r[Math.floor(Math.random()*r.length)];n.textContent=i}}function de(){z();const t=document.getElementById("statActiveServices"),n=document.getElementById("statCompletedTasks"),e=document.getElementById("statInvoicesCount");if(t&&(t.textContent=a.services.length),n){const u=a.projects.reduce((I,L)=>I+(L.completedTasksCount||0),0),p=a.projects.reduce((I,L)=>I+(L.totalTasksCount||0),0);n.textContent=p>0?`${u} / ${p}`:`${u}`;const w=document.getElementById("statCompletedTasksSubtext");w&&(w.textContent=p>0?"Completed / Total Tasks":"Completed Tasks")}e&&(e.textContent=a.invoices.length);const s=document.getElementById("clientOverallProgressBadge");s&&(s.textContent=`${a.overallProgress}%`);const o=document.getElementById("statOverallProgressPercent");o&&(o.textContent=`${a.overallProgress}%`);const l=document.getElementById("chartClientCompletion"),r=document.getElementById("chartClientEmptyState");if(l){if(a.services.length===0)r&&r.classList.remove("hidden"),a.completionChart&&(a.completionChart.destroy(),a.completionChart=null);else if(r&&r.classList.add("hidden"),typeof Chart<"u"){a.completionChart&&a.completionChart.destroy();const u=l.getContext("2d");a.completionChart=new Chart(u,{type:"doughnut",data:{labels:["Completed","Remaining"],datasets:[{data:[a.overallProgress,Math.max(0,100-a.overallProgress)],backgroundColor:["#147D64","#E3E9EF"],borderWidth:0,hoverOffset:2}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"76%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:p=>` ${p.label}: ${p.raw}%`}}}}})}}const i=a.finance?.currency||"USD",d=document.getElementById("clientSummaryTotalBilled"),g=document.getElementById("clientSummaryTotalPaid"),f=document.getElementById("clientSummaryBalance"),m=document.getElementById("clientSummaryContractValue");m&&(m.textContent=D(a.finance?.contractValueCents||0,i)),d&&(d.textContent=D(a.finance?.totalInvoicedCents||0,i)),g&&(g.textContent=D(a.finance?.totalPaidCents||0,i)),f&&(f.textContent=D(a.finance?.outstandingBalanceCents||0,i));const x=document.getElementById("overviewServicesList");x&&(a.services.length===0?x.innerHTML=`
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
      `:(x.innerHTML=a.services.map(u=>{const p=Math.round(Number(u.progress_percent||u.progressPercent||0));return`
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6ECE9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
            <div class="flex items-start sm:items-center space-x-3.5 min-w-0 w-full sm:w-auto">
              <div class="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/25 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-bold text-[#202D2A] truncate">${b(u.service_name||u.serviceName||"Agency Service")}</h4>
                <p class="text-[11px] text-[#74817D] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span>Status: <strong class="text-[#087F70] uppercase font-bold">${b(u.status||"Active")}</strong></span>
                  <span class="text-slate-300">\u2022</span>
                  <span>Progress: <strong class="text-[#087F70] font-mono font-bold">${p}%</strong></span>
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E6ECE9]">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${b(u.status||"Active")}
              </span>
              <button type="button" data-client-tab="services" class="px-3 py-1.5 rounded-lg bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] hover:text-[#087F70] text-[11px] font-semibold transition-all border border-[#E6ECE9] hover:border-[#087F70]/20 cursor-pointer touch-manipulation">
                Details
              </button>
            </div>
          </div>
        `}).join(""),x.querySelectorAll("[data-client-tab]").forEach(u=>{u.addEventListener("click",()=>F(u.dataset.clientTab))})))}function ce(){const t=document.getElementById("servicesFullList"),n=document.getElementById("servicesPortfolioCount");if(n&&(n.textContent=`${a.services.length} Active Services`),!!t){if(a.services.length===0){t.innerHTML=`
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-layer-group text-2xl text-slate-400 block mb-1"></i>
          <p>No active services provisioned for this account.</p>
        </div>
      `;return}t.innerHTML=a.services.map(e=>{const s=Math.round(Number(e.progress_percent||e.progressPercent||0));return`
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center space-x-3.5 min-w-0">
              <div class="w-11 h-11 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/25 flex items-center justify-center font-bold text-base shrink-0">
                <i class="fa-solid fa-shapes"></i>
              </div>
              <div class="min-w-0">
                <h4 class="text-sm sm:text-base font-bold text-[#172B36] truncate">${b(e.service_name||e.serviceName||e.name||"Marketing Service")}</h4>
                <p class="text-xs text-slate-500 mt-0.5">Active Service Engagement</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              ${b(e.status||"Active")}
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
      `}).join("")}}function ue(){const t=document.getElementById("tasksFullList"),n=document.getElementById("tasksDeliverablesCount");if(n&&(n.textContent=`${a.projects.length} Active Campaigns`),!!t){if(a.projects.length===0){t.innerHTML=`
        <div class="p-8 sm:p-12 rounded-3xl bg-white border border-[#E3E9EF] text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-[#172B36]">No active project campaigns provisioned yet</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">When your service agreement is activated, milestone progress updates will appear here.</p>
          </div>
        </div>
      `;return}t.innerHTML=a.projects.map(e=>{const s=Math.min(100,Math.max(0,Math.round(Number(e.progress_percent||e.progressPercent||0)))),o=Number(e.completedTasksCount||0),l=Number(e.totalTasksCount||0),r=Math.max(0,l-o);return`
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h4 class="text-sm sm:text-base font-bold text-[#172B36] flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-[#087F70] text-xs"></i>
                <span>${b(e.name||e.projectName||"Campaign Execution")}</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Campaign Status: <strong class="text-slate-600">${b(e.status||"Active")}</strong></p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${b(e.status||"Active")}
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
              <span class="text-base sm:text-lg font-black text-[#172B36] font-mono mt-0.5 block">${l}</span>
            </div>
            <div class="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-center">
              <span class="text-[10px] uppercase font-bold text-emerald-700 block">Completed</span>
              <span class="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">${o}</span>
            </div>
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">In Progress</span>
              <span class="text-base sm:text-lg font-black text-slate-700 font-mono mt-0.5 block">${r}</span>
            </div>
          </div>
        </div>
      `}).join("")}}function G(t){const n=t||a.cif||{},e=(r,i)=>{const d=document.getElementById(r);d&&(d.value=i??"")},s=window.Clerk?.user,o=(n.email||a.currentUser?.email||s?.primaryEmailAddress?.emailAddress||"").toLowerCase(),l=n.fullName||n.full_name||a.currentUser?.fullName||(s?`${s.firstName||""} ${s.lastName||""}`.trim():"")||"Client";e("profileFullName",l),e("profileEmail",o),e("profilePhone",n.phone||""),e("profileCompanyName",n.companyName||n.company_name||a.currentUser?.companyName||""),e("profileBillingName",n.billingName||n.billing_name||l),e("profileCurrency",n.billingCurrency||n.billing_currency||"USD"),e("profileAddress",n.billingAddress||n.billing_address||""),e("profileCity",n.city||""),e("profileCountry",n.country||"Bangladesh"),e("profilePostalCode",n.postalCode||n.postal_code||""),e("profileTaxId",n.taxId||n.tax_id||""),le(),X(),me(n.isLocked||n.is_locked===1)}function me(t){const n=!!t,e=document.getElementById("btnSaveClientProfile"),s=document.getElementById("profileLockedNoticeBanner");["profileFullName","profileBillingName","profileCompanyName","profilePhone","profileAddress","profileCity","profileCountry","profilePostalCode","profileCurrency","profileTaxId"].forEach(l=>{const r=document.getElementById(l);if(r){n?(r.disabled=!0,r.classList.add("bg-slate-100","cursor-not-allowed","text-slate-600","border-slate-200"),r.classList.remove("bg-slate-50","bg-white")):(r.disabled=!1,r.classList.remove("bg-slate-100","cursor-not-allowed","text-slate-600","border-slate-200"),r.classList.add("bg-slate-50"));const i=r.closest(".glass-select-wrapper")?.querySelector(".glass-select-trigger");i&&(i.disabled=n,i.classList.toggle("opacity-60",n),i.classList.toggle("cursor-not-allowed",n))}}),e&&(n?e.classList.add("hidden"):e.classList.remove("hidden")),s&&(n?s.classList.remove("hidden"):s.classList.add("hidden"))}function X(){const t=[{id:"profileFullName",label:"Full Legal Name"},{id:"profileBillingName",label:"Billing Name"},{id:"profileEmail",label:"Verified Email"},{id:"profilePhone",label:"Phone Number"},{id:"profileAddress",label:"Full Billing Address"},{id:"profileCity",label:"City"},{id:"profileCountry",label:"Country"},{id:"profileCurrency",label:"Billing Currency"}];let n=0;const e=[];t.forEach(x=>{const u=document.getElementById(x.id);(u?u.value.trim():"").length>0?n++:e.push(x.label)});const s=Math.round(n/t.length*100),o=s===100,l=document.getElementById("profileStatusProgressBar"),r=document.getElementById("profileStatusPercentBadge"),i=document.getElementById("profileStatusBannerTitle"),d=document.getElementById("profileStatusBannerDesc"),g=document.getElementById("profileStatusBannerIcon"),f=document.getElementById("profileMissingFieldsAlert"),m=document.getElementById("profileMissingFieldsList");l&&(l.style.width=`${s}%`,l.className=o?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-amber-500 transition-all duration-300"),r&&(r.textContent=`${s}% Complete`,r.className=o?"text-xs font-extrabold text-emerald-700 font-mono px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200":"text-xs font-extrabold text-amber-700 font-mono px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200"),o?(i&&(i.textContent="Profile Verified (100%)"),d&&(d.textContent="All 8 mandatory billing fields verified. Official PDF invoice generation active."),g&&(g.className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0",g.innerHTML='<i class="fa-solid fa-circle-check"></i>'),f&&f.classList.add("hidden")):(i&&(i.textContent=`Profile Incomplete (${s}%)`),d&&(d.textContent="Complete all 8 mandatory fields to enable official invoice PDF downloads."),g&&(g.className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0",g.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i>'),f&&(f.classList.remove("hidden"),m&&(m.textContent=e.join(", "))))}async function fe(t){t&&t.preventDefault&&t.preventDefault();const n=document.getElementById("btnSaveClientProfile"),e=n?n.innerHTML:"";n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving changes...');try{const s=i=>(document.getElementById(i)?.value||"").trim(),o={fullName:s("profileFullName"),email:s("profileEmail")||a.currentUser?.email||"",phone:s("profilePhone"),companyName:s("profileCompanyName"),billingName:s("profileBillingName"),billingCurrency:s("profileCurrency")||"USD",billingAddress:s("profileAddress"),city:s("profileCity"),country:s("profileCountry")||"Bangladesh",postalCode:s("profilePostalCode"),taxId:s("profileTaxId")},l=[{field:o.fullName,name:"Full Legal Name",id:"profileFullName"},{field:o.billingName,name:"Billing / Invoicing Entity Name",id:"profileBillingName"},{field:o.phone,name:"Phone Number",id:"profilePhone"},{field:o.billingAddress,name:"Full Billing Street Address",id:"profileAddress"},{field:o.city,name:"City",id:"profileCity"},{field:o.country,name:"Country",id:"profileCountry"},{field:o.billingCurrency,name:"Preferred Billing Currency",id:"profileCurrency"}];for(const i of l)if(!i.field){const d=document.getElementById(i.id);throw d&&d.focus(),new Error(`Please provide your ${i.name}.`)}const r=await _("/portal/client/cif",{method:"POST",body:JSON.stringify(o)});if(r.status===403||r.data?.code==="PROFILE_LOCKED"){y(r.data?.error||"Your profile is verified and locked. Contact Whiz Studio Support to request changes.","error"),me(!0);return}if(!r.ok||!r.data||!r.data.success)throw new Error(r.data?.error||"Failed to save profile.");a.cif=r.data.data,a.clientProfile&&Object.assign(a.clientProfile,r.data.data),U(),G(a.cif),X(),y(r.data.message||"Profile saved and verified successfully!","success")}catch(s){console.error("Save profile error:",s),y(s.message||"Error saving profile details.","error")}finally{n&&(n.disabled=!1,n.innerHTML=e||'<i class="fa-solid fa-floppy-disk"></i> <span>Save Changes</span>')}}function O(t,n,e="Processing..."){t&&(n?(t.dataset.origText=t.innerHTML,t.disabled=!0,t.innerHTML=`<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>${e}</span>`):(t.disabled=!1,t.dataset.origText&&(t.innerHTML=t.dataset.origText,delete t.dataset.origText)))}function Z(){try{const n=!!window.Clerk?.user?.passwordEnabled,e=document.getElementById("settingsPasswordStatusBadge"),s=document.getElementById("settingsPasswordHelpText"),o=document.getElementById("btnOpenPasswordModalText"),l=document.getElementById("modalClientPasswordTitle"),r=document.getElementById("containerCurrentPassword");if(e&&(e.textContent=n?"Password Active":"No Password Set",e.className=n?"px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200":"px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200"),s&&(s.textContent=n?"Your account is protected with a password in addition to Google Single Sign-On.":"You registered with Google SSO. You can optionally set a permanent password for direct email/password sign-in."),o&&(o.textContent=n?"Change Password":"Set Password"),l&&(l.textContent=n?"Change Account Password":"Set Account Password"),r)if(n){r.classList.remove("hidden");const i=document.getElementById("inputCurrentPassword");i&&(i.required=!0)}else{r.classList.add("hidden");const i=document.getElementById("inputCurrentPassword");i&&(i.required=!1)}}catch(t){console.warn("updatePasswordUi error:",t)}}function _e(){try{const t=window.Clerk?.user;if(!t)return;const n=(a.clientProfile?.email||t.primaryEmailAddress?.emailAddress||"").toLowerCase(),e=document.getElementById("settingsEmail");e&&(e.textContent=n);const s=document.getElementById("settingsClerkUserId");s&&(s.innerHTML='<i class="fa-solid fa-shield-check text-[#147D64] mr-1.5"></i><span>Hardware-Backed SSO Session Active</span>');const o=document.getElementById("settingsAuthProvider"),l=t.externalAccounts?.some(r=>r.provider==="google");o&&(o.textContent=l?"Google Single Sign-On (SSO)":"Email Authentication"),Z()}catch(t){console.warn("populateSettingsView error:",t)}}function U(){const t=document.getElementById("cifStatusCard"),n=document.getElementById("cifStatusIcon"),e=document.getElementById("cifStatusTitle"),s=document.getElementById("cifStatusDescription"),o=document.getElementById("cifPercentageBadge"),l=document.getElementById("cifProgressBar"),r=document.getElementById("cifMissingFieldsContainer"),i=document.getElementById("cifMissingFieldsList"),d=document.getElementById("btnCifAction"),g=a.cif||{},f=g.completionPercentage!==void 0?g.completionPercentage:g.isComplete?100:0,m=!!((g.isComplete||f===100)&&(g.isLocked||g.is_locked===1)),x=g.missingFields||[],u=document.getElementById("clientHeaderVerificationBadge"),p=document.getElementById("clientHeaderVerificationDot"),w=document.getElementById("clientHeaderVerificationText");u&&w&&p&&(u.classList.remove("hidden"),m?(u.className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",p.className="w-1.5 h-1.5 rounded-full bg-emerald-500",w.textContent="Verified",u.title="CIF Profile 100% verified. Invoice generation active."):(u.className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",p.className="w-1.5 h-1.5 rounded-full bg-rose-500",w.textContent="Unverified",u.title="CIF profile incomplete. Click to complete profile."),u.dataset.bound||(u.dataset.bound="true",u.addEventListener("click",()=>F("profile")))),o&&(o.textContent=`${f}% Complete`),l&&(l.style.width=`${f}%`,l.className=m?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-amber-500 transition-all duration-300"),m?(n&&(n.className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm",n.innerHTML='<i class="fa-solid fa-circle-check"></i>'),e&&(e.textContent="CIF Profile Complete (100%)"),s&&(s.textContent="All mandatory billing fields verified. Official PDF generation is enabled."),r&&r.classList.add("hidden"),d&&(d.textContent="Edit Profile Details",d.className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shadow-xs cursor-pointer",d.onclick=()=>F("profile"))):(n&&(n.className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm",n.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i>'),e&&(e.textContent=`CIF Profile Incomplete (${f}%)`),s&&(s.textContent="Complete all mandatory fields to unlock official PDF downloads."),r&&(r.classList.remove("hidden"),i&&(i.textContent=x.length>0?x.join(", "):"Mandatory invoice fields required")),d&&(d.textContent="Complete Profile",d.className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#147D64] hover:bg-[#12694f] text-white transition-all shadow-xs cursor-pointer",d.onclick=()=>F("profile")))}const V=2,Q="whiz_invoice_daily_rate_limit";function W(){const t=new Date().toISOString().split("T")[0];let n=null;try{const e=localStorage.getItem(Q);e&&(n=JSON.parse(e))}catch(e){console.warn("[RateLimit] Failed to read stored quota:",e)}if(!n||n.date!==t){n={date:t,max:V,used:0,remaining:V,isLimitReached:!1,timestamps:[]};try{localStorage.setItem(Q,JSON.stringify(n))}catch{}}else n.max=V,n.remaining=Math.max(0,V-(n.used||0)),n.isLimitReached=n.remaining<=0;return n}function Fe(){const t=W();if(t.remaining<=0)return t.isLimitReached=!0,!1;t.used=(t.used||0)+1,t.remaining=Math.max(0,t.max-t.used),t.isLimitReached=t.remaining<=0,Array.isArray(t.timestamps)||(t.timestamps=[]),t.timestamps.push(new Date().toISOString());try{localStorage.setItem(Q,JSON.stringify(t))}catch{}return a.receiptQuota=t,R(),!0}function R(){const t=W();let n=t;if(a.receiptQuota&&typeof a.receiptQuota.remaining=="number"){n={date:t.date,max:a.receiptQuota.max||2,remaining:a.receiptQuota.remaining,used:a.receiptQuota.used||0,isLimitReached:!!(a.receiptQuota.isLimitReached||a.receiptQuota.remaining<=0)};try{localStorage.setItem(Q,JSON.stringify(n))}catch{}}a.receiptQuota=n;const e=document.getElementById("quotaRemainingText"),s=document.getElementById("quotaBadgePill"),o=n.isLimitReached||n.remaining<=0;e&&(e.textContent=o?`Daily download limit reached (0/${n.max})`:`Daily PDF Allowance: ${n.remaining}/${n.max} remaining`),s&&(o?s.className="px-3.5 py-2 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-2 shadow-xs":s.className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#087F70]/10 text-[#087F70] border border-[#087F70]/20 flex items-center gap-2 shadow-xs"),document.querySelectorAll(".btn-download-receipt").forEach(r=>{o?(r.disabled=!0,r.classList.add("opacity-50","cursor-not-allowed"),r.classList.remove("hover:bg-[#066559]"),r.setAttribute("title","Daily download limit reached.")):r.hasAttribute("data-loading")||(r.disabled=!1,r.classList.remove("opacity-50","cursor-not-allowed"),r.classList.add("hover:bg-[#066559]"),r.setAttribute("title","Download official system-generated receipt"))})}async function pe(){try{const t=await _("/portal/client/cif");t.ok&&t.data&&t.data.success&&(a.cif=t.data.data,U(),ge(a.cif))}catch(t){console.warn("Failed to load CIF profile:",t)}}function ge(t){if(!t)return;const n=(e,s)=>{const o=document.getElementById(e);o&&(o.value=s||"")};n("cifInputFullName",t.fullName),n("cifInputBillingName",t.billingName),n("cifInputCompanyName",t.companyName),n("cifInputEmail",t.email),n("cifInputPhone",t.phone),n("cifInputAddress",t.billingAddress),n("cifInputCity",t.city),n("cifInputCountry",t.country),n("cifInputPostalCode",t.postalCode),n("cifInputCurrency",t.billingCurrency||"USD"),n("cifInputTaxId",t.taxId),Ae()}function Ae(){const t=["cifInputFullName","cifInputBillingName","cifInputEmail","cifInputPhone","cifInputAddress","cifInputCity","cifInputCountry","cifInputCurrency"];let n=0;t.forEach(l=>{const r=document.getElementById(l);r&&r.value.trim().length>0&&n++});const e=Math.round(n/t.length*100),s=document.getElementById("modalCifPercentText"),o=document.getElementById("modalCifProgressBar");s&&(s.textContent=`${e}% (${n}/8 Mandatory Fields)`),o&&(o.style.width=`${e}%`,o.className=e===100?"h-full bg-emerald-500 transition-all duration-300":"h-full bg-[#147D64] transition-all duration-300")}function $e(){const t=document.getElementById("modalClientCif");t&&(a.cif&&ge(a.cif),t.classList.remove("hidden"))}function De(){const t=document.getElementById("modalClientCif");t&&t.classList.add("hidden")}async function Oe(t){t.preventDefault();const n=document.getElementById("btnSaveCif");n&&(n.disabled=!0,n.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...');try{const e={fullName:document.getElementById("cifInputFullName")?.value.trim(),billingName:document.getElementById("cifInputBillingName")?.value.trim(),companyName:document.getElementById("cifInputCompanyName")?.value.trim(),email:document.getElementById("cifInputEmail")?.value.trim(),phone:document.getElementById("cifInputPhone")?.value.trim(),billingAddress:document.getElementById("cifInputAddress")?.value.trim(),city:document.getElementById("cifInputCity")?.value.trim(),country:document.getElementById("cifInputCountry")?.value.trim(),postalCode:document.getElementById("cifInputPostalCode")?.value.trim(),billingCurrency:document.getElementById("cifInputCurrency")?.value||"USD",taxId:document.getElementById("cifInputTaxId")?.value.trim()},s=await _("/portal/client/cif",{method:"POST",body:JSON.stringify(e)});if(!s.ok||!s.data||!s.data.success)throw new Error(s.data?.error||"Failed to save CIF profile.");a.cif=s.data.data,U(),De(),y(s.data.message||"CIF profile saved successfully!","success")}catch(e){y(e.message||"Error saving CIF profile.","error")}finally{n&&(n.disabled=!1,n.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save &amp; Validate CIF')}}function xe(){const t=document.getElementById("financeFullList"),n=document.getElementById("financeReceiptsCount");if(!t)return;U(),R();const e=a.payments||[];n&&(n.textContent=`${e.length} Verified Transactions Recorded in Ledger`);let s="";if(a.finance&&a.finance.byCurrency){const i=Object.values(a.finance.byCurrency);i.length>0&&(s=`
          <div class="grid grid-cols-1 sm:grid-cols-${Math.min(i.length,3)} gap-4 mb-6">
            ${i.map(d=>`
              <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2">
                <div class="flex items-center justify-between pb-2 border-b border-[#E3E9EF]">
                  <span class="text-xs font-black uppercase text-[#087F70] bg-[#087F70]/10 px-2 py-0.5 rounded-md border border-[#087F70]/20">${b(d.currency)}</span>
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
      `;return}const o=a.receiptQuota||W(),l=o.isLimitReached||o.remaining<=0,r=i=>{const d=String(i||"bank_transfer").toLowerCase();return d.includes("mobile")||d.includes("bkash")||d.includes("nagad")||d.includes("mfs")?"Mobile Banking (MFS)":d.includes("bank")||d.includes("wire")?"Bank Transfer / Wire":d.includes("card")?"Credit / Debit Card":d.includes("cash")?"Cash / Cheque":d.includes("online")?"Online Banking":d.replace(/_/g," ").replace(/\b\w/g,g=>g.toUpperCase())};t.innerHTML=`
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
          ${e.map(i=>{const d=i.payment_date||i.paymentDate||"N/A",g=i.service_name||i.serviceName||i.serviceProvided||"Agency Retainer Service",f=r(i.payment_method||i.paymentMethod),m=D(i.amount_cents||i.amountCents||0,i.currency||"USD"),x=i.receipt_number||i.receiptNumber||"RCPT-1001";return`
              <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <span class="text-[10px] font-mono font-bold text-[#087F70]">${b(d)}</span>
                    <h4 class="text-xs font-bold text-[#172B36] truncate mt-0.5">${b(g)}</h4>
                    <span class="text-[11px] text-slate-500">${b(f)}</span>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-sm font-mono font-black text-[#172B36]">${m}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-100">
                  <button type="button" class="btn-download-receipt w-full py-2.5 rounded-xl ${l?"bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200":"bg-[#087F70] hover:bg-[#066559] active:bg-[#055046] text-white shadow-xs cursor-pointer"} text-xs font-bold flex items-center justify-center gap-2 transition-all" data-id="${i.id}" data-receipt="${x}" ${l?'disabled title="Daily download limit reached."':'title="Download Receipt"'}>
                    <i class="fa-solid ${l?"fa-lock":"fa-file-arrow-down"} text-xs"></i>
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
                ${e.map(i=>{const d=i.payment_date||i.paymentDate||"N/A",g=i.service_name||i.serviceName||i.serviceProvided||"Agency Retainer Service",f=r(i.payment_method||i.paymentMethod),m=D(i.amount_cents||i.amountCents||0,i.currency||"USD"),x=i.receipt_number||i.receiptNumber||"RCPT-1001";return`
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-4 font-mono font-medium text-slate-600">${b(d)}</td>
                      <td class="p-4">
                        <div class="font-bold text-[#172B36]">${b(g)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">Receipt Ref: ${b(x)}</div>
                      </td>
                      <td class="p-4 text-slate-600 font-medium">${b(f)}</td>
                      <td class="p-4 font-mono font-black text-[#172B36]">${m}</td>
                      <td class="p-4 text-right">
                        <button type="button" class="btn-download-receipt inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${l?"bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200":"bg-[#087F70] hover:bg-[#066559] active:bg-[#055046] text-white shadow-xs cursor-pointer"} text-xs font-bold transition-all" data-id="${i.id}" data-receipt="${x}" ${l?'disabled title="Daily download limit reached."':'title="Download Receipt"'}>
                          <i class="fa-solid ${l?"fa-lock":"fa-file-arrow-down"} text-xs"></i>
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
    `,t.querySelectorAll(".btn-download-receipt").forEach(i=>{i.addEventListener("click",()=>{Ne(i.dataset.id,i.dataset.receipt,i)})})}async function Ne(t,n,e){const s=a.receiptQuota||W();if(s.isLimitReached||s.remaining<=0){y("Daily download limit reached.","error");return}if(a.cif&&!a.cif.isComplete){F("profile"),y("Please complete your Profile (CIF) before downloading receipts.","error");return}const o=e?e.innerHTML:"";e&&(e.disabled=!0,e.setAttribute("data-loading","true"),e.innerHTML='<i class="fa-solid fa-circle-notch fa-spin text-xs mr-1.5"></i><span>Preparing Invoice...</span>');try{const l=`whiz_rcpt_${n}_${Date.now()}`,r=await _("/pdf/authorize-receipt",{method:"POST",body:JSON.stringify({paymentId:t,receiptNumber:n,idempotencyKey:l})});if(!r.ok||!r.data||!r.data.success){if(r.data?.code==="DAILY_QUOTA_EXCEEDED"){y("Daily download limit reached.","error"),a.receiptQuota={...s,remaining:0,isLimitReached:!0},R();return}if(r.data?.code==="CIF_INCOMPLETE"){F("profile"),y(r.data.error||"Please complete your Profile before downloading invoices.","error");return}throw new Error(r.data?.error||"Failed to authorize invoice download.")}r.data.quota&&(a.receiptQuota=r.data.quota,Fe());const i=r.data.data;let d;if(window.WhizDocumentPdf&&typeof window.WhizDocumentPdf.compileWhizDocumentPdf=="function")d=await window.WhizDocumentPdf.compileWhizDocumentPdf(i);else if(typeof window.compileWhizDocumentPdf=="function")d=await window.compileWhizDocumentPdf(i);else throw new Error("PDF Engine not loaded. Please refresh the page.");const g=new Blob([d],{type:"application/pdf"}),f=i.invoiceNumber||n||"OFFICIAL",m=`WhizStudio_Invoice_${f}.pdf`,x=URL.createObjectURL(g),u=document.createElement("a");u.href=x,u.download=m,document.body.appendChild(u),u.click(),u.remove(),URL.revokeObjectURL(x),y(`Invoice ${f} generated and downloaded successfully!`,"success")}catch(l){console.error("Receipt download error:",l),y(l.message||"Failed to generate receipt PDF.","error")}finally{e&&(e.innerHTML=o,e.disabled=!1,e.removeAttribute("data-loading")),R()}}function Ue(){const t=document.getElementById("modalDocumentPreview");t&&t.classList.add("hidden");const n=document.getElementById("previewDocIframe");n&&(n.src="about:blank")}let be=0;async function ye(){const t=document.getElementById("clientAuthGuard"),n=document.getElementById("clientMainLayout"),e=new URLSearchParams(window.location.search);if(e.get("preview")==="1"||e.get("preview")==="true"||e.get("demo")==="1"||window.self!==window.top&&e.get("preview")!=="0"){a.isPreview=!0;const o=window.__whizClientMock?window.__whizClientMock.data||(typeof window.__whizClientMock.getData=="function"?window.__whizClientMock.getData():null):null,l=o&&o.user||{id:"usr_client_01",fullName:"Sarah Jenkins",full_name:"Sarah Jenkins",email:"sarah@apexglobal.io",username:"sarahjenkins",role:"client",companyName:"Apex Global Inc.",company_name:"Apex Global Inc.",phone:"+1 (555) 349-2041",city:"San Francisco",country:"United States"};a.currentUser=l,a.clientProfile=l;const r=l.fullName,i=l.email;document.querySelectorAll(".client-greeting-name").forEach(m=>m.textContent=r),document.querySelectorAll(".clientDisplayName").forEach(m=>m.textContent=r),document.querySelectorAll(".clientDisplayEmail").forEach(m=>m.textContent=i),z();const d=r.split(" ").map(m=>m[0]).join("").slice(0,2).toUpperCase()||"SJ";document.querySelectorAll(".userAvatarText").forEach(m=>m.textContent=d);const g=document.getElementById("settingsEmail");g&&(g.textContent=i);const f=document.getElementById("settingsAuthStatus");f&&(f.innerHTML='<i class="fa-solid fa-shield-check text-[#087F70]"></i> Verified (Google & Email SSO)'),t&&t.classList.add("hidden"),n&&n.classList.remove("hidden");try{await pe()}catch(m){console.warn("loadCifProfile non-fatal:",m)}try{G(a.cif||a.clientProfile)}catch(m){console.warn("Non-fatal profile form population warning:",m)}F("overview"),T();return}if(!window.Clerk){if(be++,be>50){console.error("Clerk SDK load timeout in client dashboard"),t&&(t.innerHTML=`
            <div class="mb-5 flex items-center justify-center">
              <img src="/assets/images/whiz-logo-v2.png?v=202611" alt="Whiz Studio" class="h-12 w-auto object-contain">
            </div>
            <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Authentication Service Unavailable</h2>
            <p class="text-xs text-rose-500 mt-2 max-w-sm">Unable to connect to secure authentication services. Please verify your internet connection or disable tracking blockers.</p>
            <div class="mt-5 flex items-center justify-center gap-3">
              <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry Connection</button>
              <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
            </div>
          `);return}setTimeout(ye,100);return}try{window.Clerk.loaded||await Promise.race([window.Clerk.load({publishableKey:Be}),new Promise((p,w)=>setTimeout(()=>w(new Error("Authentication system connection timeout")),8e3))]);const o=window.Clerk.user;if(!o){window.location.href="/?login=client";return}a.currentUser=o;const l=await _("/portal/me");l.ok&&l.data&&l.data.success&&l.data.data&&(a.clientProfile=l.data.data.user);const r=a.clientProfile?.fullName||a.clientProfile?.full_name||o.fullName||o.username||"Client",i=(a.clientProfile?.email||(o.primaryEmailAddress?o.primaryEmailAddress.emailAddress:"")).toLowerCase();document.querySelectorAll(".client-greeting-name").forEach(p=>p.textContent=r),document.querySelectorAll(".clientDisplayName").forEach(p=>p.textContent=r),document.querySelectorAll(".clientDisplayEmail").forEach(p=>p.textContent=i),z();const d=document.getElementById("settingsEmail");d&&(d.textContent=i);const g=document.getElementById("settingsAuthStatus");g&&(g.innerHTML='<i class="fa-solid fa-shield-check text-[#147D64]"></i> Verified (Google & Email SSO)');try{_e()}catch(p){console.warn("Non-fatal settings view population warning:",p)}try{await pe()}catch(p){console.warn("loadCifProfile non-fatal:",p)}try{G(a.cif||a.clientProfile)}catch(p){console.warn("Non-fatal profile form population warning:",p)}const f=r.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()||"CL";document.querySelectorAll(".userAvatarText").forEach(p=>p.textContent=f);const m=(a.clientProfile?.role||"").toLowerCase(),x=!!(a.clientProfile?.isSuperAdmin||m==="super_admin"||m==="owner"||i==="kaziaremon@gmail.com");if(!!(a.clientProfile?.isStaff||x||m==="admin"||m==="owner"||m==="super_admin")){if(!(new URLSearchParams(window.location.search).get("preview")==="true")){console.log("[Route Guard] Administrative user accessed client portal. Redirecting to admin dashboard..."),window.location.replace("/admin/dashboard/");return}const I=document.getElementById("adminPortalLinkContainer");I&&I.classList.remove("hidden");const L=document.getElementById("mobileAdminPortalLinkContainer");L&&L.classList.remove("hidden")}t&&t.classList.add("hidden"),n&&n.classList.remove("hidden"),F("overview"),T()}catch(o){console.error("Client Auth Guard Error:",o),t&&(t.innerHTML=`
          <div class="mb-5 flex items-center justify-center">
            <img src="/assets/images/whiz-logo-v2.png?v=202611" alt="Whiz Studio" class="h-12 w-auto object-contain">
          </div>
          <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Workspace Initialization Failed</h2>
          <p class="text-xs text-rose-500 mt-2 max-w-sm">${b(o.message||"An unexpected error occurred while preparing your workspace.")}</p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry</button>
            <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
          </div>
        `)}}async function ee(){const t=document.getElementById("clientSupportTicketsContainer");if(t)try{const n=await _("/portal/support/my");if(n.ok&&n.data){const e=Array.isArray(n.data.data)?n.data.data:[];Te(e)}else t.innerHTML='<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests found.</div>'}catch(n){console.error("loadClientSupportTickets error:",n),t.innerHTML='<div class="p-6 rounded-2xl bg-rose-50 text-center text-xs text-rose-500 font-medium">Failed to load support requests.</div>'}}function Te(t){const n=document.getElementById("clientSupportTicketsContainer");if(!n)return;if(!t||t.length===0){n.innerHTML='<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests submitted yet. Use the form above to reach our team.</div>';return}const e={open:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">Open</span>',in_progress:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>',resolved:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>',closed:'<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">Closed</span>'};n.innerHTML=t.map(s=>{const o=s.created_at?new Date(s.created_at).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}):"N/A",l=e[s.status]||e.open;return`
        <div class="p-4 rounded-2xl bg-slate-50 border border-[#E3E9EF] space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-[#172B36]">${b(s.subject)}</span>
            ${l}
          </div>
          <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">${b(s.message)}</p>
          ${s.admin_notes?`
            <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 mt-2 space-y-1">
              <div class="font-bold text-[10px] uppercase tracking-wider text-emerald-700">Team Response / Notes:</div>
              <div>${b(s.admin_notes)}</div>
            </div>
          `:""}
          <div class="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <span>Ticket: ${b(s.id)}</span>
            <span>Submitted: ${b(o)}</span>
          </div>
        </div>
      `}).join("")}async function ve(t=!1){const n=document.getElementById("clientContentCalContainer"),e=document.getElementById("btnRefreshClientContentCal");if(e){const o=e.querySelector("i");o&&o.classList.add("fa-spin")}const s=(a.currentUser?.email||a.clientProfile?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||"").toLowerCase().trim();if(n)try{const o=s?`?email=${encodeURIComponent(s)}`:"",l=await _(`/api/client/content-calendar${o}`);l.ok&&l.data?.success?(a.clientContentFolders=l.data.folders||[],J(),t&&y("Content calendar updated.","success")):(a.clientContentFolders=[],J())}catch(o){console.error("Error loading client content calendar:",o),n.innerHTML=`
        <div class="p-8 rounded-2xl bg-white border border-[#E6ECE9] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-500 block mb-1"></i>
          <p>Unable to load content calendar at this time.</p>
        </div>
      `}finally{if(e){const o=e.querySelector("i");o&&o.classList.remove("fa-spin")}}}function J(t=null){const n=document.getElementById("clientContentCalContainer");if(!n)return;const e=a.clientContentFolders||[];if(e.length===0){n.innerHTML=`
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
      `;return}if(t){const s=e.find(o=>o.id===t);if(s){he(s,e.length>1);return}}if(e.length===1){he(e[0],!1);return}n.innerHTML=`
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
          ${e.map(s=>{const o=(s.items||[]).length,l=s.created_at?new Date(s.created_at).toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"}):"Recently";return`
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
                      ${b(s.service_name||"Content Retainer")}
                    </h4>
                    <p class="text-xs text-[#74817D] mt-0.5">
                      Updated ${b(l)}
                    </p>
                  </div>
                </div>

                <div class="pt-3 border-t border-[#E6ECE9] flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-[#74817D]">
                    ${b(s.company_name||"Client Workspace")}
                  </span>
                  <button type="button" class="btn-open-client-folder px-3 py-1.5 rounded-xl text-xs font-bold bg-[#087F70] text-white hover:bg-[#066155] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs" data-folder-id="${b(s.id)}">
                    <span>View Calendar</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            `}).join("")}
        </div>
      </div>
    `,n.querySelectorAll(".btn-open-client-folder").forEach(s=>{s.addEventListener("click",()=>{const o=s.dataset.folderId;o&&J(o)})})}function he(t,n=!1){const e=document.getElementById("clientContentCalContainer");if(!e)return;const s=t.items||[],o=s.length;e.innerHTML=`
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
                ${b(t.service_name||"Content Retainer")}
              </h3>
              <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20">
                ${o} Deliverable${o===1?"":"s"}
              </span>
            </div>
            <p class="text-xs text-[#74817D]">
              ${b(t.company_name||"Client")} \u2022 Title-Only Publication Schedule
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
            ${s.map(l=>{const r=l.serial_number||1,i=l.title||`Content ${r}`;return`
                <div class="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#E6ECE9] shadow-2xs hover:border-[#087F70]/30 transition-all flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
                      #${r}
                    </span>
                    <div class="min-w-0">
                      <h4 class="text-xs sm:text-sm font-bold text-[#172B36] truncate leading-snug">
                        ${b(i)}
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
    `,n&&document.getElementById("btnBackToClientFolders")?.addEventListener("click",()=>{J(null)})}function we(){document.querySelectorAll("[data-client-tab]").forEach(c=>{c.addEventListener("click",()=>{F(c.dataset.clientTab);const v=document.getElementById("clientMobileDrawer"),E=document.getElementById("clientMobileBackdrop");v&&E&&(v.classList.add("-translate-x-full"),E.classList.add("hidden"))})});const t=document.getElementById("clientMobileToggleBtn"),n=document.getElementById("clientMobileCloseBtn"),e=document.getElementById("clientMobileDrawer"),s=document.getElementById("clientMobileBackdrop");function o(){e&&s&&(e.classList.remove("-translate-x-full"),s.classList.remove("hidden"),document.body.classList.add("overflow-hidden"))}function l(){e&&s&&(e.classList.add("-translate-x-full"),s.classList.add("hidden"),document.body.classList.remove("overflow-hidden"))}t&&t.addEventListener("click",o),n&&n.addEventListener("click",l),s&&s.addEventListener("click",l),e&&e.querySelectorAll("[data-client-tab]").forEach(c=>{c.addEventListener("click",l)});const r=document.getElementById("clientUserMenuBtn"),i=document.getElementById("clientUserAccountDropdown"),d=document.getElementById("clientUserMenuChevron");function g(){if(!i)return;i.classList.contains("hidden")?(i.classList.remove("hidden"),d&&d.classList.add("rotate-180"),r&&r.setAttribute("aria-expanded","true")):f()}function f(){i&&(i.classList.add("hidden"),d&&d.classList.remove("rotate-180"),r&&r.setAttribute("aria-expanded","false"))}r&&r.addEventListener("click",c=>{c.stopPropagation(),g()}),document.addEventListener("click",c=>{i&&!i.classList.contains("hidden")&&!i.contains(c.target)&&!r?.contains(c.target)&&f()}),document.addEventListener("keydown",c=>{c.key==="Escape"&&(f(),l())}),document.querySelectorAll(".client-dropdown-account-link, .client-dropdown-tab-link").forEach(c=>{c.addEventListener("click",()=>{f();const v=c.dataset.clientAction,E=c.dataset.tab;v?F("settings"):E&&F(E)})}),document.getElementById("btnRefreshClientDashboardMobile")?.addEventListener("click",async()=>{const c=document.getElementById("btnRefreshClientIconMobile");c&&c.classList.add("fa-spin");try{await T(),y("Portal synchronized successfully.","success")}catch{y("Failed to refresh data.","error")}finally{c&&c.classList.remove("fa-spin")}}),document.querySelectorAll(".btn-client-signout").forEach(c=>{c.addEventListener("click",async()=>{a.refreshIntervalId&&clearInterval(a.refreshIntervalId),document.cookie="whiz_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure";try{localStorage.removeItem("whiz_last_role"),sessionStorage.clear()}catch{}window.Clerk&&await window.Clerk.signOut(),window.location.replace("/")})}),document.getElementById("btnRequestProfileUpdate")?.addEventListener("click",()=>{F("support");const c=document.querySelector('#supportRequestForm input[name="subject"]');c&&(c.value=`Profile Information Update Request  -  ${a.currentUser?.fullName||"Client"}`);const v=document.querySelector('#supportRequestForm textarea[name="message"]');v&&(v.value=`Please describe the profile fields you would like our administrative team to update (e.g. phone, address, legal entity, tax ID):

- Field to update:
- New value:
- Reason:`,v.focus())}),document.getElementById("supportRequestForm")?.addEventListener("submit",async c=>{c.preventDefault();const v=c.target,E=v.subject.value.trim(),C=v.message.value.trim(),k=document.getElementById("btnSubmitClientSupport");if(!E||!C){y("Please enter both subject and message.","warn");return}O(k,!0,"Sending...");const h=await _("/portal/support/submit",{method:"POST",body:JSON.stringify({subject:E,message:C,email:a.currentUser?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||"",fullName:a.currentUser?.fullName||window.Clerk?.user?.fullName||""})});O(k,!1),h.ok&&h.data?.success?(y("Support request submitted successfully! Our team will review it shortly.","success"),v.reset(),ee()):y(h.data?.error||"Failed to submit request.","error")}),document.getElementById("btnRefreshClientSupport")?.addEventListener("click",()=>{ee(),y("Support history refreshed.","info")}),document.getElementById("btnRefreshClientContentCal")?.addEventListener("click",()=>{ve(!0)}),document.getElementById("btnRefreshClientDashboard")?.addEventListener("click",async()=>{const c=document.getElementById("btnRefreshClientIcon");c&&c.classList.add("fa-spin");try{await T(),y("Dashboard synchronized successfully.","success")}catch{y("Failed to refresh data.","error")}finally{c&&c.classList.remove("fa-spin")}}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&!a.isRefreshing&&a.currentUser&&T(!0)}),window.addEventListener("focus",()=>{!a.isRefreshing&&a.currentUser&&T(!0)}),a.refreshIntervalId&&clearInterval(a.refreshIntervalId),a.refreshIntervalId=setInterval(()=>{document.visibilityState==="visible"&&!a.isRefreshing&&a.currentUser&&T(!0)},25e3);const m=document.getElementById("formClientProfile");m&&(m.addEventListener("submit",fe),m.querySelectorAll("input, select, textarea").forEach(c=>{c.addEventListener("input",X)}));const x=document.getElementById("btnSaveClientProfile");x&&x.addEventListener("click",fe),document.getElementById("btnCloseProfileRequiredModal")?.addEventListener("click",()=>{document.getElementById("modalProfileRequired")?.classList.add("hidden")});const u=document.getElementById("btnOpenPasswordModal"),p=document.getElementById("modalClientPassword"),w=document.getElementById("btnClosePasswordModal"),I=document.getElementById("btnCancelPasswordModal"),L=document.getElementById("formClientPassword"),Ee=document.getElementById("btnOpenClerkSecurityProfile");u&&u.addEventListener("click",()=>{Z();const c=document.getElementById("passwordErrorMsg");c&&c.classList.add("hidden"),L&&L.reset(),p?.classList.remove("hidden")});const te=()=>{p?.classList.add("hidden")};w&&w.addEventListener("click",te),I&&I.addEventListener("click",te),Ee&&Ee.addEventListener("click",()=>{window.Clerk&&typeof window.Clerk.openUserProfile=="function"?window.Clerk.openUserProfile():y("Clerk User Profile is loading. Please try again.","info")}),L&&L.addEventListener("submit",async c=>{c.preventDefault();const v=window.Clerk?.user;if(!v){y("Authentication session not loaded.","error");return}const E=document.getElementById("inputCurrentPassword"),C=document.getElementById("inputNewPassword"),k=document.getElementById("inputConfirmPassword"),h=document.getElementById("passwordErrorMsg"),M=document.getElementById("btnSubmitPassword"),j=E?E.value:"",S=C?C.value:"",A=k?k.value:"";if(h&&h.classList.add("hidden"),S.length<8){h&&(h.textContent="New password must be at least 8 characters.",h.classList.remove("hidden"));return}if(S!==A){h&&(h.textContent="Passwords do not match. Please verify.",h.classList.remove("hidden"));return}M&&(M.disabled=!0,M.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...');try{if(!!v.passwordEnabled){if(!j)throw new Error("Please enter your current password.");await v.updatePassword({currentPassword:j,newPassword:S,signOutOfOtherSessions:!1}),y("Account password changed successfully!","success")}else await v.createPassword({newPassword:S,signOutOfOtherSessions:!1}),y("Account password set successfully! You can now log in with email/password.","success");te(),Z()}catch(P){console.error("Password operation error:",P);const $=P?.errors?.[0]?.message||P.message||"Failed to update password.";h?(h.textContent=$,h.classList.remove("hidden")):y($,"error")}finally{M&&(M.disabled=!1,M.innerHTML='<i class="fa-solid fa-check"></i> <span id="btnSubmitPasswordText">Save Password</span>')}});function Me(){const c=document.getElementById("clientReviewStarGroup"),v=document.getElementById("clientReviewRatingVal"),E=document.getElementById("clientReviewRatingLabel"),C=document.getElementById("clientReviewForm"),k=document.getElementById("clientReviewName"),h=document.getElementById("btnRefreshClientReviews"),M={1:"1 Star - Unsatisfactory",2:"2 Stars - Needs Improvement",3:"3 Stars - Satisfactory",4:"4 Stars - Great Results",5:"5 Stars - Outstanding"};function j(S){if(!c)return;c.querySelectorAll(".client-star-btn").forEach(P=>{Number(P.dataset.rating)<=S?(P.textContent="\u2605",P.className="client-star-btn text-2xl text-amber-400 focus:outline-none hover:scale-110 transition-transform"):(P.textContent="\u2606",P.className="client-star-btn text-2xl text-slate-300 focus:outline-none hover:scale-110 transition-transform")}),v&&(v.value=S),E&&(E.textContent=M[S]||`${S} Stars`)}c&&c.querySelectorAll(".client-star-btn").forEach(S=>{S.addEventListener("click",()=>{const A=Number(S.dataset.rating)||5;j(A)})}),k&&!k.value&&(k.value=a.currentUser?.fullName||window.Clerk?.user?.fullName||""),C&&C.addEventListener("submit",async S=>{S.preventDefault();const A=S.target,P=A.clientName.value.trim()||a.currentUser?.fullName||window.Clerk?.user?.fullName||"Verified Client",$=A.role?.value.trim()||"Verified Client",Ce=A.service?.value.trim()||"Digital Marketing Retainer",Se=Number(A.rating?.value)||5,se=A.reviewText?.value.trim(),ae=document.getElementById("btnSubmitClientReview");if(!se){y("Please enter your review feedback.","warn");return}O(ae,!0,"Submitting...");try{const ie=await fetch("/api/submit-review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientName:P,reviewText:se,rating:Se,service:Ce,role:$,email:a.currentUser?.email||window.Clerk?.user?.primaryEmailAddress?.emailAddress||""})}),oe=await ie.json();if(O(ae,!1),ie.ok&&oe.success){y("Review submitted securely! Dispatched to moderation queue.","success");const Ie=`whiz_client_reviews_${a.currentUser?.email||"anon"}`;let re=[];try{re=JSON.parse(localStorage.getItem(Ie)||"[]")}catch{}re.unshift({id:oe.id||`rev_${Date.now()}`,clientName:P,role:$,service:Ce,rating:Se,reviewText:se,moderation_status:"pending",timestamp:new Date().toISOString()}),localStorage.setItem(Ie,JSON.stringify(re)),A.reset(),j(5),k&&(k.value=a.currentUser?.fullName||window.Clerk?.user?.fullName||""),ne()}else y(oe.error||"Failed to submit review.","error")}catch{O(ae,!1),y("Network error while submitting review.","error")}}),h&&h.addEventListener("click",()=>{ne(),y("Review submissions updated.","info")}),ne()}function ne(){const c=document.getElementById("clientReviewsHistoryContainer");if(!c)return;const v=`whiz_client_reviews_${a.currentUser?.email||"anon"}`;let E=[];try{E=JSON.parse(localStorage.getItem(v)||"[]")}catch{}if(E.length===0){c.innerHTML=`
          <div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">
            No previous review submissions recorded for this account.
          </div>
        `;return}c.innerHTML=E.map(C=>{const k=C.timestamp?new Date(C.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Recently",h="\u2605".repeat(Math.min(5,Math.max(1,C.rating)))+"\u2606".repeat(5-Math.min(5,Math.max(1,C.rating)));return`
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#E3E9EF] space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span class="text-xs font-bold text-[#172B36]">${b(C.service||"Growth Service")}</span>
                <span class="text-[11px] text-slate-500 block">${k}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-amber-400 text-sm tracking-wider">${h}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  <i class="fa-solid fa-clock mr-1"></i>Moderation Queue
                </span>
              </div>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">${b(C.reviewText)}</p>
          </div>
        `}).join("")}window.addEventListener("storage",c=>{c.key==="whiz_synced_ledger_records"&&T(!0),c.key==="whiz_invoice_daily_rate_limit"&&R()}),le(),Me(),ye()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",we):we()})();
