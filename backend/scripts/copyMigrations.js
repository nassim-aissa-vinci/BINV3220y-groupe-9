// tsc ne copie pas les fichiers .sql : on les place à côté du code compilé.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const source = "src/db/migrations";
const destination = "dist/db/migrations";

mkdirSync(destination, { recursive: true });
for (const migration of readdirSync(source)) {
  copyFileSync(join(source, migration), join(destination, migration));
}
