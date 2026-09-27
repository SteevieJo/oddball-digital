'use strict'; const fs=require('fs'),{runBatch}=require('./sim_engine');
let n=Math.max(1,Math.min(100000,parseInt(process.argv[2]||'1000',10)||1000)),seed=parseInt(process.argv[3]||'138',10)||138,out=process.argv[4]||`oddball_sim_${n}.json`;
let t=Date.now(),r=runBatch(n,seed);fs.writeFileSync(out,JSON.stringify(r,null,2));console.log(`Oddball v1.39 — ${n} simulations en ${((Date.now()-t)/1000).toFixed(2)} s`);console.log(r.summary);console.log(`Export: ${out}`);
