"use strict";

const path = require("path");
const { promisify } = require("util");
const fs = require("fs");

const readFile = promisify(fs.readFile);
const readJson = async (filePath) => JSON.parse(await readFile(filePath));
const stat = promisify(fs.stat);
const exists = (filePath) => stat(filePath)
  .then(() => true)
  .catch((err) => {
    if (err.code === "ENOENT") { return false; }
    throw err;
  });

// TODO: REMOVE
const counters = {
  cacheFound: 0,
  cacheNotFound: 0,
  diskFound: 0,
  diskNotFound: 0
}

// Return location and data from package json on disk.
//
// Iterates from curPath up to rootPath.
// eslint-disable-next-line max-statements
const findPkg = async ({ rootPath, curPath, name, pkgCache }) => {
  let loc;
  let pkg;

  while (curPath.length >= rootPath.length) {
    loc = path.join(curPath, "node_modules", name);
    const pkgPath = path.join(loc, "package.json");

    // Try cache.
    if (pkgCache) {
      if (pkgCache[pkgPath]) {
        // Cache holds package
        console.log(counters.cacheFound++, "TODO ID CACHE FOUND", name, loc);
        return { pkg: pkgCache[pkgPath], loc };
      } else if (pkgCache[pkgPath] === null) {
        // Cache holds "not found"
        console.log(counters.cacheNotFound++, "TODO ID CACHE NOT FOUND", name, loc);
        curPath = path.dirname(curPath);
        continue;
      }
    }

    // Read from disk.
    try {
      pkg = await readJson(path.join(loc, "package.json"));
      console.log(counters.diskFound++, "TODO ID DISK FOUND", name, loc);
      if (pkgCache) {
        pkgCache[pkgPath] = pkg;
      }
      return { pkg, loc };
    } catch (err) {
      console.log(counters.diskNotFound++, "TODO ID DISK NOT FOUND", name, loc);
      // Decrement path and try again if not found.
      if (err.code === "ENOENT") {
        if (pkgCache) {
          pkgCache[pkgPath] = null;
        }
        curPath = path.dirname(curPath);
        continue;
      }

      // Otherwise, we have a real error.
      throw err;
    }
  }

  return null;
};

module.exports = {
  exists,
  readJson,
  findPkg
};
