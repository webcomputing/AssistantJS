import { withServer, RequestProxy } from "../../support/util/requester";

describe("GenericRequestHelper", function() {
  describe("resulting context object", function() {
    let request: RequestProxy;
    let stopServer: Function;
    let response: any;

    beforeEach(async function(done) {
      [request, stopServer] = await withServer();
      response = await request.get("/any-given-route?param=b");
      done();
    });

    afterEach(function() {
      stopServer();
    });


    it("contains correct method", function() {
      console.log("in here");
      console.log(request);
      expect(response.method).toBe("get");
    });
  });
});