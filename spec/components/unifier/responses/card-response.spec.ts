import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { CardResponse } from "../../../../src/components/unifier/responses/card-response";
import { createRequestScope } from "../../../support/util/setup";

describe("CardResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.responseFactory = this.container.inversifyInstance.get("core:unifier:current-response-factory");

    this.buildCardHandler = (additionalFeatures = {}) => {
      this.handler = {...this.handler, ...{ cardBody: null, cardTitle: null, ...additionalFeatures}};
      this.responseFactory.handler = this.handler;
    };
  });

  describe("with a handler not supporting cards", function() {
    it("is not creatable", function() {
      this.responseFactory = this.responseFactory;

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
        expect(this.handler.cardBody).toEqual("body");
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
        this.buildCardHandler({ cardImage: "" });
      });

      it("appends image to response", function() {
        this.responseFactory.createCardResponse().setImage("http://my-image");
        expect(this.handler.cardImage).toEqual("http://my-image");
      });
    });
  });
});
