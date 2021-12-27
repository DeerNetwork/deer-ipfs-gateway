# Deer Ipfs Gateway

A ipfs gateway with deer wallet based authentication.

## Usage

### Get Auth token

1. Get nonce

```
curl http://localhost:5050/nonce?address=15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5

> {"nonce":0,...} 
```

2. Generate signature with wallet

```js
const account = keyring.addFromUri('//Alice'); 
const message = stringToU8a(`login to deer ipfs gateway, nonce=${nonce}`); // nonce from prev step
const signature = account.sign(message); // signature
```

3. Login with signature

```
curl -X POST -d '{"address":"15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5","signature":"0x..."} http://localhost:5050/login -H 'content-type: application/json'

> {"address":"15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5","secret":"28db19a5-1257-47c7-b357-4cbaffe14780","expireAt"::1640867865160}
```

### Call ipfs api with token

After the login, use jwt token to authenticate your API

```sh
curl -X POST -F file=@myfile \
-u "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5:28db19a5-1257-47c7-b357-4cbaffe14780" \
"http://localhost:5050/api/v0/add"

> {
      "Name":"ipfs_file_docs_getting_started_demo.txt",
      "Hash":"QmeGAVddnBSnKc1DLE7DLV9uuTqo5F7QbaveTjr45JUdQn",
      "Size":"44"
}
```

## Quota

You can control 2 monthly quotas:

- **Data transfer UP quota**: maximum allowed data/month sent to the IPFS service (e.g: 5 GB)
- **Data transfer DOWN quota**: maximum allowed data/month retrieved from the IPFS service (e.g: 5 GB)

## Rate Limits
Deer ipfs gateway will be subject to rate limits after exceeding their request count during a short time window. These rate limits are in place to ensure the reliability of our service for everyone using it. The current rate limits can change without notice in the future.

Users performing authenticated requests associated with a particular project have wider rate limits, and can achieve more requests per second.

Write API calls have **10 requests/sec** limit for the following endpoints:
```
"/api/v0/add",
"/api/v0/block/put",
"/api/v0/dag/put",
"/api/v0/object/put",
"/api/v0/pin/add"
```

You can retrieve IPFS data using the API with a limit of **100 requests/sec** via the remaining read-only methods such as:
```
"/api/v0/cat"
"/api/v0/get"
"/api/v0/dag"
```

## Ipfs Api

See [ipfs api](https://sigoden.github.io/jsona-openapi/?source=https://raw.githubusercontent.com/DeerNetwork/deer-ipfs-gateway/main/apiIpfs.jsona)

## CORS

To use cors, you should:
 - add `settings.args.cors: true` to config.json
 - enable api cors on ipfs server
 ```
 ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
 ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["POST"]'
 ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["*", "Authorization"]'
 ```



## License

[Apache 2.0](./LICENSE)