import { srvs } from "../services";
import { Context, Middleware } from "kisa";
import _ from "lodash";
import { HttpError } from "@use-services/httperr";

export default function error(): Middleware {
  const { errs, logger } = srvs;
  return async (ctx, next) => {
    try {
      await next();
      if (typeof ctx.response.body === "undefined") {
        const err = errs.ErrNotFound.toError();
        ctx.status = err.status;
        ctx.body = err.message;
        return;
      }
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status >= 500) {
          logger.error(err, collectHttpInfo(ctx));
        }
        ctx.status = err.status;
        ctx.body = err.message;
        return;
      }
      logger.error(err, collectHttpInfo(ctx));
      const err2 = errs.ErrInternal.toError();
      ctx.status = err2.status;
      ctx.body = err2.message;
    }
  };
}

const OMIT_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "connection ",
  "cookie",
  "host",
  "pragma",
  "referer",
  "user-agent",
];

function collectHttpInfo(ctx: Context) {
  const { request } = ctx;
  const { url, query, headers, body } = request;
  const { auth, authM } = _.pick(ctx.state, ["auth", "authM"]);
  return {
    url,
    query,
    headers: _.omit(headers, OMIT_HEADERS),
    auth,
    authM,
    body,
  };
}
