import { srvs } from "../services";
import { Middleware } from "kisa";

export default function auth(
  key: string,
  parseToken: (token: string) => Promise<any>
): Middleware {
  const { errs } = srvs;
  return async (ctx, next) => {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
      throw errs.ErrAuth.toError();
    }
    const [schema, token] = authorization.split(" ");
    if (!/^Basic$/i.test(schema) || !token) {
      throw errs.ErrAuth.toError();
    }
    let data: any;
    try {
      data = await parseToken(token);
    } catch (err) {
      throw errs.ErrAuth.toError();
    }
    ctx.state[key] = data;
    await next();
  };
}

export async function parseBasicToken(token: string) {
  const { redis, errs } = srvs;
  const [address, secret] = token.split(":");
  if (!address || !secret) throw errs.ErrAuth.toError();
  if (!(await redis.exists(redis.tokenKey(address)))) {
    throw errs.ErrAuth.toError();
  }
  return { address };
}
