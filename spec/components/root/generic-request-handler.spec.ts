import { RequestContext } from "../../../src/components/root/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { AssistantJSSetup } from "../../../src/setup";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { RequestProxy, withServer } from "../../support/util/requester";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  request: RequestProxy;
  stopServer: Function;
  requestContext: RequestContext;
  assistantJs: AssistantJSSetup;
}

describe("GenericRequestHelper", function() {
  beforeEach(async function() {
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    configureI18nLocale(this.container);
  });

  describe("resulting context object", function() {
    beforeEach(async function(this: CurrentThisContext) {
      [this.request, this.stopServer] = await withServer(this.assistantJs);
      await this.request.post("/any-given-route", { a: "b" }, { "header-a": "b" });
    });

    afterEach(function() {
      this.stopServer();
    });

    it("is fetchable via dependency injection", function(this: CurrentThisContext) {
      expect(() => {
        this.container.inversifyInstance.get<RequestContext>(injectionNames.current.requestContext);
      }).not.toThrow();
    });

    it("contains all request information", function(this: CurrentThisContext) {
      const requestContext = this.container.inversifyInstance.get<RequestContext>(injectionNames.current.requestContext);

      // Multiple expections for performance reasons
      expect(requestContext.method).toBe("POST");

      expect(requestContext.headers).toEqual(jasmine.objectContaining({ "header-a": "b" } as any));
      expect(requestContext.body).toEqual({ a: "b" });
      expect(requestContext.path).toBe("/any-given-route");
    });
  });
});
