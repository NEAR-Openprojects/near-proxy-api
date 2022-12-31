import fastify from 'fastify'

const fastifyMongoDbSanitizer = require('fastify-mongodb-sanitizer');

const fastifyMongodbsanitizerOptions = {
    params: true,
    query: true,
    body: true,
};

const server = fastify()

server.register(fastifyMongoDbSanitizer, fastifyMongodbsanitizerOptions);
// server.register(require('fastify-mongodb'), {
//   forceClose: true,
//   url: process.env.MD_CS
// })

server.register(require('./routes/near-basic.routes'));

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
