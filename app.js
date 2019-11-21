// jshint esversion: 6
console.log("luis app started");

// requiring node modules.
const express = require("express");
const bodyParser = require("body-parser");
let mongoose = require("mongoose");
let request = require('request');

// creating app using express module.
const app = express();

// Requesting data from url
let query = '';
const key = '205455bb2302469c9e4ee8194534b487';

// connecting the mongo database.
mongoose.connect("mongodb://localhost/luisDB", { useUnifiedTopology: true, useNewUrlParser: true });


let humansQuery = "";
let listHumanQueries = [];

let botResponses = "";
let listOfBotResponses = [];

// checking mongo connection
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
    console.log('app db connected');

    // creating database schema
    let answerSchema = new mongoose.Schema({
        intentType: {
            type: String
        },
        possibleAnswers: {
            type: Array
        }
    });

    // Todo replace deleted commands, with
    if (!(query == '' || query == null)) {
        // function for making apiRequests.
        apiRequestFunction(key, query);
    }

    checkIfDataBaseExists(mongoose.model('Answer', answerSchema));
});

// Todo: Change array to mongo database.
// let items = [];

app.use(bodyParser.urlencoded({ extended: true }));

// serving public files on express.
app.use(express.static('public'));

app.set('view engine', 'ejs');

// creating app get requests.
app.get("/", (req, res) => {
    // Todo: Check for changes in db and pass them to
    // the chatBot template to be displayed on the UI.
    listHumanQueries.push(humansQuery);
    // console.log(listHumanQueries);

    listOfBotResponses.push(botResponses);
    botResponses = null;
    console.log("Bot responses: " + listOfBotResponses);


    //Todo creating a mongoDB update function.

    res.render('chatBot.ejs', { pageType: 'chatBot', humanQueries: listHumanQueries, botResponses: listOfBotResponses });
});

app.post("/", (req, res) => {

    // item = req.body.newItem;
    humansQuery = req.body.humansQuery;

    // console.log("Human typed: " + humansQuery);

    // Todo query api using humansQuery and return output.
    apiRequestFunction(key, humansQuery);

    // Todo: Change statement below, to items array should be changed to
    // adding data to the humanQuery collection.
    // items.push(item);

    // Todo: Get the chatBot response to humanQuery
    // store chatBot response, into the botResponse collection
    res.redirect("/");
});


// server
app.listen(3000, () => {
    console.log("Server started on port 3000");
});


// Utility Functions.

function apiRequestFunction(key, query) {
    if (!(query == '')) {
        let intentType = "";
        let requestResponse = null;

        // api endpoint.
        let apiEndpoint = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/c76a2c59-b399-4816-905a-7d7d882eb575?verbose=true&timezoneOffset=0&subscription-key=${key}&q=${query}`;

        // creating promises to handle api requests.
        let endPointRequest = new Promise((resolve, reject) => {
            request(apiEndpoint, { json: true }, (err, res, body) => {
                if (err) {
                    reject("Error");
                } else {
                    resolve(res);
                }
            });
        });

        endPointRequest.then((data) => {
            intentType = data.body.topScoringIntent.intent;
            // console.log("New intent is: " + intentType);
            console.log(data.body.topScoringIntent);
            // console.log(data.body);

            // querying database using intent types
            returnAnswersCorrespondingTo(intentType, mongoose.model('Answer', answerSchema));

        }).catch((err) => {
            console.log("Connection to api timed out.");
        });

    } else {
        console.log("Null request can't be processed.");
    }
}

// Checking if database exists, if not compile model to document.
// Else do nothing.
function checkIfDataBaseExists(Model) {
    if (Model.exists({})) {
        console.log("db exists");
    } else {
        console.log("db doesn't exists");
        console.log("creating db");
        // compiling schema into models
        // creating database if not already existing.
        createNewLuisDBInstance(Model);
    }
}

// returning answers corresponding to the intentTypes.
function returnAnswersCorrespondingTo(intentTypes, Answer) {
    Answer.find({ intentType: intentTypes }, function(err, docs) {
        // entityCrossReferenceWith(docs);
        console.log(docs);

    });
}

// // this functions returns the best answer, to any given question,
// // by cross-referencing answerLists with the returned entities.
// // Function should return a single question or a combination of questions
function entityCrossReferenceWith(docs) {
    // console.log("Starting cross-referencing");
    // Todo, use entity list to check best possible answer for a given query.
    // warning: function returning arbitrary choice at this point.
    botResponses = docs[0].possibleAnswers[0];
}


// creating a bunch of objects to insert into the documents.
function createNewLuisDBInstance(Answer) {
    const convoLine1 = new Answer({
        intentType: "createAccount",
        possibleAnswers: [
            `Any one above 18yrs.
            Requirements
            •	An identification (Voter Id, National Id, Driver’s license, International Passport)
            •	Proof of address
            `,
            `Any legal registered company, enterprise or institution.
            Requirements
            •	Certificate of registration
            •	Certificate of incorporation, certificate to commence business
            •	3 years financial statement
            •	Letter of introduction from lawyer or auditor
            `,
            `Students in tertiary institution`,
            `Parents/Guardians can open an account In-Trust-For (ITF) minors;
             these are individuals below the legal age of 18 years.
             Note: Activities on this account type will be managed by the Parent/Guardian.`,
            `No, you cannot open an account with zero balance.`,
            `The minimum amount of money needed to open an account are stated below respectively
            •	FlexiSave – Ghs 100.00
            •	Student Account – Ghs 10.00
            •	KiddySave Account – Ghs 20.00
            •	Premium Account – Ghc 500.00
            `,
            `Locate any branch of the bank, go with required documents
             (i. Voter Id, National Id, Driver’s license, International Passport and a proof of address)
            `

        ]
    });

    const convoLine2 = new Answer({
        intentType: "getBankInfo",
        possibleAnswers: [
            `The bank has an array of savings account.
            •	KiddySave Account
            •	Student Account
            •	FlexiSave Account
            `,
            `The banks is located at Legon Banking Square.`,
            `Working hours 8:00 am - 6:00 pm`,
            `VBank Limited continues to provide a broad range
             of banking and financial solutions to large corporations,
             small and medium-sized enterprises`,
            `We have over 29 branches and over 100 ATMs across Ghana.`,
            `Address is
            P. O. Box 14596
            Accra, Ghana
            Achimota, Accra

            GPS CODE: GA- 204 - 8950`,
            `Contact Number: +233 26 300 8191 / +233 26 321 1563`,
            `The bank offers only two account types
            •	Individuals
            •	SMEs (Enterprise and Sole Proprietorship)
            `
        ]
    });

    const convoLine3 = new Answer({
        intentType: "getChipInfo",
        possibleAnswers: [
            `Chip card is a standard size debit card 
            plastic with both an embedded chip and a traditional magnetic stripe.`,
            `Make purchases by inserting your chip card into the chip-enabled 
            merchant terminal. You will be asked for a PIN to complete most purchases.`,
            `Very secure. First, the encrypted chip makes The bank Visa Debit card difficult 
            to copy or counterfeit. Second, you can have confidence in the protection and 
            security features that we provide for you. `,
            `Yes. You will be charged a fee if you request for a The bank chip card.`,
            `
            •	Stop your card straight away by calling The bank. You can also stop your card yourself using CalNet.
            •	Because your card has PIN, No-one else should be able to use it at an ATM as long as you have kept your PIN a secret.
            •	Your card will be replaced instantly of you reporting it stolen or missing
            `
        ]
    });

    const convoLine4 = new Answer({
        intentType: "getEProductInfo",
        possibleAnswers: [
            `No. Mobile money transaction is currently limited to MTN mobile money subscribers only.`,
            `Yes. One can have different numbers on service`,
            `Yes. Cost of ordering an personal account card is GHS8. 
            Card Issuance fee is free for The bank Students Accountholder only`,
            `If your PIN gets blocked, please contact the nearest 
            The bank branch to request for a new PIN. However with the chip card, 
            we can reset number of PIN tries as long as client remembers PIN code. 
            Once client forgets PIN code, he or she has to apply for a new card.`,
            `Default daily limit has been set to GHS800, however, this can be increased upon your request.`,
            `This is a four step process, please follow them carefully.
                a.	Visit your preferred online website.
                b.	Order your items and go to check out.
                c.	Input your card details i.e. name on the card, expiry date, card number, CVV/security code (last 3 digits behind card).
                d.	Your account will automatically be debited when transaction is successful.
            `,
            `No. Money transfer services only allows you to receive money in Ghana`
        ]
    });

    const convoLine6 = new Answer({
        intentType: "getInterestInfo",
        possibleAnswers: [
            `Interests are tiered.`,
            `Accounts start accruing interest from the first day.`,
            `Interest earn daily simple interest on minimum balance on account.`,
        ]
    });

    const convoLine7 = new Answer({
        intentType: "getInvestmentInfo",
        possibleAnswers: [
            `The bank InvestPlus is a uniquely designed financial investment which offers
            depositors a higher rate of interest as compared to a standard savings account, 
            during the period of the investment. The bank InvestPlus offers flexibility which 
            allows the holder of the instrument to discount it before maturity.`,
            `InvestPlus can be purchased for a period not exceeding 12 months (1 year). 
            That is, a minimum period of one (1) month and a maximum twelve (12) months. 
            One can also choose to roll over the investments upon maturity.`,
            `Yes, please, you do need an account before purchasing a plan.`,
            `Interests are tiered, and they depend on the tenor and principal of the investment.`,
            `A minimum of Ghs 50.00`,
            `Investments can only in local currency`,
            `This is a high interest bearing investment instrument offered to both corporate and
             individual clients. It is available to only The bank account holders. 
             It provides clients with instant liquidity with negotiable interest rates`,
            `Yes. Interest accruing from the investment will be paid into this account.`,
            `No. Interest on Treasury Bill (T-Bill) is fixed and non-negotiable.`
        ]
    });

    const convoLine5 = new Answer({
        intentType: "getHelpInfo",
        possibleAnswers: [
            `Please, talk to a customer care representative,
             using the numbers +233 26 300 8191 / +233 26 321 1563.`,
            `What do you need, help with?`,
            `How can I help you?`,
            `How can I be of service to you?`,
            `Okay, sure what do you need?`
        ]
    });

    const convoLine8 = new Answer({
        intentType: "greetUser",
        possibleAnswers: [
            `Dear Sir or Madam.`,
            `Yo!, what's up?`,
            `Hello, good day.`,
            `Howdy`,
            `Alright mate?`,
            `Whazzup?`,
            `Hello, there?`,
            `How are you?`
        ]
    });

    const convoLine9 = new Answer({
        intentType: "None",
        possibleAnswers: [
            `I didn't quite get that, can you come again?`,
            `I don't understand you.`,
            `Sorry, I can't answer your question.`,
            `I don't get you.`
        ]
    });

    const convoLine10 = new Answer({
        intentType: "getPosInfo",
        possibleAnswers: [

        ]
    });

    // inserting convoLinesIntoDB.
    let arrConvoLines = [convoLine1, convoLine2, convoLine3, convoLine4, convoLine5,
        convoLine6, convoLine7, convoLine8, convoLine9, convoLine10
    ];

    // Answer.insertMany(arrConvoLines, function(err) {});
    Answer.create(arrConvoLines, function(err, small) {
        if (err) return handleError(err);
        // saved!
    });
}