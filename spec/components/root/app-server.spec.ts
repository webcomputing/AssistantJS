import { RequestProxy, withServer } from "../../support/util/requester";
import { ThisContext } from "../../this-context";

describe("ServerApplication", function() {
  let request: RequestProxy;
  let stopServer: () => void;

  beforeEach(async function(this: ThisContext) {
    // Use childcontainer for every request
    this.specHelper.prepareSpec({
      bindSingletonChildContainer: false,
    });
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    [request, stopServer] = await withServer(this.assistantJs);
  });

  afterEach(function() {
    stopServer();
  });

  describe("execute", function(this: ThisContext) {
    it("responds to empty requests with 404", async function(done) {
      request.get("/any-given-route").then(response => {
        expect(response.statusCode).toBe(404);
        done();
      });
    });
  });
});
