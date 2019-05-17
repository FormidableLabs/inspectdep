"use strict";

const path = require("path");
const { readJson, findPkg } = require("./util");


// Recursively traverse package.json + path to resolve all on-disk locations
const resolveLocations = async ({ rootPath, curPath, pkg }) => {
  // Production dependencies include both production and optional if found.
  const names = []
    .concat(Object.keys(pkg.dependencies || {}))
    .concat(Object.keys(pkg.optionalDependencies || {}));

  const locs = await Promise.all(names.map(async (name) => {
    const isOptional = !(pkg.dependencies || {})[name];

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
 * **Note**: This includes all `dependencies` and `optionalDependencies`.
 *
 * @param {*}       opts          options object
 * @param {string}  opts.rootPath `node_modules` root location (default: `process.cwd()`)
 * @returns {Promise<Array<String>>} list of relative paths to on-disk dependencies.
 */
const findProdInstalls = async ({ rootPath } = {}) => {
  rootPath = path.resolve(rootPath || ".");

  let pkg;
  try {
    pkg = await readJson(path.resolve(rootPath, "package.json"));
  } catch (err) {
    // Enhance the error for consumers.
    if (err.code === "ENOENT") {
      throw new Error(`Unable to find root package.json at: ${rootPath}`);
    }
    throw err;
  }

  return resolveLocations({ pkg, rootPath, curPath: rootPath });
};

module.exports = {
  findProdInstalls
};
