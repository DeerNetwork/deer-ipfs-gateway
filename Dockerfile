FROM sigoden/node:16-native as builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --prod

FROM sigoden/node:16-slim
WORKDIR /app
COPY --from=builder /app .
COPY dist .
ENV NODE_ENV=production
CMD ["node", "./dist/index.js"]