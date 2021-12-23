/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Handler,
  Middleware,
  Operation,
  Handlers as KisaHandlers,
  Middlewares as KisaMiddlewares,
  SecurityHandlers as KisaSecurityHandlers,
} from "kisa";

export namespace ReqTypes {
  export interface GetNonce {
    query: {
      address: string;
    };
  }
  export interface Login {
    body: {
      address: string;
      signature: string;
    };
  }
  export interface GetStatistic {
  }
}

export interface Handlers<S> extends KisaHandlers<S> {
  getNonce: Handler<S, ReqTypes.GetNonce>; 
  login: Handler<S, ReqTypes.Login>; 
  getStatistic: Handler<S, ReqTypes.GetStatistic>; 
}

export interface Middlewares<S> extends KisaMiddlewares<S> {
}

export interface SecurityHandlers<S> extends KisaSecurityHandlers<S> {
  jwt: (config: string[]) => Middleware<S>; 
}

export const OPERATIONS: Operation[] = [{"path":"/nonce","method":"get","security":[],"operationId":"getNonce","xProps":{},"reqSchema":{"type":"object","properties":{"query":{"type":"object","properties":{"address":{"type":"string","example":"5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"}},"required":["address"]}},"required":[]},"resSchema":{"200":{"type":"object","properties":{"address":{"type":"string","example":"5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"},"nonce":{"type":"integer","format":"int64","example":0}},"required":["address","nonce"]}}},{"path":"/login","method":"post","security":[],"operationId":"login","xProps":{},"reqSchema":{"type":"object","properties":{"body":{"type":"object","properties":{"address":{"type":"string","example":"5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"},"signature":{"type":"string","example":"0x2aeaa98e26062cf65161c68c5cb7aa31ca050cb5bdd07abc80a475d2a2eebc7b7a9c9546fbdff971b29419ddd9982bf4148c81a49df550154e1674a6b58bac84"}},"required":["address","signature"]}},"required":[]},"resSchema":{"200":{"type":"object","properties":{"address":{"type":"string","example":"5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"},"token":{"type":"string","example":"<data:token>"}},"required":["address","token"]}}},{"path":"/statistic","method":"get","security":[{"jwt":[]}],"operationId":"getStatistic","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{"200":{"type":"object","properties":{"incomes":{"type":"integer","format":"int64","description":"入站流量","example":0},"outcomes":{"type":"integer","format":"int64","description":"出站流量","example":0}},"required":["incomes","outcomes"]}}}];