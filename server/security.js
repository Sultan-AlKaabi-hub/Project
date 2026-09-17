import crypto from 'node:crypto';
import {checkPin,totp} from './auth.js';
import {mailAvailable,sendOtp} from './mail.js';
const tickets=new Map(),cooldowns=new Map();
const digest=(code,salt)=>crypto.createHash('sha256').update(salt+code).digest('hex');
export function acceptTotp(factor,code,now=Date.now()){
 if(!factor?.secret||!/^\d{6}$/.test(String(code)))return false;
 const step=Math.floor(now/30000),matched=[step-1,step,step+1].find(s=>s>(factor.lastStep??-1)&&totp(factor.secret,s)===String(code));
 if(matched===undefined)return false;factor.lastStep=matched;return true;
}
export const smsAvailable=()=>!!(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_VERIFY_SERVICE_SID);
async function twilio(action,params){
 const r=await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(process.env.TWILIO_VERIFY_SERVICE_SID)}/${action}`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.TWILIO_ACCOUNT_SID+':'+process.env.TWILIO_AUTH_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('delivery_unavailable');return r.json();
}
function prune(){const now=Date.now();for(const [k,v]of tickets)if(v.expires<now)tickets.delete(k);for(const [k,v]of cooldowns)if(v.until<now)cooldowns.delete(k);}
export async function startOtp(user,method,destination,purpose){
 prune();if(method==='email'&&!mailAvailable()||method==='sms'&&!smsAvailable())throw Error('delivery_unavailable');
 const key=user.email+':'+purpose,b=cooldowns.get(key);if(b&&(b.next>Date.now()||b.count>=5))throw Error('rate_limited');
 if(tickets.size>=5000)throw Error('rate_limited');cooldowns.set(key,{until:b?.until||Date.now()+3600000,next:Date.now()+60000,count:(b?.count||0)+1});
 const id=crypto.randomBytes(24).toString('hex'),code=String(crypto.randomInt(1000000)).padStart(6,'0'),salt=crypto.randomBytes(16).toString('hex');
 if(method==='sms')await twilio('Verifications',{To:destination,Channel:'sms'});else await sendOtp(destination,code,user.lang);
 tickets.set(id,{email:user.email,method,destination,purpose,salt,hash:digest(code,salt),attempts:0,expires:Date.now()+300000});return id;
}
export async function finishOtp(id,code,purpose,email){
 prune();const t=tickets.get(id);if(!t||t.purpose!==purpose||email&&t.email!==email||!/^\d{6}$/.test(String(code)))return null;
 if(++t.attempts>5){tickets.delete(id);return null;}
 // Consume before awaiting a provider to prevent concurrent use of a successful challenge.
 tickets.delete(id);let ok=false;
 if(t.method==='sms')ok=(await twilio('VerificationCheck',{To:t.destination,Code:String(code)})).status==='approved';
 else ok=crypto.timingSafeEqual(Buffer.from(t.hash,'hex'),Buffer.from(digest(String(code),t.salt),'hex'));
 if(!ok&&t.attempts<5)tickets.set(id,t);return ok?t:null;
}
export async function captchaCheck(token,action,hostname,fetcher=fetch){
 if(!process.env.TURNSTILE_SITE_KEY&&!process.env.TURNSTILE_SECRET_KEY)return true;
 if(!process.env.TURNSTILE_SECRET_KEY||!process.env.TURNSTILE_SITE_KEY||typeof token!=='string'||token.length>2048)return false;
 try{const r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(10000)});const d=await r.json();return r.ok&&d.success===true&&d.action===action&&d.hostname===hostname;}catch{return false;}
}
export function installSecurity(app,{requireUser,save}){
 app.get('/api/security/config',(req,res)=>res.json({siteKey:process.env.TURNSTILE_SITE_KEY||null,captchaConfigured:!!(process.env.TURNSTILE_SITE_KEY&&process.env.TURNSTILE_SECRET_KEY),emailAvailable:mailAvailable(),smsAvailable:smsAvailable()}));
 app.use(['/api/auth/login','/api/auth/signup','/api/auth/pin/reset-request'],async(req,res,next)=>{if(req.method!=='POST')return next();const host=new URL(process.env.PUBLIC_ORIGIN||req.protocol+'://'+req.get('host')).hostname;if(!await captchaCheck(req.body.captchaToken,'auth',host))return res.status(400).json({error:'captcha_required'});next();});
 app.get('/api/security/otp',requireUser,(req,res)=>res.json({method:req.user.otp?.method||null,destination:req.user.otp?req.user.otp.destination.replace(/.(?=.{4})/g,'*'):null}));
 app.post('/api/security/otp/start',requireUser,async(req,res)=>{
  if(!checkPin(req.body.pin,req.user.pinHash))return res.status(401).json({error:'wrong'});
  if(req.user.totp?.enabled||req.user.otp)return res.status(409).json({error:'factor_already_enabled'});
  const method=req.body.method,destination=method==='email'?req.user.email:req.body.phone;
  if(!['email','sms'].includes(method)||method==='sms'&&!/^\+[1-9]\d{7,14}$/.test(destination||''))return res.status(400).json({error:'invalid_destination'});
  try{res.json({ticket:await startOtp(req.user,method,destination,'enroll')});}catch(e){res.status(503).json({error:e.message==='rate_limited'?'rate_limited':'delivery_unavailable'});}
 });
 app.post('/api/security/otp/confirm',requireUser,async(req,res)=>{try{const t=await finishOtp(req.body.ticket,req.body.code,'enroll',req.user.email);if(!t||req.user.totp?.enabled||req.user.otp)return res.status(400).json({error:'wrong_code'});req.user.otp={method:t.method,destination:t.destination};save();res.json({ok:true});}catch{res.status(503).json({error:'delivery_unavailable'});}});
 app.post('/api/security/otp/disable/start',requireUser,async(req,res)=>{if(!checkPin(req.body.pin,req.user.pinHash)||!req.user.otp)return res.status(401).json({error:'wrong'});try{const f=req.user.otp;res.json({ticket:await startOtp(req.user,f.method,f.destination,'disable')});}catch{res.status(503).json({error:'delivery_unavailable'});}});
 app.post('/api/security/otp/disable',requireUser,async(req,res)=>{try{if(!await finishOtp(req.body.ticket,req.body.code,'disable',req.user.email))return res.status(401).json({error:'wrong_code'});delete req.user.otp;save();res.json({ok:true});}catch{res.status(503).json({error:'delivery_unavailable'});}});
}
