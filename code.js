
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

// mongo stuff
const user = process.env.MONGO_DB_USERNAME;
const pass = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};

const uri = `mongodb+srv://${user}:${pass}@cluster0.a2web23.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });