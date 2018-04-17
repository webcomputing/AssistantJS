describe("Session", function() {
  beforeEach(function() {
    this.sessionFactory = this.container.inversifyInstance.get("core:services:session-factory");
    this.redisInstance = this.container.inversifyInstance.get("core:services:redis-instance");
    this.session = this.sessionFactory("example-session");
  });

  describe("set", function() {
    describe("if successful", function() {
      beforeEach(async function(done) {
        await this.session.set("my-key", "my-value");
        done();
      });

      it("sets expires counter", function(done) {
        // We don't have to bother about race conditions here since we are using fakredis in tests :-)
        this.redisInstance.ttl(this.session.documentID, function(err, ttl) {
          expect(ttl).toBeCloseTo(1800, 5);
          done();
        });
      });
    });
  });
});
