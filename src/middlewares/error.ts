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
        ctx.body = { Error: err.message };
        return;
      }
    } catch (e) {
      let err: HttpError<any>;
      if (!(e instanceof HttpError)) {
        logger.error(e, collectHttpInfo(ctx));
        err = errs.ErrInternal.toError({ message: e.message });
      } else {
        err = e;
        if (err.status >= 500) {
          logger.error(err, collectHttpInfo(ctx));
        }
      }
      ctx.status = err.status;
      ctx.body = { Error: err.message };
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

export function collectHttpInfo(ctx: Context) {
  const { request } = ctx;
  const { url, query, headers, body } = request;
  const { auth } = _.pick(ctx.state, ["auth"]);
  return {
    url,
    query,
    headers: _.omit(headers, OMIT_HEADERS),
    auth,
    body,
  };
}
