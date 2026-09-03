import { runStage15IntegrationTests } from './stage15Integration.test';
const results = await runStage15IntegrationTests();
results.forEach((item, index) => console.log(`${item.passed ? '✅' : '❌'} Stage 15 ${index + 1}: ${item.name}`));
const failed = results.filter(item => !item.passed);
console.log(`Stage 15: ${results.length - failed.length}/${results.length}`);
if (failed.length) process.exitCode = 1;
