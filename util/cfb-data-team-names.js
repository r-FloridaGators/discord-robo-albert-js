const fs = require('fs');

let team_data = require('../data/cfb-data-team-names.json');

module.exports = {
    get_actual_team_name: function(team_name) {
        const lower_team_name = team_name.toLowerCase();

        for(key in team_data) {
            if(lower_team_name === key.toLowerCase() || 
               team_data[key].includes(lower_team_name)) {
                   return key;
               }
        }

        return team_name;
    }
}