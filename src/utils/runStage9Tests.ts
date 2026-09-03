import { runStage9IntegrationTests } from './stage9Integration.test';
const results=await runStage9IntegrationTests();
results.forEach((result,index)=>console.log(`${result.passed?'✅':'❌'} مرحله ۹ آزمون ${index+1}: ${result.title} - ${result.message}`));
console.log(`Stage 9: ${results.filter(r=>r.passed).length}/${results.length}`);
if(results.some(r=>!r.passed)) process.exitCode=1;
