import { srvs } from "../services";
import { Middleware } from "kisa";

export default function bearer(
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
    if (!/^Bearer$/i.test(schema) || !token) {
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
