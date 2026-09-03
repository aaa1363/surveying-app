import { runAllPricingEngineTests } from './pricingEngine.test';
import { runStage4IntegrationTests } from './stage4Integration.test';
import { runStage5IntegrationTests } from './stage5Integration.test';

const pure = runAllPricingEngineTests();
const stage4 = await runStage4IntegrationTests();
const stage5 = await runStage5IntegrationTests();
const results = [...pure.results, ...stage4.results, ...stage5.results];
console.log(JSON.stringify({ total: results.length, passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length, results }, null, 2));
if (results.some((item) => !item.passed)) process.exitCode = 1;
