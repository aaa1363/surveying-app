import { runAllPricingEngineTests } from './pricingEngine.test';
import { runStage4IntegrationTests } from './stage4Integration.test';
const pure=runAllPricingEngineTests(); const integration=await runStage4IntegrationTests(); const results=[...pure.results,...integration.results];
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results},null,2));
if(results.some(r=>!r.passed)) process.exitCode=1;
