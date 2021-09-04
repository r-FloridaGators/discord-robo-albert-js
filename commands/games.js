const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { cfbDataApiKey } = require('../config.json');
const cfb_data_team_names = require('../util/cfb-data-team-names.js');
const fetch = require('node-fetch');

async function get_games(year, team, isRegular) {
    const url = `https://api.collegefootballdata.com/games?year=${year}&seasonType=${isRegular ? 'regular' : 'postseason'}&team=${team}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${cfbDataApiKey}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        return null;
    }
}

function create_games_embed(year, team, regular_games, post_games) {
    const regular_data = get_games_string(year, team, regular_games);
    const post_data = get_games_string(year, team, post_games);

    const embed = new MessageEmbed()
        .setTitle(`${team} in ${year}`)
        .addField(`Regular Season (${regular_data[1]}-${regular_data[2]})`, regular_data[0])

        // check to see if a message string was created, aka did they have a post season
        if(post_data[0].length > 0) {
            embed.addField(`Post Season (${post_data[1]}-${post_data[2]})`, post_data[0]);
        }

    return embed;
}

function get_games_string(year, team, games) {
    var message = '';
    var wins = 0;
    var losses = 0;
    var ties = 0;

    for(let game_index in games) {
        const game = games[game_index];

        const away_team = game['away_team'];
        const home_team = game['home_team'];
        const is_home_team = team.toLowerCase() === home_team.toLowerCase();
        const print_team = is_home_team ? away_team : home_team;
        const home_points = game['home_points'];
        const away_points = game['away_points'];

        var print_away_points = '';
        var print_home_points = '';
        var print_result = '';

        try {
            const is_tie = parseInt(home_points) == parseInt(away_points);
            const is_home_win = parseInt(home_points) > parseInt(away_points);

            print_away_points = (away_points !== null ? (is_home_team ? '' : '**') + away_points + (is_home_team ? '' : '**') : '');
            print_home_points = (home_points !== null ? (is_home_team ? '**' : '') + home_points + (is_home_team ? '**' : '') : '');

            if(home_points === null) {
              print_result = ''
            } else if(is_tie) {
                print_result = '**TIE**';
                ties++;
            } else if((is_home_team && is_home_win) || (!is_home_team && !is_home_win)) {
                print_result = '**WIN**';
                wins++;
            } else if((is_home_team && !is_home_win) || (!is_home_team && is_home_win)){
                print_result = 'LOSS';
                losses++;
            }
        } catch(error) {
            console.log(error);
        }

        message += `Week ${game['week']}${ home_points === null ? '' : ':' } ${print_result} ${is_home_team ? 'vs.' : '@'} ${print_team}: ${print_away_points} ${ home_points === null ? '' : '-' } ${print_home_points}\n`;
    }

    return [message, wins, losses, ties];
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('games')
		.setDescription('Replies with game results.')
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('The year of the games')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team')
                .setDescription('The name of the team')
                .setRequired(true)),
	async execute(interaction) {
        const year = interaction.options.getInteger('year');
        var team = interaction.options.getString('team');

        team = cfb_data_team_names.get_actual_team_name(team);

        const regular_games = await get_games(year, team, true);
        if(!regular_games || !regular_games.length) {
            interaction.reply('Error retrieving games.  Please check parameters.');
            return;
        }

        const post_games = await get_games(year, team, false);

        const embed = create_games_embed(year, team, regular_games, post_games);

        await interaction.reply({ embeds: [embed] });
    }
}
