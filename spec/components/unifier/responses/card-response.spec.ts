import { createRequestScope } from "../../../support/util/setup";
import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { CardResponse } from "../../../../src/components/unifier/responses/card-response";

describe("CardResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");

    this.buildCardHandler = (additionalFeatures = {}) => {
      this.handler = Object.assign(this.handler, Object.assign({ displayText: null, cardTitle: null }, additionalFeatures));
      this.responseFactory = new ResponseFactory(this.handler);
    }
  });

  describe("with a handler not supporting cards", function() {
    it("is not creatable", function() {
      this.responseFactory = new ResponseFactory(this.handler);

      expect(function() {
        this.responseFactory.createCardResponse();
      }).toThrow();
    });
  });

  describe("with a handler supporting cards", function() {
    beforeEach(function() {
      this.buildCardHandler();
    });

    describe("setTitle", function() {
      it("sets title to response handler", function() {
        this.responseFactory.createCardResponse().setTitle("title");
        expect(this.handler.cardTitle).toEqual("title");
      });
    });

    describe("setBody", function() {
      it("sets body to response handler", function() {
        this.responseFactory.createCardResponse().setBody("body");
        expect(this.handler.displayText).toEqual("body");
      });
    });
  });

  describe("setImage", function() {
    describe("with a handler not supporting images", function() {
      it("is not creatable", function() {
        this.buildCardHandler();

        expect(function() {
          this.responseFactory.createCardResponse();
        }).toThrow();
      });
    });

    describe("with a handler supporting images", function() {
      beforeEach(function() {
        this.buildCardHandler({ displayImage: "" });
      });

      it("appends image to response", function() {
        this.responseFactory.createCardResponse().setImage("http://my-image");
        expect(this.handler.displayImage).toEqual("http://my-image");
      });
    });
  });
})