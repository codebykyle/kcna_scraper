let fs = require('fs');
let moment = require('moment');
let axios = require('axios');
let Q = require('q');
let cheerio = require('cheerio');
let helpers = require('../helpers');
let _ = require('lodash');
let striptags = require('striptags');

let contentObject = [];

module.exports = {
    getAvailableContent() {
        return JSON.parse(fs.readFileSync('./cache/available_content.json'))
    },

    parseBodyOld(data, article_data, result) {
        let parsedData = result.data.split('<hr>')
            .map((item) => striptags(item.trim()))
            .filter((item) => {
                return !item.toLowerCase().includes('back home') &&
                       !item.toLowerCase().includes('past news')
            });

        let indexFromUrl = article_data.url.match(/#[0-9]+/g)[0].replace('#', '');
        let body = parsedData[indexFromUrl - 1];
        return Object.assign({}, article_data, {
            content: body
        });
    },

    parseBodyNew(data, article_data, result) {
        let $ = cheerio.load(result.data);
        let body = $('body > table:nth-child(2) > tbody > tr:nth-child(7) > td');
        let title = $('body > table:nth-child(2) > tbody > tr:nth-child(4) > td > div > b');

        let titleInnerText = $(title).text();
        let bodyInnerText = $(body).text();

        let completedBody = ''.concat(titleInnerText).concat('\r\n').concat(bodyInnerText).trim();

        return Object.assign({}, article_data, {
            content: completedBody
        })
    },

    parseBody(data, article_data, result) {
        if (moment(data.date) >= moment('2008-10-01')) {
            console.log('Parsing Method:', 'New');
            return this.parseBodyNew(data, article_data, result);
        } else {
            console.log('Parsing Method:', 'Old');
            return this.parseBodyOld(data, article_data, result);
        }
    },

    fetchData(data, article_data) {
        console.log('Parsing', article_data.url);

        return axios.get(article_data.url)
            .then((result) => {
                return this.parseBody(data, article_data, result)
            }).catch((err) => {
                console.log('error', err)
            });
    },

    runAllArticles(data) {
        return new Promise((succ, fail) => {
            let content = [];

            return helpers.FlattenPromises(data.articles, (item) => {
                return this.fetchData(data, item).then((result) => {
                    content.push(result);
                    return result;
                });
            }).then((body) => {
                return Object.assign({}, data, {
                    articles: content
                });
            }).then((obj) => {
                this.saveData(data, obj)
            }).then(() => {
                succ()
            }).catch((err) => {
                console.log(err)
            })
        })
    },

    saveData(data, obj) {
        return fs.writeFileSync('./cache/juche/'  +moment(data.date).format('YYYY-MM-DD') + '_juche.json', JSON.stringify(obj, null, 4), {
            flag: 'w',
            encoding: 'utf8'
        });
    },

    run() {
        console.log('Starting Body Parse');
        let availableContent = this.getAvailableContent();
        return helpers.FlattenPromises(
            availableContent.filter((item) => {
                return true
            }),
            (data) => {
                return this.runAllArticles(data)
            })
            .then(() => {
                console.log('Finished Body Parse. Cache file: /juche/*.json');
            }).catch((err) => {
                console.log(err);
            });
    }
};