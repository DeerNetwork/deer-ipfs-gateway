import {
  ClientRequest,
  IncomingMessage,
  OutgoingMessage,
  ServerResponse,
} from "http";
import httpProxy from "http-proxy";
import { Context } from "kisa";
import _ from "lodash";
import AsyncRateLimiter, { Status as RateLimitStatus } from "async-ratelimiter";
import { Response } from "koa";
import { PassThrough } from "stream";

import { srvs } from "./services";
import { kisaIpfs, AppState } from "./app";
import { OPERATIONS } from "./generated/apiIpfs";

export default function register() {
  const { settings, statistic, redis, errs } = srvs;
  const { ipfsServer } = settings;
  const proxy = httpProxy.createProxyServer();
  const readRateLimiter = new AsyncRateLimiter({
    duration: 10000,
    max: 1000,
    namespace: redis.joinKey("rrl"),
    db: redis,
  });
  const writeRateLimiter = new AsyncRateLimiter({
    duration: 10000,
    max: 100,
    namespace: redis.joinKey("wrl"),
    db: redis,
  });
  proxy.on("proxyReq", (proxyReq, req) => {
    req.on("data", async (chunk: Buffer) => {
      const address = _.get(req, "address");
      const ok = await statistic.inBytes(address, chunk.length);
      if (!ok) {
        req.emit("lack:in", proxyReq);
      }
    });
  });
  proxy.on("proxyRes", (proxyRes, req) => {
    proxyRes.on("data", async (chunk: Buffer) => {
      const address = _.get(req, "address");
      const ok = await statistic.outBytes(address, chunk.length);
      if (!ok) {
        req.emit("lack:out", proxyRes);
      }
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
      await statistic.checkStatistic(address);
      const { req } = ctx;
      _.set(req, "address", ctx.state.auth.address);
      await new Promise((resolve, reject) => {
        const resAdapter = makeProxyResponseAdapter(ctx.response, resolve);
        (req as any).on("lack:in", (proxyReq: ClientRequest) => {
          const err = errs.ErrLackOfInQuota.toError();
          srvs.logger.warn(err.message, { address });
          proxyReq.destroy(err);
        });
        (req as any).on("lack:out", (proxyRes: IncomingMessage) => {
          const err = errs.ErrLackOfOutQuota.toError();
          srvs.logger.warn(err.message, { address });
          proxyRes.destroy(err);
          if (!ctx.response.body) {
            ctx.response.status = err.status;
            ctx.response.body = { Error: err.message };
          }
        });
        proxy.web(
          req,
          resAdapter,
          {
            target: ipfsServer,
          },
          reject
        );
      });
    };
  }
}

function makeProxyResponseAdapter(
  response: Response,
  done: (v?: any) => void
): ServerResponse {
  const resAdapter = new OutgoingMessage() as ServerResponse;

  resAdapter.on("pipe", (proxyRes) => {
    proxyRes.unpipe(resAdapter);

    response.status = resAdapter.statusCode;
    response.message = resAdapter.statusMessage;

    for (const [headerName, headerVal] of Object.entries(
      resAdapter.getHeaders()
    )) {
      if (_.isNil(headerVal)) {
        continue;
      }
      response.set(
        headerName,
        _.isNumber(headerVal) ? _.toString(headerVal) : headerVal
      );
    }

    response.body = proxyRes.pipe(new PassThrough());

    done();
  });

  return resAdapter;
}
