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
        curPath = path.dirname(curPath);
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
  // Production dependencies include both production and optional if found.
  const names = []
    .concat(Object.keys(pkg.dependencies || {}))
    .concat(Object.keys(pkg.optionalDependencies || {}));

  const locs = await Promise.all(names.map(async (name) => {
    const isOptional = !pkg.dependencies[name];

    // Find current package.
    const found = await findPkg({ rootPath, curPath, name });
    if (!found) {
      // TODO: Handle not found and/or filter nulls.
      // eslint-disable-next-line no-console
      console.log("TODO HANDLE NOT FOUND", { rootPath, curPath, name, isOptional });
      return null;
    }

    // Recurse into dependencies.
    const deps = await resolveLocations({ rootPath, curPath: found.loc, pkg: found.pkg });

    return [path.relative(rootPath, found.loc)].concat(deps);
  }));

  return locs
    // Flatten sub-arrays.
    .reduce((m, a) => m.concat(a), [])
    // Remove dependencies we didn't find (`null`)
    .filter((item) => !!item)
    // By sorting, we can filter duplicates just looking one behind.
    .sort()
    .filter((item, i, items) => item !== items[i - 1]);
};

/**
 * Find on-disk locations of all production dependencies in `node_modules`.
 *
 * @param {*}       opts          options object
 * @param {string}  opts.rootPath `node_modules` root location (default: `process.cwd()`)
 * @returns {Promise<Array<String>>} list of relative paths to on-disk dependencies.
 */
const production = async ({ rootPath }) => {
  rootPath = path.resolve(rootPath || ".");

  const pkg = await readJson(path.resolve(rootPath, "package.json"));
  const locs = await resolveLocations({ pkg, rootPath, curPath: rootPath });

  return locs;
};

module.exports = {
  production
};
