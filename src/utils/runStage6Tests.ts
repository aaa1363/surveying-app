import { runStage6IntegrationTests } from './stage6Integration.test';

async function main() {
  console.log('--- Running Stage 6 Privacy & Inquiry Tests ---');
  const results = await runStage6IntegrationTests();
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} آزمون ${r.testNumber}: ${r.title} - ${r.message}`);
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n✨ تمامی آزمون‌های حریم خصوصی و استعلام مرحله ششم با موفقیت پاس شدند.');
  } else {
    console.error('\n⚠️ برخی از آزمون‌های مرحله ششم ناموفق بودند.');
    process.exit(1);
  }
}

await main().catch((err) => {
  console.error('Error running stage 6 tests:', err);
  process.exit(1);
});
