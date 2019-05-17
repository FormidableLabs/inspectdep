"use strict";

/* eslint camelcase: ["error", {allow: ["node_modules"]}]*/

const path = require("path");
const mock = require("mock-fs");

const { findProdInstalls } = require("../../lib/production");

// Normalize paths for windows.
const normalize = (arr) => arr.map((item) => path.normalize(item));

describe("lib/production", () => {
  beforeEach(() => {
    mock({});
  });

  afterEach(() => {
    mock.restore();
  });

  describe("findProdInstalls", () => {
    it("throws on empty root directory with default path", () =>
      expect(findProdInstalls()).to.be.rejectedWith("Unable to find root package.json")
    );

    it("throws on bad package.json", async () => {
      mock({
        "package.json": "BAD_JSON"
      });

      await expect(findProdInstalls()).to.be.rejectedWith("Unexpected token");
    });

    it("handles no dependencies", async () => {
      mock({
        "package.json": JSON.stringify({})
      });

      expect(await findProdInstalls()).to.eql([]);
    });

    it("handles uninstalled dependencies", async () => {
      mock({
        "package.json": JSON.stringify({
          dependencies: {
            foo: "^1.2.3"
          }
        })
      });

      expect(await findProdInstalls()).to.eql([]);
    });

    it("handles uninstalled optionalDependencies", async () => {
      mock({
        "package.json": JSON.stringify({
          optionalDependencies: {
            foo: "^1.2.3"
          }
        })
      });

      expect(await findProdInstalls()).to.eql([]);
    });

    it("handles nested dependencies and optionalDependencies", async () => {
      mock({
        "package.json": JSON.stringify({
          dependencies: {
            bar: "^1.2.3"
          },
          optionalDependencies: {
            foo: "^1.2.3"
          }
        }),
        node_modules: {
          bar: {
            "package.json": JSON.stringify({
              dependencies: {
                baz: "^1.2.3"
              }
            }),
            node_modules: {
              baz: {
                "package.json": JSON.stringify({})
              }
            }
          },
          foo: {
            "package.json": JSON.stringify({})
          }
        }
      });

      expect(await findProdInstalls()).to.eql(normalize([
        "node_modules/bar",
        "node_modules/bar/node_modules/baz",
        "node_modules/foo"
      ]));
    });


    it("handles flattened dependencies and optionalDependencies", async () => {
      mock({
        "package.json": JSON.stringify({
          dependencies: {
            bar: "^1.2.3"
          },
          optionalDependencies: {
            foo: "^1.2.3"
          }
        }),
        node_modules: {
          bar: {
            "package.json": JSON.stringify({
              dependencies: {
                baz: "^1.2.3"
              }
            })
          },
          baz: {
            "package.json": JSON.stringify({})
          },
          foo: {
            "package.json": JSON.stringify({})
          }
        }
      });

      expect(await findProdInstalls()).to.eql(normalize([
        "node_modules/bar",
        "node_modules/baz",
        "node_modules/foo"
      ]));
    });
  });
});
