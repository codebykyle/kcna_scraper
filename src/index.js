let axios = require('axios');
let Q = require('q');
let cheerio = require('cheerio');

const GetAvailableDates = require('./actions/get_available_dates');
const GetAvailableContent = require('./actions/get_available_content');
const GetContentBody = require('./actions/get_content_body');

// GetContentBody.run();
switch(process.argv[2].toLowerCase()) {
    case 'dates':
        GetAvailableDates.run();
        break;
    case 'content':
        GetAvailableContent.run();
        break;
    case 'body':
        GetContentBody.run();
        break;
    case 'all':
        GetAvailableDates.run().then(() => {
            return GetAvailableContent.run()
        }).then(() => {
            return GetContentBody.run();
        });
        break;
    default:
        console.log("Available Commands:");
        console.log('index.js [dates|content|body|all]');
        break;
}