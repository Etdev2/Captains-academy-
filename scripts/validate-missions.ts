import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { lightsMissionSchema } from '../src/sim/lights-mission.ts';
import { missionSchema } from '../src/sim/mission.ts';

// Checks every missions/*.json file against the zod schema. Exits 1 and lists
// each problem when any mission is invalid. Run by scripts/verify.sh.

const dir = join(import.meta.dirname, '..', 'missions');
let problems = 0;
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const data: unknown = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  // Lights rapid-fire levels say so in `kind`; docking missions have no kind.
  const schema =
    typeof data === 'object' && data !== null && 'kind' in data && data.kind === 'lights-rapid-fire'
      ? lightsMissionSchema
      : missionSchema;
  const result = schema.safeParse(data);
  if (result.success) {
    if (`${result.data.id}.json` !== file) {
      console.error(`${file}: id is "${result.data.id}", but the file name must match it.`);
      problems++;
    } else {
      console.log(`ok   ${file}`);
    }
  } else {
    for (const issue of result.error.issues) {
      console.error(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      problems++;
    }
  }
}
if (problems > 0) {
  console.error(`${problems} mission problem(s).`);
  process.exit(1);
}
