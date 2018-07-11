import { Container } from "inversify";
import { BasicHandler, HandlerProxyFactory } from "../../../../src/assistant-source";
import { MockHandlerA, MockHandlerASpecificTypes } from "./mocks/mock-handler-a";
import { MockHandlerB, MockHandlerBSpecificTypes } from "./mocks/mock-handler-b";

type MixedTypes = MockHandlerASpecificTypes & MockHandlerBSpecificTypes;
type MixedHandler = BasicHandler<MixedTypes> & MockHandlerA<MixedTypes> & MockHandlerB<MixedTypes>;

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
    this.handlerInstance = new MockHandlerA() as MixedHandler; // todo change to container instantiation
    spyOn(this.handlerInstance, "addMockHandlerATable").and.callThrough();

    this.proxiedHandler = HandlerProxyFactory.createHandlerProxy(this.handlerInstance);
    spyOn(this.proxiedHandler, "addMockHandlerBList").and.callThrough();

    this.mockList = { elements: [{ title: "ListElement1" }] };
    this.mockTable = { header: ["A"], elements: [["A1"]] };
  });

  describe("createHandlerProxy()", function() {
    describe("with present function", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.proxiedHandler.addMockHandlerATable(this.mockTable);
      });

      it("calls present function", async function(this: CurrentThisContext) {
        expect(this.handlerInstance.addMockHandlerATable).toHaveBeenCalledWith(this.mockTable);
      });
    });

    describe("without function", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.result = this.proxiedHandler.addMockHandlerBList(this.mockList);
      });

      it("returns proxy function", async function(this: CurrentThisContext) {
        expect(typeof this.proxiedHandler.addMockHandlerBList).toBe("function");
        expect(this.result).toBe(this.proxiedHandler);
      });

      it("returns proxied Handler", async function(this: CurrentThisContext) {
        expect(this.result).not.toBeUndefined();
        expect(this.result).toBe(this.proxiedHandler);
      });
    });

    describe("with method-chaining", function() {
      function checkProxiedInstance() {
        it("returns the proxied handler", async function(this: CurrentThisContext) {
          expect(this.result).toBe(this.proxiedHandler);
        });
      }

      describe("with two functions present", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.result = this.proxiedHandler.setCard({ title: "TestTitle", description: "Description" }).setChatBubbles(["A", "B"]);
        });

        checkProxiedInstance();
      });

      describe("with one of two function present", function() {
        describe("where first function is present", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.result = this.proxiedHandler.setCard({ title: "TestTitle", description: "Description" }).addMockHandlerBList(this.mockList);
          });

          checkProxiedInstance();
        });

        describe("where second function is present", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.result = this.proxiedHandler.addMockHandlerBList(this.mockList).setCard({ title: "TestTitle", description: "Description" });
          });

          checkProxiedInstance();
        });
      });
    });
  });
});
