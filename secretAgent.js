const express = require('express');
var path = require('path');
const fs = require("fs");
const bodyParser = require("body-parser"); 

let portNumber = 5000;
if (process.argv[2] != null){
    portNumber = Number(process.argv[2]);
}

const { MongoClient, ServerApiVersion } = require('mongodb');
const { argv } = require('process');
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

/* Our database and collection */
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.a2web23.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

/* app is a request handler function */
const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);

/* To handle post parameters */
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/addAgent", (request, response) => {
    response.render("addAgent", {port: portNumber});
});

app.post("/processAddAgent", (request, response) => {
    const eval = {
        alias: request.body.alias,
        language: request.body.language
    };

    insertAgent(eval);
    response.render("processAddAgent", {
        alias: request.body.alias,
        language: request.body.language,
    });
});

app.get("/agentCommunicate", (request, response) => {
    response.render("agentCommunicate", {port: portNumber});
});

app.post("/processAgentCommunicate", (request, response) => {
    const aliasQuery = request.body.alias;
    const message = request.body.message;

    //TODO Translate message
    const translated = message;

    lookupAlias(aliasQuery).then((agentFound) => {
        if (agentFound?.alias == null) {
            response.render("failedAgentCommunicate", {});
        } else {
            response.render("processAgentCommunicate", {
                alias: agentFound?.alias,
                message: message,
                translated: translated
            });
        }
    })
});

app.get("/removeAllAgents", (request, response) => {
    response.render("removeAllAgents", {port: portNumber});
});

app.post("/processRemoveAllAgents", (request, response) => {
    deleteAllAgents().then((deleted) => {
        response.render("processRemoveAllAgents", {
            numberRemoved: deleted
        });
    }).catch(console.error);

});

process.stdin.setEncoding("utf8");
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop" || command === "Stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        } else {
            console.log(`Invalid command: ${command}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

async function insertAgent(application) {
    try {
        await client.connect();
        await insertAgentHelp(client, databaseAndCollection, application);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertAgentHelp(client, databaseAndCollection, application) {
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(application);
}

async function lookupAlias(alias) {
    let agentFound;
    try {
        await client.connect();
        agentFound = await lookupAliasHelp(client, databaseAndCollection, alias);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    return agentFound;
}

async function lookupAliasHelp(client, databaseAndCollection, alias) {
    let filter = {alias: alias};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   return result;
}

async function deleteAllAgents() {
    let deleteCount = 0;
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        deleteCount += result.deletedCount;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    return deleteCount;
}