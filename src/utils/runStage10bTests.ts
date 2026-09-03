import { runStage10bIntegrationTests } from './stage10bIntegration.test';
const results=await runStage10bIntegrationTests();results.forEach((r,i)=>console.log(`${r.passed?'✅':'❌'} مرحله ۱۰b آزمون ${i+1}: ${r.title} - ${r.message}`));console.log(`Stage 10b: ${results.filter(r=>r.passed).length}/${results.length}`);if(results.some(r=>!r.passed))process.exitCode=1;
