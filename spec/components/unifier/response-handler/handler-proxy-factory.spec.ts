import { Container } from "inversify";
import { BasicHandable, BasicHandler } from "../../../../src/assistant-source";
import { HandlerProxyFactory } from "../../../../src/components/unifier/response-handler/handler-proxy-factory";
import { MockHandlerA, MockHandlerASpecificHandable, MockHandlerASpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { MockHandlerB, MockHandlerBSpecificHandable, MockHandlerBSpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-b";

type MixedTypes = MockHandlerASpecificTypes & MockHandlerBSpecificTypes;
type MixedHandler = BasicHandable<MixedTypes> & MockHandlerASpecificHandable & MockHandlerBSpecificHandable;

interface CurrentThisContext {
  specHelper;
  assistantJs;
  container: Container;
  handlerInstance: MixedHandler;
  proxiedHandler: MixedHandler;
  mockTable: MockHandlerASpecificTypes["table"];
  mockList: MockHandlerBSpecificTypes["list"];
  result: any;
}

describe("HandlerProxyFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.handlerInstance = this.container.get(MockHandlerA) as any;
    spyOn(this.handlerInstance, "setMockHandlerATable").and.callThrough();

    const handlerProxyFactory = this.container.get(HandlerProxyFactory);

    this.proxiedHandler = handlerProxyFactory.createHandlerProxy(this.handlerInstance);

    this.mockList = { elements: [{ title: "ListElement1" }] };
    this.mockTable = { header: ["A"], elements: [["A1"]] };
  });

  describe("createHandlerProxy()", function() {
    describe("with present function", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.proxiedHandler.setMockHandlerATable(this.mockTable);
      });

      it("calls present function", async function(this: CurrentThisContext) {
        expect(this.handlerInstance.setMockHandlerATable).toHaveBeenCalledWith(this.mockTable);
      });
    });

    describe("without function", function() {
      beforeEach(async function(this: CurrentThisContext) {
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

    function checkProxiedInstance() {
      it("returns the proxied handler", async function(this: CurrentThisContext) {
        expect(this.result).toBe(this.proxiedHandler);
      });
    }

    describe("with method-chaining", function() {
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
            this.result = this.proxiedHandler.setSuggestionChips([{ displayText: "hallo", spokenText: "hallo" }]);
          });

          checkProxiedInstance();

          it("calls logger", async function(this: CurrentThisContext) {
            pending("not implemented");
          });
        });

        describe("with forcing to throw exception", function() {
          it("throws error", async function(this: CurrentThisContext) {
            pending("not implemented");
          });
        });
      });
    });
  });
});
