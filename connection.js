// Do not change this file
require('dotenv').config();
const { MongoClient} = require('mongodb');

async function main(callback) {
    const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file
    const client = new MongoClient(URI, {useNewUrlParser: true,useUnifiedTopology: true});

    try {
        // Connect to the MongoDB cluster
        await client.connect();
    
        // Send a ping to confirm a successful connection
        await client.db("database").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        // Make the appropriate DB calls
        await callback(client);

    }  catch (e) {
        // Catch any errors
        console.error(e);
        throw new Error('Unable to Connect to Database')}
    
}

module.exports = main;