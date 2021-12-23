const ErrCodes = {
  ErrAuth: {
    status: 401,
    message: "Invalid authorization",
  },
  ErrNotFound: {
    status: 404,
    message: "Not found",
  },
  ErrDebugOnly: {
    status: 400,
    message: "Debug only",
  },
  ErrInternal: {
    status: 500,
    message: "${message}",
    args: {
      message: "Unexpect error",
    },
  },
  ErrValidation: {
    status: 400,
    message: "Validate error",
  },
  ErrAddress: {
    status: 400,
    message: "Invalid address",
  },
  ErrSignature: {
    status: 400,
    message: "Invalid signature",
  },
  ErrBalance: {
    status: 400,
    message: "No balance",
  },
  ErrRateLimit: {
    status: 429,
    messgae: "Two many requests",
  },
};

export = ErrCodes;
