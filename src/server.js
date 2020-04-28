import express from 'express';
import bodyParser from 'body-parser';   // alows our server to extract data from req's body
import { MongoClient } from 'mongodb';
import path from 'path';      // included in node.js


const app = express();

// USES
app.use(express.static(path.join(__dirname, '/build'))) // where to serve static files (e.g. images)

app.use(bodyParser.json()); //parses json obj included in POST and adds it as body property to the request



// our super refactoring function
const withDB = async (operations, res) => {
  // connecting to db is asynchronous so it requires proper handling of promises async/await
  // since we use await keyword inside this callback, we need to use async at the top ^
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });     //mongodb resides in this specific port
    const db = client.db('react-blog');

    await operations(db);

    client.close();     // close connection to db
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error });
  }
}





// GETS ------------------------------
app.get('/api/articles/:name', async (req, res) => {

  withDB( async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db.collection('articles').findOne({ name: articleName });   // find one item in db that matches our articleName (from url)
    res.status(200).json(articleInfo);    // json = send, but better for json format
  }, res)
  
})


//POSTS ------------------------------
/* test */
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}`));  //gets body from bodyParser

/* serious */
// --add upvote--
app.post('/api/articles/:name/upvote', async (req, res) => {

    withDB(async (db) => {
      const articleName = req.params.name;  // extract name from url

      const articleInfo = await db.collection('articles').findOne({ name: articleName });
      await db.collection('articles').updateOne({ name: articleName }, {
        '$set': {
          upvotes: articleInfo.upvotes + 1,
        },
      });
      const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
  
      res.status(200).json(updatedArticleInfo);
    }, res)
    
})

// --add comments--
app.post('/api/articles/:name/add-comment', (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB( async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        comments: articleInfo.comments.concat({ username, text })
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
})


app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));     // all cought requests from our other api routes should be passed on to our app (for correct url processing)
})


app.listen(8000, () => console.log('Listening on port 8000'));




/*
app.get( ENDPOINT/URL , (request, response) => send a response )

start the server
app.listen(port where to listen, action on connection)

in terminal write
(without nodemon):
npx babel-node src/server.js
(with nodemon without package.json modified):
npx nodemon --exec npx babel-node src/server.js   //nodemon will rerun the command after '--exec'
(with 'start' script in package.json):
npm start

...
we're starting each req url wit 'api' just for comfort



.......................
unmodified version of the get request

try {
    const articleName = req.params.name;

    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });     //mongodb resides in this specific port
    const db = client.db('react-blog');

    const articleInfo = await db.collection('articles').findOne({ name: articleName });   // find one item in db that matches our articleName (from url)
    res.status(200).json(articleInfo);    // json = send, but better for json format

    client.close();     // close connection to db
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error });
  }

*/