"use strict"
const fs = require('fs');

function ReadJSONFileasObject(filename, objParams) {
    let objret;
    let callback = objParams.callback;
    let objdefault = objParams.default;

    try {
        objret = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (typeof callback === 'function') callback(objret, objParams);
    } catch(e) {
        console.log(e);
        objret = objdefault;
    }
    return objret;
}

function WriteObjectasJSONFile(filename, objJSON) {
    return new Promise (
        (resolve, reject) => {
            fs.writeFile(filename, JSON.stringify(objJSON), 'utf8', function (err) {
                if (err) {
                    throw new Error(err);// console.log(err);
                } else {
                    resolve(filename + ' saved successfully');
                }
                // console.log('tx.json saved successfully');    
            });
        }
    );
}

module.exports = {
    ReadJSONFileasObject
    , WriteObjectasJSONFile
}