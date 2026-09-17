import {hasAI} from './subjects.js';
export function installVision(app,{db,save,requireUser}){
 const permit=(req,res,next)=>hasAI(req.user)?next():res.status(403).json({error:'subject_restricted'});
 app.get('/api/lab/vision',requireUser,permit,(req,res)=>res.json({workspace:req.user.visionLab||null}));
 app.post('/api/lab/vision',requireUser,permit,(req,res)=>{const {code,reflection,config}=req.body;if(typeof code!=='string'||code.length>10000||typeof reflection!=='string'||reflection.length>1500||!config||!Number.isFinite(config.threshold)||config.threshold<0||config.threshold>1||['liveness','badge','hours'].some(k=>typeof config[k]!=='boolean'))return res.status(400).json({error:'invalid_workspace'});req.user.visionLab={code,reflection,config:{threshold:config.threshold,liveness:config.liveness,badge:config.badge,hours:config.hours},updatedAt:new Date().toISOString()};save();res.json({ok:true});});
}
