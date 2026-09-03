import { runStage10IntegrationTests } from './stage10Integration.test';
const results=await runStage10IntegrationTests();results.forEach((r,i)=>console.log(`${r.passed?'✅':'❌'} مرحله ۱۰ آزمون ${i+1}: ${r.title} - ${r.message}`));console.log(`Stage 10: ${results.filter(r=>r.passed).length}/${results.length}`);if(results.some(r=>!r.passed))process.exitCode=1;
