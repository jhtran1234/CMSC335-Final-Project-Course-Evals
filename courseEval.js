const express = require('express');
var path = require('path');
const fs = require("fs");
const bodyParser = require("body-parser"); 
const portNumber = Number(process.argv[2]);
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config('.env');

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

/* Our database and collection */
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.jrv2u1q.mongodb.net/?retryWrites=true&w=majority`;
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

app.get("/evaluate", (request, response) => {
    response.render("evaluate", {port: portNumber});
});

app.post("/processEval", (request, response) => {
    const eval = {
        name: request.body.name,
        email: request.body.email,
        gpa: request.body.gpa,
        background: request.body.background,
    };

    insertApplication(eval);
    response.render("processEvaluation", {
        name: request.body.name,
        email: request.body.email,
        gpa: request.body.gpa,
        background: request.body.background,
        time: new Date()
    });
});

app.get("/reviewApplication", (request, response) => {
    response.render("reviewApplication", {port: portNumber});
});

app.post("/processReviewApplication", (request, response) => {
    //TODO
    const emailQuery = request.body.email;
    lookupAppEmail(emailQuery).then((appFound) => {
        response.render("processReviewApplication", {
            name: appFound?.name,
            email: appFound?.email,
            gpa: appFound?.gpa,
            background: appFound?.background,
            time: new Date()
        });
    })
});

app.get("/adminFindEvals", (request, response) => {
    response.render("adminFindEvals", {port: portNumber});
});

app.post("/processAdminGPA", (request, response) => {
    const gpaQuery = request.body.gpa;

    lookupGPA(gpaQuery).then((arrayFound) => {
        let table = `<table border='1'>
            <tr>
            <th>Name</th>
            <th>GPA</th>
            </tr>`;

        arrayFound.forEach(ele => {
            table += `<tr><td>${ele.name}</td><td>${ele.gpa}</td></tr>`;
        });

        table += `</table>`;

        response.render("processAdminGPA", {
            table: table
        });
    });
});

app.get("/adminRemove", (request, response) => {
    response.render("adminRemove", {port: portNumber});
});

app.post("/processApplicationRemove", (request, response) => {
    deleteAllApplications().then((deleted) => {
        response.render("processApplicationRemove", {
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

async function insertApplication(application) {
    try {
        await client.connect();
        await insertAppHelp(client, databaseAndCollection, application);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertAppHelp(client, databaseAndCollection, application) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(application);
}

async function lookupAppEmail(email) {
    let appFound;
    try {
        await client.connect();
        appFound = await lookupAppEmailHelp(client, databaseAndCollection, email);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    return appFound;
}

async function lookupAppEmailHelp(client, databaseAndCollection, email) {
    let filter = {email: email};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   return result;
}

async function lookupGPA(gpa) {
    let gpaFound;
    try {
        await client.connect();
        gpaFound = await lookupGPAHelp(client, databaseAndCollection, gpa);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    return gpaFound;
}

async function lookupGPAHelp(client, databaseAndCollection, gpa) {
    let filter = {gpa : {$eq: gpa}};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    const result = await cursor.toArray();
    return result;
}

async function deleteAllApplications() {
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