#!/usr/bin/env node

export const HELP = `GitSkillPro (gsp)\n\nUsage:\n  gsp doctor [--json]\n  gsp inspect [--json]\n  gsp audit git [--json]\n  gsp plan <intent> [--json]\n`;

export function runCli(argv: string[] = process.argv.slice(2)): number {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(HELP);
    return 0;
  }

  process.stderr.write(`Command not implemented in foundation scaffold: ${argv.join(" ")}\n`);
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli();
}
