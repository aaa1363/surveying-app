import { runStage7IntegrationTests } from './stage7Integration.test';

async function main() {
  console.log('--- Running Stage 7 Disabled Future Capabilities Tests ---');
  const results = await runStage7IntegrationTests();
  let allPassed = true;
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} آزمون ${result.testNumber}: ${result.title} - ${result.message}`);
    if (!result.passed) allPassed = false;
  }
  if (!allPassed) {
    console.error('\n⚠️ برخی از آزمون‌های مرحله هفتم ناموفق بودند.');
    process.exit(1);
  }
  console.log('\n✨ تمامی آزمون‌های مرحله هفتم با موفقیت پاس شدند.');
}

main().catch((error) => {
  console.error('Error running stage 7 tests:', error);
  process.exit(1);
});

