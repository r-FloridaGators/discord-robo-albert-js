const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const espn_team_names = require('../util/espn-team-names.js');

async function get_game_id(team_name) {
    team_name = espn_team_names.get_actual_team_name(team_name);
    if(team_name === 'notfound') return null;

    team_name = team_name.replace(' ', '');

    const url = `http://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team_name}`;
    const response = await fetch(url)
    if(response.ok) {
        const data = await response.json();
        var game_id = data['team']['nextEvent'][0]['id'];
        return game_id;
    } 
}

async function get_score(game_id) {
    const url = `http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${game_id}`

    console.log(url);
    response = await fetch(url)
    if(response.ok) {
        const data = await response.json();
        return data;
    }
}

function create_score_embed(game) {
    const competition = game['header']['competitions'][0];

    const gamecast = game['header']['links'][0]['href'];

    const status = competition['status']['type']['shortDetail'];

    const home = competition['competitors'][0];
    const away = competition['competitors'][1];

    const homeScore = parseInt(home['score']);
    const awayScore = parseInt(away['score']);

    var thumbnail_url;
    try {
        thumbnail_url = game['gameInfo']['venue']['images'][0]['href'];
    } catch (error) {
        thumbnail_url = home['team']['logos'][0]['href'];
        if(awayScore > homeScore) {
            thumbnail_url = away['team']['logos'][0]['href'];
        }
    }

    const awayField = (away['possession'] ? '🏈 ' : '') + away['team']['displayName'] +  (away['score'] ? ' ' + away['score'] : '');
    const homeField = (home['possession'] ? '🏈 ' : '') + home['team']['displayName'] +  (home['score'] ? ' ' + home['score'] : '');
    const broadcast = game['header']['competitions'][0]['broadcasts'][0]['media']['shortName'];

    const embed = new MessageEmbed()
        .setTitle(`${away['team']['displayName']} at ${home['team']['displayName']}`)
        .setThumbnail(thumbnail_url)
        .setURL(gamecast)
        .addField('Status', status)
        .addField('Away', awayField, true)
        .addField('Home', homeField, true)
        .addField('Broadcast', broadcast);

    return embed;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('score')
		.setDescription('Replies with game score.')
        .addStringOption(option =>
            option.setName('team')
                .setDescription('The name of the team.')
                .setRequired(true)),
	async execute(interaction) {
        const team = interaction.options.getString('team');

        var game_id = await get_game_id(team);

        if(!game_id) {
            interaction.reply('Team not recognized.  Please try a different team name.');
            return;
        }

        var game = await get_score(game_id);

        if(!game) {
            interaction.reply('There was an error in retrieving the game.');
            return;
        }

        var embed = create_score_embed(game);

        await interaction.reply({ embeds: [embed] });
    }
}