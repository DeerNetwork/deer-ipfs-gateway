import httpProxy from "http-proxy";
import { Context } from "kisa";
import _ from "lodash";
import AsyncRateLimiter, { Status as RateLimitStatus } from "async-ratelimiter";

import { srvs } from "./services";
import { kisaIpfs, AppState } from "./app";
import { OPERATIONS } from "./generated/apiIpfs";
import { collectHttpInfo } from "./middlewares/error";

export default function register() {
  const { settings, logger, statistic, redis, errs } = srvs;
  const { ipfsServer } = settings;
  const proxy = httpProxy.createProxyServer();
  const readRateLimiter = new AsyncRateLimiter({
    duration: 60000,
    max: 100,
    namespace: redis.joinKey("readRateLimit"),
    db: redis,
  });
  const writeRateLimiter = new AsyncRateLimiter({
    duration: 60000,
    max: 10,
    namespace: redis.joinKey("writeRateLimit"),
    db: redis,
  });
  proxy.on("proxyReq", (proxyReq, req) => {
    req.on("data", (chunk: Buffer) => {
      const address = _.get(req, "address");
      const ok = statistic.inBytes(address, chunk.length);
      if (!ok) proxyReq.destroy(new Error("lock of quota"));
    });
  });
  proxy.on("proxyRes", (proxyRes, req) => {
    proxyRes.on("data", (chunk: Buffer) => {
      const address = _.get(req, "address");
      const ok = statistic.outBytes(address, chunk.length);
      if (!ok) proxyRes.destroy(new Error("lock of quota"));
    });
  });
  for (const operation of OPERATIONS) {
    const { operationId, xProps } = operation;
    kisaIpfs.handlers[operationId] = async (ctx: Context<AppState>) => {
      const { address } = ctx.state.auth;
      let limit: RateLimitStatus;
      if (xProps["x-write"]) {
        limit = await writeRateLimiter.get({ id: address });
      } else {
        limit = await readRateLimiter.get({ id: address });
      }
      if (!limit.remaining) {
        throw errs.ErrRateLimit.toError();
      }
      const { req, res } = ctx;
      _.set(req, "address", ctx.state.auth.address);
      proxy.web(
        req,
        res,
        {
          target: ipfsServer,
        },
        (error) => {
          logger.error(error, collectHttpInfo(ctx));
          ctx.status = 500;
          ctx.body = {
            Error: error.message,
          };
        }
      );
    };
  }
}
