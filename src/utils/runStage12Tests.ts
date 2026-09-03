import {runStage12Tests} from './stage12Integration.test';
const results=await runStage12Tests();
results.forEach((result,index)=>console.log(`${result.passed?'✅':'❌'} Stage 12 ${index+1}: ${result.title} - ${result.message}`));
if(results.some(result=>!result.passed))process.exitCode=1;
console.log(`Stage 12: ${results.filter(result=>result.passed).length}/${results.length}`);
