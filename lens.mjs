import {createClient,element as el} from './client.mjs';
import {filterRows,selection,presentation,moveFocus,conditionLabel,focusToken} from './model.mjs';
const $=id=>document.getElementById(id);let page='card',query='',client;
const date=value=>value?new Date(value).toLocaleString():'Unknown';
function error(text){$('lens-message').textContent=text;$('lens-message').hidden=false;}
async function act(operation,fields){try{await client.mutate(operation,fields);$('lens-message').hidden=true;return true;}catch{return false;}}
function button(label,action,primary=false){const b=el('button',primary?'primary':'',label);b.dataset.focus=focusToken(label);b.disabled=!client.online||client.busy;b.addEventListener('click',action);return b;}
function go(next){page=next;render(client.state,client.online,client.busy);$('lens-content').querySelector('input,button')?.focus();}
function back(host){const b=button('← Back to card',()=>go('card'));b.className='return';host.append(b);}
function render(state,online,busy){
 if(online&&$('lens-message').textContent.startsWith('Local service disconnected.'))$('lens-message').hidden=true;
 $('lens-connection').textContent=online?'SYNTHETIC TEST':'DEMO PAUSED';$('lens-connection').className='status'+(online?'':' offline');$('lens-sync').textContent=state?`DEMO revision ${state.revision} · resets on reload`:'Awaiting local Mac service';
 for(const nav of document.querySelectorAll('nav button'))nav.setAttribute('aria-current',nav.dataset.page===page?'page':'false');
 const host=$('lens-content'),focused=document.activeElement;const activeFocus=focused?.dataset?.focus;const searchFocused=focused?.id==='lens-search',start=searchFocused?focused.selectionStart:null;
 host.replaceChildren();if(!state){const box=el('div','empty');box.append(el('h1','','Your catalog, in focus.'),el('p','','Open the local dashboard to start. This companion needs the same Mac service.'));host.append(box);return;}
 const row=selection(state);
 if(page==='find'){
  host.append(el('p','eyebrow','FIND AN EXACT PRINTING'),el('h2','','Synthetic demo cards'));const input=el('input');input.id='lens-search';input.type='search';input.placeholder='Name, set, number or SKU';input.value=query;input.setAttribute('aria-label','Search shared catalog');input.addEventListener('input',()=>{query=input.value;render(state,online,busy);});host.append(input);
  const list=el('div','list');for(const item of filterRows(state.rows,query).slice(0,12)){const b=button(item.identity.name,async()=>{if(await act('select',{row_id:item.row_id}))go('card');});b.append(el('small','',`${item.identity.set} · #${item.identity.number} · ${item.identity.finish}`));b.dataset.focus='row-'+item.row_id;list.append(b);}host.append(list,el('p','hint','Searches the synthetic demo cards. Demo actions reset on reload. No camera capture.'));back(host);
 }else if(page==='queue'){
  host.append(el('p','eyebrow','SYNTHETIC REVIEW QUEUE'),el('h2','',`${state.rows.filter(r=>r.in_review).length} cards in review`));const list=el('div','list');for(const item of state.rows.filter(r=>r.in_review)){const b=button(item.identity.name,async()=>{if(await act('select',{row_id:item.row_id}))go('card');});b.append(el('small','',item.evaluation.eligible?'Synthetic example · demo review only':'Held · '+item.evaluation.holds[0]));b.dataset.focus='row-'+item.row_id;list.append(b);}host.append(list,el('p','hint',`${state.approved_batches.length} demo handoffs. No catalog, Grok or Square connection.`));back(host);
 }else if(page==='sources'&&row){
  host.append(el('p','eyebrow','EXACT PRINTING · RECORDED SOURCES'),el('h2','',row.identity.name));for(const provider of ['collectr','tcgplayer']){const q=row.quotes.find(q=>q.provider===provider),part=el('div','source');part.append(el('strong','',provider==='collectr'?'Collectr':'TCGplayer'),el('span','amount',q?`$${q.amount||'—'}`:'—'));if(q)part.append(el('small','',`Observed ${date(q.observed_at)}`),el('small','',`Source ${date(q.source_at)}`),el('p','',q.basis==='ungraded-unsplit'?'Raw price · not split by condition':'Exact condition stated'));else part.append(el('p','','Quote unavailable'));host.append(part);}host.append(el('p','hint','Invented fixed examples. No provider lookup. Dates are demonstration labels.'));back(host);
 }else if(row){
  const top=el('div','card-head');top.append(el('p','eyebrow',row.identity.game.toUpperCase()+' · EXACT PRINTING'),el('h1','',row.identity.name),el('p','identity-line',`${row.identity.set} · #${row.identity.number}${row.identity.printed_total?'/'+row.identity.printed_total:''}`),el('p','identity-line',`${row.identity.language} · ${row.identity.finish} · ${conditionLabel(row.identity)}`));host.append(top);
  const view=presentation(row,online,'trade-v1');if(view.price){host.append(el('div','price',view.price),el('p','price-label','Invented demo value · not a live price'),el('p','policy','SYNTHETIC TEST · no inventory connection'));}else{const hold=el('div','hold',view.status);for(const reason of view.holds.slice(0,2))hold.append(el('p','',reason));host.append(hold);}
  const actions=el('div','main-actions'),review=button(row.in_review?'Remove from review':'Add to review',()=>act('review',{row_id:row.row_id,in_review:!row.in_review}),true);review.dataset.focus='review';actions.append(review,button('Sources',()=>go('sources')));host.append(actions);
  host.append(el('p','hint',row.source.reference.includes('SYNTHETIC')?'SYNTHETIC EXAMPLE · invented card and prices':'Source record only · not certified store stock'));
 }else{const box=el('div','empty');box.append(el('div','symbol','◈'),el('p','eyebrow','A WINDOW INTO YOUR WORKSPACE'),el('h1','','Your next card.\nIn focus.'),el('p','','Select a card on the dashboard or find one in your shared catalog.'),button('Find a card',()=>go('find'),true),el('p','hint','Local-only connection. Physical glasses hosting and pairing come later.'));host.append(box);}
 if(searchFocused){const input=$('lens-search');input?.focus({preventScroll:true});input?.setSelectionRange(start,start);}else if(activeFocus)host.querySelector('[data-focus="'+CSS.escape(activeFocus)+'"]')?.focus({preventScroll:true});
}
for(const nav of document.querySelectorAll('nav button'))nav.addEventListener('click',()=>go(nav.dataset.page));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();go('card');return;}
 if(!event.key.startsWith('Arrow')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const controls=[...document.querySelectorAll('button:not(:disabled),input,a')].filter(x=>x.getClientRects().length>0);const index=controls.indexOf(document.activeElement);const next=moveFocus(index,controls.length,event.key);if(next>=0){event.preventDefault();controls[next].focus();}
});
client=createClient(render,error);
