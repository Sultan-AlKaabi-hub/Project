import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseStore} from '../server/persistence.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test'};
test('Durable store validates configuration, uses only server key, and advances conditional revisions',async()=>{
 assert.equal(createSupabaseStore({}),null);assert.throws(()=>createSupabaseStore({SUPABASE_URL:env.SUPABASE_URL}));assert.throws(()=>createSupabaseStore({...env,SUPABASE_URL:'http://localhost'}));
 const calls=[];const store=createSupabaseStore(env,async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>options.method==='GET'?[{payload:{users:{}},revision:4}]:5};});
 assert.deepEqual(await store.read(),{users:{}});await store.write({users:{student:{role:'student'}}});assert.equal(calls[0].options.headers.apikey,env.SUPABASE_SERVICE_ROLE_KEY);assert.ok(!calls[0].url.includes(env.SUPABASE_SERVICE_ROLE_KEY));assert.equal(JSON.parse(calls[1].options.body).expected_revision,4);
});
test('Durable storage rejects stale revisions and hides upstream error details',async()=>{
 const store=createSupabaseStore(env,async()=>({ok:false,status:409,json:async()=>({secret:'private data'})}));await assert.rejects(store.read(),{message:'Durable storage unavailable (409)'});
 const invalid=createSupabaseStore(env,async()=>({ok:true,json:async()=>99}));await assert.rejects(invalid.write({users:{}}),/Invalid durable state revision/);
});
