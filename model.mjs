const fold=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase();
export const conditionLabel=identity=>identity.condition==='GRADED'?`${identity.grader} ${identity.grade}`:identity.condition;
export function identityDescription(identity){return `${identity.name} · ${identity.game} · ${identity.set} · #${identity.number}${identity.printed_total?'/'+identity.printed_total:''} · ${identity.language} · ${identity.finish} · ${conditionLabel(identity)}`;}
export function focusToken(label){return 'control:'+label;}
export function manualRow(values,rowId){
 const get=key=>String(values[key]??'').trim();const checked=key=>values[key]==='on'||values[key]===true;
 const identity=Object.fromEntries(['game','set','name','number','printed_total','language','finish','condition'].map(key=>[key,get(key)]));identity.grader='';identity.grade='';
 const quotes=[];for(const provider of ['collectr','tcgplayer']){
  if(!get(provider+'_amount'))continue;
  const at=get(provider+'_at')?new Date(get(provider+'_at')).toISOString():'';
  const sourceAt=get(provider+'_source_at')?new Date(get(provider+'_source_at')).toISOString():at;
  quotes.push({provider,amount:get(provider+'_amount'),currency:'USD',observed_at:at,source_at:sourceAt,url:get(provider+'_url'),basis:provider==='collectr'?get('collectr_basis'):'stated',confirmed:checked('quotes_verified'),identity:{...identity}});
 }
 const verified=checked('physical_verified');return {schema_version:1,row_id:rowId,identity,binding:null,quotes,source:{reference:get('reference'),quantity:Number(get('quantity')),language_verified:verified,finish_verified:verified,condition_verified:verified},holds:[]};
}
export function filterRows(rows,query='',mode='all'){
 const tokens=fold(query).trim().split(/\s+/).filter(Boolean);
 return rows.filter(row=>tokens.every(token=>fold(Object.values(row.identity).join(' ')+' '+row.row_id+' '+(row.binding?.sku??'')).includes(token))&&(mode!=='held'||!row.evaluation.eligible)&&(mode!=='review'||row.in_review));
}
export function selection(state){return state?.rows?.find(row=>row.row_id===state.selected_row_id)??null;}
export function command(revision,operation,fields,id=crypto.randomUUID()){
 if(!Number.isInteger(revision)||revision<0||!['select','review','import','approve'].includes(operation))throw new Error('Invalid local action');
 if(Object.hasOwn(fields,'expected_revision')||Object.hasOwn(fields,'command_id'))throw new Error('Reserved command fields');
 return {expected_revision:revision,command_id:id,...fields};
}
export function moveFocus(index,count,key){
 if(count===0)return -1;
 const delta=['ArrowDown','ArrowRight'].includes(key)?1:['ArrowUp','ArrowLeft'].includes(key)?-1:0;
 return delta?(index+delta+count)%count:index;
}
export function presentation(row,online,policy='trade-v1'){
 const cents=online&&row?.evaluation?.eligible?row.evaluation[policy==='singles-v1'?'singles_cents':'trade_cents']:null;
 return {price:Number.isSafeInteger(cents)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100):null,status:!online?'Local service disconnected':!row?'Choose a card':row.evaluation.holds.length?'Needs review':cents===null?'Policy unavailable':'Recorded quotes',holds:row?.evaluation?.holds??[]};
}
