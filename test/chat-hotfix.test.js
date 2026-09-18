import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {respond} from '../server/agents/service.js';
test('Lesson example is a concrete scenario, not a copied lesson, in both languages',async()=>{for(const lang of ['en','ar']){const u={email:'test@example.test',role:'admin',level:'beginner',lang,course:{modules:{}}};const r=await respond({users:{[u.email]:u}},u,{question:lang==='en'?'Give an example of this concept':'أعطني مثالاً على هذا المفهوم',lessonId:'b6-1',agent:'tutor',lang});assert.match(r.text,lang==='en'?/Dubai office/:/مكتب دبي/);assert.equal(r.learningContext.conceptId,'hallucination');}});
