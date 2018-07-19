import { Component } from "inversify-components";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { Configuration } from "../../../../src/components/unifier/private-interfaces";
import { BasicHandable } from "../../../../src/components/unifier/response-handler";
import { HandlerProxyFactory } from "../../../../src/components/unifier/response-handler/handler-proxy-factory";
import { injectionNames } from "../../../../src/injection-names";
import { PLATFORM } from "../../../support/mocks/unifier/extraction";
import { MockHandlerASpecificHandable, MockHandlerASpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { MockHandlerBSpecificHandable, MockHandlerBSpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-b";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

type MixedTypes = MockHandlerASpecificTypes & MockHandlerBSpecificTypes;
type MixedHandler = BasicHandable<MixedTypes> & MockHandlerASpecificHandable<MixedTypes> & MockHandlerBSpecificHandable<MixedTypes>;

interface CurrentThisContext extends ThisContext {
  handlerInstance: MixedHandler;
  proxiedHandler: MixedHandler;
  mockTable: MockHandlerASpecificTypes["table"];
  mockList: MockHandlerBSpecificTypes["list"];
  result: any;
  logger: Logger;
  buildProxiedHandler: () => void;
}

describe("HandlerProxyFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.handlerInstance = this.container.inversifyInstance.get(PLATFORM + ":current-response-handler");

    spyOn(this.handlerInstance, "setMockHandlerATable").and.callThrough();

    this.buildProxiedHandler = () => {
      const handlerProxyFactory = this.container.inversifyInstance.get(HandlerProxyFactory);
      this.proxiedHandler = handlerProxyFactory.createHandlerProxy(this.handlerInstance);
    };

    this.mockList = { elements: [{ title: "ListElement1" }] };
    this.mockTable = { header: ["A"], elements: [["A1"]] };
  });

  describe("createHandlerProxy()", function() {
    function checkProxiedInstance() {
      it("returns the proxied handler", async function(this: CurrentThisContext) {
        expect(this.result).toBe(this.proxiedHandler);
      });
    }

    describe("with present function", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.buildProxiedHandler();
        this.proxiedHandler.setMockHandlerATable(this.mockTable);
      });

      it("calls present function", async function(this: CurrentThisContext) {
        expect(this.handlerInstance.setMockHandlerATable).toHaveBeenCalledWith(this.mockTable);
      });
    });

    describe("without function", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.buildProxiedHandler();
        this.result = this.proxiedHandler.setMockHandlerBList(this.mockList);
      });

      it("returns proxy function", async function(this: CurrentThisContext) {
        expect(typeof this.proxiedHandler.setMockHandlerBList).toBe("function");
        expect(this.result).toBe(this.proxiedHandler);
      });

      it("returns proxied Handler", async function(this: CurrentThisContext) {
        expect(this.result).not.toBeUndefined();
        expect(this.result).toEqual(this.proxiedHandler);
      });
    });

    describe("with method-chaining", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.buildProxiedHandler();
      });

      describe("with two functions present", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.result = this.proxiedHandler.setCard({ title: "TestTitle", description: "Description" }).setChatBubbles(["A", "B"]);
        });

        checkProxiedInstance();
      });

      describe("with one of two function present", function() {
        describe("where first function is present", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.result = this.proxiedHandler.setCard({ title: "TestTitle", description: "Description" }).setMockHandlerBList(this.mockList);
          });

          checkProxiedInstance();
        });

        describe("where second function is present", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.result = this.proxiedHandler.setMockHandlerBList(this.mockList).setCard({ title: "TestTitle", description: "Description" });
          });

          checkProxiedInstance();
        });
      });
    });

    describe("without supporting the function", function() {
      describe("setSuggestionChips()", function() {
        describe("with logging only", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.buildProxiedHandler();

            (this.proxiedHandler as any).specificWhitelist = this.proxiedHandler.specificWhitelist.filter(value => value !== "setSuggestionChips");

            this.logger = this.container.inversifyInstance.get(injectionNames.logger);
            spyOn(this.logger, "warn").and.callThrough();
            this.container.inversifyInstance.unbind(injectionNames.logger);
            this.container.inversifyInstance.bind(injectionNames.logger).toConstantValue(this.logger);

            this.result = this.proxiedHandler.setSuggestionChips([{ displayText: "hallo", spokenText: "hallo" }]);
          });

          checkProxiedInstance();

          it("calls logger", async function(this: CurrentThisContext) {
            expect(this.logger.warn).toHaveBeenCalled();
          });
        });

        describe("with forcing to throw exception", function() {
          beforeEach(async function(this: CurrentThisContext) {
            const metaData = this.container.inversifyInstance.get<Component<Configuration.Runtime>>("meta:component//core:unifier");
            metaData.configuration.failSilentlyOnUnsupportedFeatures = false;
            this.container.inversifyInstance.unbind("meta:component//core:unifier");
            this.container.inversifyInstance.bind<Component<Configuration.Runtime>>("meta:component//core:unifier").toConstantValue(metaData);

            this.buildProxiedHandler();

            (this.proxiedHandler as any).specificWhitelist = this.proxiedHandler.specificWhitelist.filter(value => value !== "setSuggestionChips");
          });

          it("throws error", async function(this: CurrentThisContext) {
            expect(() => {
              this.proxiedHandler.setSuggestionChips([{ displayText: "hallo", spokenText: "hallo" }]);
            }).toThrow();
          });
        });
      });
    });
  });
});
