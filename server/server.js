const express = require('express');
// import ApolloServer
const { ApolloServer } = require('apollo-server-express');
const { authMiddleware } = require('./utils/auth');

// import our typeDefs and resolvers
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');
const path = require('path');


const PORT = process.env.PORT || 3001;
const app = express();




  // create a new Apollo server and pass in our schema data
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: authMiddleware
  
  });

  async function startServer() {
    await server.start();
    server.applyMiddleware({ app })
  }
  startServer();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// serve up static assets 
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}
app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
  });
});