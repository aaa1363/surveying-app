import {runAndroidConfigurationTests} from './androidConfiguration.test';

const results = runAndroidConfigurationTests();
for (const [index, result] of results.entries()) console.log(`${result.passed ? '✅' : '❌'} Android ${index + 1}: ${result.title} - ${result.message}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
console.log(`Android configuration: ${results.filter(result => result.passed).length}/${results.length}`);
