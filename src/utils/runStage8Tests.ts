import { runStage8IntegrationTests } from './stage8Integration.test';

async function main() {
  console.log('--- Running Stage 8 Stable Demo Release Tests ---');
  const results = await runStage8IntegrationTests();
  let passed = 0;
  for (const result of results) { console.log(`${result.passed ? '✅' : '❌'} آزمون ${result.testNumber}: ${result.title} - ${result.message}`); if (result.passed) passed += 1; }
  console.log(`Stage 8: ${passed}/${results.length}`);
  if (passed !== results.length) process.exit(1);
}
main().catch((error) => { console.error('Error running stage 8 tests:', error); process.exit(1); });
