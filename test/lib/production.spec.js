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

    it("TODO MORE TESTS");
  });
});
