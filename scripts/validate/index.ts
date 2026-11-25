import { readContent } from '../lib/content-files.ts';
import { validateContent } from './rules.ts';

// npm run validate: checks src/content/ and exits with an error if anything is
// wrong. Runs automatically before `npm run build`.

const content = await readContent();
const { errors, warnings } = validateContent(content);

for (const warning of warnings) console.warn(`⚠ ${warning}`);
for (const error of errors) console.error(`✖ ${error}`);

if (errors.length) {
  console.error(
    `\nContent check failed: ${errors.length} problem${errors.length === 1 ? '' : 's'}.`,
  );
  process.exit(1);
}
console.log(`Content OK: ${content.items.length} items, ${content.mediaFiles.size} media files.`);
