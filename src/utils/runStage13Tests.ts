import { runStage13IntegrationTests } from './stage13Integration.test';
const results=await runStage13IntegrationTests();for(const r of results)console.log(`${r.passed?'✅':'❌'} ${r.name}`);const failed=results.filter(r=>!r.passed);console.log(`Stage 13: ${results.length-failed.length}/${results.length} passed`);if(failed.length)process.exitCode=1;
