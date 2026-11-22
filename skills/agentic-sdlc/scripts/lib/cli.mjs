// Shared CLI conventions for agentic-sdlc scripts (Node >= 18, no dependencies).
// Exit codes: 0 pass, 1 check failed, 2 input missing or unparsable, 3 bound reached.

export const EXIT = Object.freeze({ PASS: 0, FAIL: 1, INPUT: 2, BOUND: 3 });

export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
    this.exitCode = EXIT.INPUT;
  }
}

export class BoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoundError';
    this.exitCode = EXIT.BOUND;
  }
}

// Parses argv into { flags, positional }. Supports --flag, --key=value, --key value
// (when the next token does not start with "--") and "--" to end flag parsing.
export function parseArgs(argv = process.argv.slice(2), { booleans = ['json', 'help'] } = {}) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (booleans.includes(body)) {
        flags[body] = true;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        flags[body] = argv[++i];
      } else {
        flags[body] = true;
      }
    } else {
      positional.push(token);
    }
  }
  return { flags, positional };
}

// Prints a result as JSON (when json is true) or as text lines, and returns the exit code.
export function report({ ok, code, json = false, result = {}, lines = [] }, out = process.stdout) {
  const exitCode = code ?? (ok ? EXIT.PASS : EXIT.FAIL);
  if (json) {
    out.write(JSON.stringify({ ok: exitCode === EXIT.PASS, exitCode, ...result }, null, 2) + '\n');
  } else {
    for (const line of lines) out.write(line + '\n');
  }
  return exitCode;
}

// Runs main() and maps thrown errors to the exit-code convention.
export async function run(main, err = process.stderr) {
  try {
    const code = await main();
    process.exitCode = typeof code === 'number' ? code : EXIT.PASS;
  } catch (e) {
    err.write(`${e.name || 'Error'}: ${e.message}\n`);
    process.exitCode = e.exitCode ?? EXIT.INPUT;
  }
  return process.exitCode;
}
