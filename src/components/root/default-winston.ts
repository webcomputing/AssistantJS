import * as winston from "winston";
import * as cluster from "cluster";

/** The default options set include WORKER-ID and REQUEST-ID if present */
export const options: winston.LoggerOptions = {
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return Date.now();
      },
      formatter: function(options) {
        // Grab worker id if present
        let workerID: number | undefined = undefined;
        if (!cluster.isMaster) {
          workerID = cluster.worker.id;
        }

        // Grab request id if present
        let requestId: string | undefined = undefined;
        if (typeof options.meta.requestId === "string") {
          requestId = options.meta.requestId;
          delete options.meta.requestId;
        }

        return options.timestamp() + ' ' +
          winston.config.colorize(options.level, options.level.toUpperCase()) + ' ' +
          (typeof workerID === "undefined" ? '' : `[WORKER-${workerID}] `) + 
          (typeof requestId === "undefined" ? '' : `[${requestId}] `) +
          (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )
      }
    })
  ]
};

export const instance: winston.LoggerInstance = new winston.Logger(options);