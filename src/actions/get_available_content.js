let fs = require('fs');
let moment = require('moment');
let axios = require('axios');
let Q = require('q');
let cheerio = require('cheerio');
let helpers = require('../helpers');
let _ = require('lodash');

let handledItems = [];

module.exports = {
    getAvailableDates() {
        return JSON.parse(fs.readFileSync('./cache/available_dates.json'));
    },

    generateSelector(data) {
        if (moment(data.date) < moment('2008-10-01')) {
            return 'body > ul > li > h3 > a';
        } else {
            return 'body > table > tbody > tr > td > table > tbody > tr > td > a';

        }
    },

    generateLink(data, input) {
        if (!input) {
            return
        }

        if (moment(data.date) >= moment('2008-10-01')) {
            // console.log('New Link Method');
            return data.url.replace(/[A-z0-9\-]+.html$/g, function (match) {
                return input
            });
        } else {
            // console.log('Old Link Method');
            return data.url.replace(/[A-z0-9\-]+.htm/g, function (match) {
                return input.replace('./', '')
            });
        }
    },

    attemptStandardParse(data, $) {
        let links = $(this.generateSelector(data));

        let parsedLinks = [];

        $(links).each((index, item) => {
            let title = $(item.children)[0].data;
            let link = $(item).attr('href');

            parsedLinks.push({
                title: title,
                url: this.generateLink(data, link)
            })
        });

        return parsedLinks;
    },

    attemptAlternativeParse(data, $) {
        let links = $('body > table:nth-child(2) > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr > td > a');

        let parsedLinks = [];

        $(links).each((index, item) => {
            let title = $(item.children)[0].data;
            let link = $(item).attr('href');

            parsedLinks.push({
                title: title,
                url: this.generateLink(data, link)
            })
        });

        return parsedLinks;
    },

    parseAvailableContent(data, result) {
        let $ = cheerio.load(result.data);

        let links = $(this.generateSelector(data));

        console.log('Attempting Standard Parse');
        let parsedLinks = this.attemptStandardParse(data, $);

        if (parsedLinks.length === 0) {
            console.log('Using Alternative Parse');
            parsedLinks = this.attemptAlternativeParse(data, $);
        }

        let finalObject = Object.assign({}, data, {
            'articles': parsedLinks
        });

        handledItems.push(finalObject);
        return finalObject;
    },

    saveData(data) {
        return fs.writeFileSync('./cache/available_content.json', JSON.stringify(data, null, 4), {
            flag: 'w',
            encoding: 'utf8'
        });
    },

    fetchData(data) {
        console.log('Requesting:', data.url);

        return axios.get(data.url)
            .then((result) => {
                console.log('Received:', data.url);
                return this.parseAvailableContent(data, result);
            }).catch((err) => {
                console.log('Error', {
                    url: data.url,
                    error_code: err.response.status
                })
            })
    },

    run() {
        console.log('Starting Available Content Parse');

        let availableDates = this.getAvailableDates();
        return helpers.FlattenPromises(availableDates.filter((item) => {
            return item;
        }), (data) => this.fetchData(data)).then(() => {
            let formattedData = _.orderBy(handledItems, 'date');
            this.saveData(formattedData);
            console.log('Finished Available Date Parse. Cache file: /available_content.json');

        });
    }
};