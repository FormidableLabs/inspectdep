"use strict";

const path = require("path");

/**
 * Find on-disk locations of all production dependencies in `node_modules`.
 *
 * @param {*}       opts          options object
 * @param {string}  opts.rootPath `node_modules` root location (default: `process.cwd()`)
 * @param {string}  opts.curPath  current search within root (default: `rootPath`)
 * @returns {Promise<Array<String>>} list of relative paths to on-disk dependencies.
 */
const production = async ({ rootPath, curPath }) => {
  rootPath = rootPath || ".";
  curPath = curPath || rootPath;

  const pkgPath = path.resolve(curPath, "package.json");
  const { dependencies } = require(pkgPath);
  const deps = Promise.all(Object.keys(dependencies || {}).map((name) =>
    // TODO: FIND ON DISK ITERATING DOWN.
    // TODO: RECURSE INTO EACH DEPENDENCY.
    path.relative(rootPath, path.resolve(curPath, "node_modules", name))
  ));

  return deps;
};

module.exports = {
  production
};

if (require.main === module) {
  production({ rootPath: "../serverless-jetpack/test/packages/huge/yarn" })
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
