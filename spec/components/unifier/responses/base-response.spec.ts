import { createRequestScope } from "../../../support/util/setup";
import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { BaseResponse } from "../../../../src/components/unifier/responses/base-response";

describe("BaseResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    
    // Add some supported features
    this.handler.supportedFeature = null;

    this.baseResponse = new BaseResponse(this.handler, false);
  });

  describe("reportIfUnavailable", function() {
    describe("when the given features is unavailble", function() {
      beforeEach(function() {
        this.featureToCheck = ["unsupportedFeature"];
      });

      describe("with failSilentlyOnUnsupportedFeatures = true", function() {
        beforeEach(function() {
          this.baseResponse.failSilentlyOnUnsupportedFeatures = true;
        });

        it("does not throw any exception", function() {
          expect(() => {
            this.baseResponse.reportIfUnavailable(this.featureToCheck);
          }).not.toThrow();
        });
      });

      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.baseResponse.failSilentlyOnUnsupportedFeatures = false;
        });

        it("throws an exception", function() {
          expect(() => {
            this.baseResponse.reportIfUnavailable(this.featureToCheck);
          }).toThrow();
        });
      });
    });

    describe("when the given features is available", function() {
      beforeEach(function() {
        this.featureToCheck = ["supportedFeature"];
      });

      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.baseResponse.failSilentlyOnUnsupportedFeatures = false;
        });

        it("does not throw any exception", function() {
          expect(() => {
            this.baseResponse.reportIfUnavailable(this.featureToCheck);
          }).not.toThrow();
        });
      });
    });
  });
});