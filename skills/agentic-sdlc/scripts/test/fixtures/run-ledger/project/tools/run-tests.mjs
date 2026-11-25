// Fixture test runner: red while a file named RED exists at the project root.
import { existsSync } from 'node:fs';
if (existsSync('RED')) {
  console.error('FAIL AC-1 greets by name: expected "Hello, Ada" got "Hello"');
  process.exit(1);
}
console.log('ok 1 AC-1 greets by name');
