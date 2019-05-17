"use strict";

/* eslint camelcase: ["error", {allow: ["node_modules"]}]*/

const mock = require("mock-fs");

const { findProdInstalls } = require("../../lib/production");

describe("lib/production", () => {
  beforeEach(() => {
    mock({});
  });

  afterEach(() => {
    mock.restore();
  });

  describe("findProdInstalls", () => {
    it("handles empty root directory with default path", () =>
      expect(findProdInstalls()).to.be.rejectedWith("Unable to find root package.json")
    );

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

      expect(await findProdInstalls()).to.eql([
        "node_modules/bar",
        "node_modules/bar/node_modules/baz",
        "node_modules/foo"
      ]);
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

      expect(await findProdInstalls()).to.eql([
        "node_modules/bar",
        "node_modules/baz",
        "node_modules/foo"
      ]);
    });
  });
});
