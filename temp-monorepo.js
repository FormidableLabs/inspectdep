"use strict";

const { findProdInstalls } = require(".");

const { REPO } = process.env;
if (!REPO) {
  throw new Error("Must specify repository root");
}

const main = async () => {
  const files = await findProdInstalls({ rootPath: REPO });
  console.log("TODO HERE", { files }); // eslint-disable-line no-console
};

/**
 * TODO: REMOVE THIS FILE!!!!
 *
 * Testing ground for monorepo support...
 */
if (require.main === module) {
  main().catch((err) => {
    console.error(err); // eslint-disable-line no-console
    process.exit(1); // eslint-disable-line no-process-exit
  });
}
