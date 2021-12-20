const ErrCodes = {
  ErrAuth: {
    status: 401,
    message: "Invalid Authorization",
  },
  ErrNotFound: {
    status: 404,
    message: "Not Found",
  },
  ErrInternal: {
    status: 500,
    message: "${message}",
    args: {
      message: "Unexpect Error",
    },
  },
  ErrValidation: {
    status: 400,
    message: "Validate Failed",
  },
  ErrAddress: {
    status: 400,
    message: "Invalid Address",
  },
  ErrSignature: {
    status: 400,
    message: "Invalid Signature",
  },
};

export = ErrCodes;
