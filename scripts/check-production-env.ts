import { assertProductionEnvironment } from "../src/lib/server-env";

if (process.env.APP_ENV !== "production") {
  throw new Error("APP_ENV doit valoir production pour exécuter ce contrôle.");
}

assertProductionEnvironment();
console.log("Configuration de production valide.");
