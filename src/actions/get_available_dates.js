let fs = require('fs');
let moment = require('moment');
let axios = require('axios');
let Q = require('q');
let cheerio = require('cheerio');
let helpers = require('../helpers');
let _ = require('lodash');

let discoveredDates = [];

module.exports = {
    getEndpoint(forYear) {
        return 'http://kcna.co.jp/item/' + forYear + '/calendar-' + forYear + 'e.html';
    },

    getMaxDate() {
        return moment().year();
    },

    generateRange(start, stop, step=1) {
        return helpers.GenerateRange(start, stop, step);
    },

    generateActualURL(year, string) {
        return 'http://kcna.co.jp/item/' + year + '/' + string
    },

    saveData(data) {
        return fs.writeFileSync('./cache/available_dates.json', JSON.stringify(data, null, 4), {
            flag: 'w',
            encoding: 'utf8'
        });
    },

    generateSelector(year, row, column) {
        if (year >= 2018) {
            return helpers.FormatString('body > htm > table:nth-child(3) > tbody > tr:nth-child(5) > td:nth-child(2) > table > tbody > tr:nth-child({row}) > td:nth-child({column}) > table', {
                column: column,
                row: row
            })
        }
        else if (year >= 2009) {
            return helpers.FormatString('body > table:nth-child(1) > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr:nth-child({row}) > td:nth-child({column}) > table', {
                column: column,
                row: row
            });
        } else if (year === 2008) {
            return helpers.FormatString('body > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr:nth-child({row}) > td:nth-child({column}) > table', {
                column: column,
                row: row
            })
        }
        else if (year === 2007) {
            return helpers.FormatString('body > htm > table:nth-child(3) > tbody > tr:nth-child(5) > td:nth-child(2) > table > tbody > tr:nth-child({row}) > td:nth-child({column}) > table', {
                column: column,
                row: row
            });
        } else {
            return helpers.FormatString('body > table:nth-child(1) > tbody > tr:nth-child(5) > td:nth-child(2) > table > tbody > tr:nth-child({row}) > td:nth-child({column}) > table', {
                column: column,
                row: row
            });
        }
    },

    getCalendarRow(month) {
        switch(month) {
            case 12:
            case 11:
                return 3;
            case 10:
            case 9:
                return 6;
            case 8:
            case 7:
                return 9;
            case 6:
            case 5:
                return 12;
            case 4:
            case 3:
                return 15;
            case 2:
            case 1:
                return 18
        }

    },

    parseCalendar(year, result) {
        let $ = cheerio.load(result.data);

        let monthRange = this.generateRange(1, 12).reverse();

        console.log('Parsing Year:', year);

        monthRange.forEach((month) => {
            let row = this.getCalendarRow(month);
            let column = month % 2 ? 3 : 1;

            let selector = this.generateSelector(year, row, column);
            let cells = $(selector).find('tbody > tr > td > font > a');

            $(cells).each((index, item) => {
                let parsedUrl = $(item).attr('href');
                let day = $(item.children)[0].data;

                let generatedDate = moment().year(year).month(month - 1).date(day);
                let url = this.generateActualURL(year, parsedUrl);

                let finalObj = {
                    date: generatedDate.format('YYYY-MM-DD'),
                    url
                };

                discoveredDates.push(finalObj);

            });
        });

        console.log('Finished Year:', year);

        return discoveredDates;

    },

    fetchData(year) {
        return axios.get(this.getEndpoint(year))
            .then((result) => {
                return this.parseCalendar(year, result);
            }).catch((err) => {
                console.log('Error', err)
            })
    },

    run() {
        console.log('Starting Available Date Parse');

        let yearRange = this.generateRange(1997, this.getMaxDate());
        return helpers.FlattenPromises(yearRange, (year) => this.fetchData(year))
            .then(() => {
                let formattedData = _.orderBy(discoveredDates, 'date');
                this.saveData(formattedData);

                console.log('Finished Available Date Parse. Cache file: /available_dates.json');
            });
    }
};