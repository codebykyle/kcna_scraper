const Q = require('q');

const FlattenPromises = (items, callback) => {
    let promiseChain = Q();

    items.forEach((item) => {
        promiseChain = promiseChain.then(() => {
            return callback(item)
        })
    });

    return promiseChain;
};


const FormatString = (string, obj) => {
    let self = this;

    const formattedString = string.replace(/{([0-9A-z_]+)}/g, function (match, field) {
        let value = obj[field];
        return (typeof field !== "undefined") ? value : match;
    });

    return formattedString;
};

const GenerateRange = (start, stop, step = 1) => {
    return Array(stop + 1 - start).fill(start).map((value, index) => {
        return value + index * step;
    });
};

module.exports = {
    FlattenPromises,
    FormatString,
    GenerateRange
};