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
      pkg = await readJson(path.join(loc, "package.json"));
      return { pkg, loc };
    } catch (err) {
      // Decrement path and try again if not found.
      if (err.code === "ENOENT") {
        curPath = path.basename(curPath);
        continue;
      }

      // Otherwise, we have a real error.
      throw err;
    }
  }

  return null;
};

// Recursively traverse package.json + path to resolve all on-disk locations
const resolveLocations = async ({ rootPath, curPath, pkg }) => {
  const locs = await Promise.all(Object.keys(pkg.dependencies || {}).map(async (name) => {
    // Find current package.
    const found = await findPkg({ rootPath, curPath, name });
    if (!found) {
      console.log("TODO HANDLE NOT FOUND", { rootPath, curPath, name });
      return null;
    }

    // Recurse into dependencies.
    const deps = await resolveLocations({ rootPath, curPath: found.loc, pkg: found.pkg });

    // TODO: RECURSE INTO EACH DEPENDENCY.
    console.log("TODO HERE", { loc: found.loc, deps });

    return path.relative(rootPath, found.loc);
  }));

  // TODO FILTER NULLS
  // TODO FLATTEN ARRAYS (AND SORT?)

  return locs;
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

  const pkg = await readJson(path.resolve(curPath, "package.json"));
  const locs = await resolveLocations({ pkg, rootPath, curPath });

  return locs;
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
