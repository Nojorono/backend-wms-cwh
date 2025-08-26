const ScaffoldGenerator = require('./scaffold-generator');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node generate-scaffold.js <moduleName> <entityName>');
  console.log('');
  console.log('Example:');
  console.log('  node generate-scaffold.js masterProduct Product');
  console.log('');
  process.exit(1);
}

const moduleName = args[0];
const entityName = args[1];


const generator = new ScaffoldGenerator();
generator.generateScaffold(moduleName, entityName);

console.log('');
console.log('🎉 Scaffold generation completed!');
console.log('');
console.log('Next steps:');
console.log('1. Review the generated files');
console.log('2. Update the entity fields as needed');
console.log('3. Create database migration if required');
console.log('4. Test the API endpoints'); 