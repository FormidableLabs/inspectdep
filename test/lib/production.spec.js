"use strict";

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

    it("TODO MORE TESTS");
  });
});
