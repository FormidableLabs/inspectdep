"use strict";

const path = require("path");
const { promisify } = require("util");
const fs = require("fs");

const readFile = promisify(fs.readFile);
const readJson = async (filePath) => JSON.parse(await readFile(filePath));

// Return location and data from package json on disk.
//
// Iterates from curPath up to rootPath.
const findPkg = async ({ rootPath, curPath, name }) => {
  let loc;
  let pkg;

  while (curPath.length >= rootPath.length) {
    loc = path.join(curPath, "node_modules", name);
    try {
      pkg = readJson(path.join(loc, "package.json"));
      return { dependencies: pkg.dependencies, loc };
    } catch (err) {
      console.log(err); // TODO HANDLE NOTFOUND VS OTHER
    }

    // Decrement path and try again.
    curPath = path.basename(curPath);
  }

  return { dependencies: null, loc: null };
};

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
  const pkg = await readJson(pkgPath);
  const deps = Promise.all(Object.keys(pkg.dependencies || {}).map(async (name) => {
    const { dependencies, loc } = await findPkg({
      rootPath,
      curPath,
      name
    });

    // TODO: RECURSE INTO EACH DEPENDENCY.
    return path.relative(rootPath, loc);
  }));

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
