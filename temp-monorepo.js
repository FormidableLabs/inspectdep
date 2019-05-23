"use strict";

/**
 * TODO: REMOVE THIS FILE!!!!
 *
 * Testing ground for monorepo support...
 */
const path = require("path");
const { findProdInstalls } = require(".");

const { REPO } = process.env;
if (!REPO) {
  throw new Error("Must specify repository root");
}

const main = async () => {
  const rootFiles = await findProdInstalls({ rootPath: REPO });
  const fnFiles = await findProdInstalls({
    rootPath: REPO,
    curPath: path.resolve(REPO, "backend/functions/ncr-menus")
  });

  // eslint-disable-next-line no-console,no-magic-numbers
  console.log("TODO HERE", JSON.stringify({ rootFiles, fnFiles }, null, 2));
};

if (require.main === module) {
  const start = new Date();
  main()
    .then(() => { // eslint-disable-line promise/always-return
      // eslint-disable-next-line no-console
      console.log(`Elapsed ms: ${(new Date() - start)}`);
    })
    .catch((err) => {
      console.error(err); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
