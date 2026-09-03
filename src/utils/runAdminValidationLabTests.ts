import { runAdminValidationLabTests } from './adminValidationLab.test';
const results=await runAdminValidationLabTests();results.forEach((r,i)=>console.log(`${r.passed?'✅':'❌'} Admin Lab ${i+1}: ${r.title} - ${r.message}`));console.log(`Admin Lab: ${results.filter(r=>r.passed).length}/${results.length}`);if(results.some(r=>!r.passed))process.exitCode=1;
