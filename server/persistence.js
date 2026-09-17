/** Server-only durable state adapter. Dedicated Supabase project; single app instance. */
export function createSupabaseStore(env=process.env,request=fetch){
 const url=env.SUPABASE_URL?.trim(),key=env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g,'');
 if(!url&&!key)return null;
 if(!url||!key)throw new Error('Supabase configuration is incomplete');
 const origin=new URL(url);if(origin.protocol!=='https:'||!origin.hostname.endsWith('.supabase.co')||origin.pathname!=='/')throw new Error('Invalid Supabase project URL');
 const headers={apikey:key,'Content-Type':'application/json',...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{})};
 let revision=0;
 async function call(path,body){let r;try{r=await request(origin.origin+'/rest/v1/'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});}catch{throw new Error('Durable storage connection failed; check server configuration and network');}if(!r.ok)throw new Error('Durable storage unavailable ('+r.status+')');return r.json();}
 return {async read(){const rows=await call('rasid_state?id=eq.main&select=payload,revision');if(!Array.isArray(rows)||rows.length>1)throw new Error('Invalid durable state');if(!rows.length)return null;const row=rows[0];if(!Number.isSafeInteger(row.revision)||!row.payload||typeof row.payload!=='object'||!row.payload.users)throw new Error('Invalid durable state');revision=row.revision;return row.payload;},async write(payload){const next=await call('rpc/rasid_save_state',{expected_revision:revision,new_payload:payload});if(!Number.isSafeInteger(next)||next!==revision+1)throw new Error('Invalid durable state revision');revision=next;}};
}
