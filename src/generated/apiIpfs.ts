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
  export interface Add {
  }
  export interface BlockGet {
  }
  export interface BlockPut {
  }
  export interface BlockStat {
  }
  export interface Cat {
  }
  export interface DagGet {
  }
  export interface DagPut {
  }
  export interface DagResolve {
  }
  export interface Get {
  }
  export interface ObjectData {
  }
  export interface ObjectGet {
  }
  export interface ObjectPut {
  }
  export interface ObjectStat {
  }
  export interface Version {
  }
}

export interface Handlers<S> extends KisaHandlers<S> {
  add: Handler<S, ReqTypes.Add>; 
  blockGet: Handler<S, ReqTypes.BlockGet>; 
  blockPut: Handler<S, ReqTypes.BlockPut>; 
  blockStat: Handler<S, ReqTypes.BlockStat>; 
  cat: Handler<S, ReqTypes.Cat>; 
  dagGet: Handler<S, ReqTypes.DagGet>; 
  dagPut: Handler<S, ReqTypes.DagPut>; 
  dagResolve: Handler<S, ReqTypes.DagResolve>; 
  get: Handler<S, ReqTypes.Get>; 
  objectData: Handler<S, ReqTypes.ObjectData>; 
  objectGet: Handler<S, ReqTypes.ObjectGet>; 
  objectPut: Handler<S, ReqTypes.ObjectPut>; 
  objectStat: Handler<S, ReqTypes.ObjectStat>; 
  version: Handler<S, ReqTypes.Version>; 
}

export interface Middlewares<S> extends KisaMiddlewares<S> {
}

export interface SecurityHandlers<S> extends KisaSecurityHandlers<S> {
  jwt: (config: string[]) => Middleware<S>; 
}

export const OPERATIONS: Operation[] = [{"path":"/add","method":"post","security":[{"jwt":[]}],"operationId":"add","xProps":{"x-write":true},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/block/get","method":"post","security":[{"jwt":[]}],"operationId":"blockGet","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/block/put","method":"post","security":[{"jwt":[]}],"operationId":"blockPut","xProps":{"x-write":true},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/block/stat","method":"post","security":[{"jwt":[]}],"operationId":"blockStat","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/cat","method":"post","security":[{"jwt":[]}],"operationId":"cat","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/dag/get","method":"post","security":[{"jwt":[]}],"operationId":"dagGet","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/dag/put","method":"post","security":[{"jwt":[]}],"operationId":"dagPut","xProps":{"x-write":true},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/dag/resolve","method":"post","security":[{"jwt":[]}],"operationId":"dagResolve","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/get","method":"post","security":[{"jwt":[]}],"operationId":"get","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/object/data","method":"post","security":[{"jwt":[]}],"operationId":"objectData","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/object/get","method":"post","security":[{"jwt":[]}],"operationId":"objectGet","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/object/put","method":"post","security":[{"jwt":[]}],"operationId":"objectPut","xProps":{"x-write":true},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/object/stat","method":"post","security":[{"jwt":[]}],"operationId":"objectStat","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}},{"path":"/version","method":"post","security":[{"jwt":[]}],"operationId":"version","xProps":{},"reqSchema":{"type":"object","properties":{},"required":[]},"resSchema":{}}];