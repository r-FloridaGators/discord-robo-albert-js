const csv = require('csvtojson')
const csv_file_path = 'data/allInstitutions.csv'

var institutions_array, institutions = {};

module.exports.init = async function(callback) {
    if(!institutions_array) {
        institutions_array = await csv().fromFile(csv_file_path);

        for(institution_key in institutions_array) {
            institution = institutions_array[institution_key];

            var key = institution['Key']
            institutions[key] = institution;
        }
    }

    callback(institutions);
}
