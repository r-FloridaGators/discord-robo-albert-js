const fs = require('fs');

let team_data = require('../data/espn-team-names.json');

module.exports = {
    get_actual_team_name: function(team_name) {
        team_name = team_name.toLowerCase();

        for(key in team_data) {
            if(team_name === key.toLowerCase() || 
               team_data[key].includes(team_name)) {
                   return key;
               }
        }

        return 'notfound';
    }
}