import { Container } from "inversify-components";
import { withServer, RequestProxy } from "../../support/util/requester";
import { RequestContext } from "../../../src/components/root/public-interfaces";

describe("GenericRequestHelper", function() {
  describe("resulting context object", function() {
    let request: RequestProxy;
    let stopServer: Function;
    let requestContext: RequestContext;
    let diContextName = "core:root:current-request-context";

    beforeEach(async function(done) {
      [request, stopServer] = await withServer(this.assistantJs);
      await request.post("/any-given-route", { a: "b" }, { "header-a": "b" });
      done();
    });

    afterEach(function() {
      stopServer();
    });

    it("is fetchable via dependency injection", function() {
      expect(() => {
        (this.container as Container).inversifyInstance.get<RequestContext>(diContextName);
      }).not.toThrow();
    });

    it("contains all request information", function() {
      let requestContext = (this.container as Container).inversifyInstance.get<RequestContext>(diContextName);

      // Multiple expections for performance reasons
      expect(requestContext.method).toBe("POST");
      expect(requestContext.headers).toEqual(jasmine.objectContaining({ "header-a": "b" }));
      expect(requestContext.body).toEqual({ a: "b" });
      expect(requestContext.path).toBe("/any-given-route");
    });
  });
});
