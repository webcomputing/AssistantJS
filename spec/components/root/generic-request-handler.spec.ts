import { RequestContext } from "../../../src/components/root/public-interfaces";
import { AssistantJSSetup } from "../../../src/setup";
import { RequestProxy, withServer } from "../../support/util/requester";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  request: RequestProxy;
  stopServer: Function;
  requestContext: RequestContext;
  diContextName: string;
  assistantJs: AssistantJSSetup;
}

describe("GenericRequestHelper", function() {
  describe("resulting context object", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.diContextName = "core:root:current-request-context";

      [this.request, this.stopServer] = await withServer(this.assistantJs);
      await this.request.post("/any-given-route", { a: "b" }, { "header-a": "b" });
    });

    afterEach(function() {
      this.stopServer();
    });

    it("is fetchable via dependency injection", function(this: CurrentThisContext) {
      expect(() => {
        this.container.inversifyInstance.get<RequestContext>(this.diContextName);
      }).not.toThrow();
    });

    it("contains all request information", function(this: CurrentThisContext) {
      const requestContext = this.container.inversifyInstance.get<RequestContext>(this.diContextName);

      // Multiple expections for performance reasons
      expect(requestContext.method).toBe("POST");

      expect(requestContext.headers).toEqual(jasmine.objectContaining({ "header-a": "b" } as any));
      expect(requestContext.body).toEqual({ a: "b" });
      expect(requestContext.path).toBe("/any-given-route");
    });
  });
});
