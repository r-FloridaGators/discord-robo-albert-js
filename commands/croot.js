const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('croot')
		.setDescription('Replies with recruit information.')
        .addIntegerOption(option =>
            option.setName('class')
                .setDescription('The year of the graduating class')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the recruit')
                .setRequired(true)),
	async execute(interaction) {
        const year = interaction.options.getInteger('class');
        const name = interaction.options.getString('name');
        const url = `https://247sports.com/Season/${year}-Football/Recruits.json?&Items=15&Page=1&Player.FullName=${name}`

        const response = await fetch(url)
        if (response.ok) {
            const data = await response.json();

            if (!data || !data.length) {
                await interaction.reply('Sorry, no results found.');
                return;
            } else if (data.length > 2) {
                await interaction.reply('Too many results.  Please be more specific.');
                return;
            }

            for (let key in data) {
                player_data = data[key];
                const player = player_data['Player'];
                const fullname = player['FullName'];
                const position = player['PrimaryPlayerPosition']['Abbreviation'];
                const height = player['Height'];
                const weight = player['Weight'].toString();
                const bio = player['Bio'];
                var evaluation = player['ScoutEvaluation'];
                if(!evaluation) evaluation = 'No scout evaluation.';
                const player_url = player['Url'];
                const thumnbail_url = player['DefaultAssetUrl'];
                const composite_rating = (Math.round(player['CompositeRating'] * 100) / 100).toString();
                const stars = player['CompositeStarRating'];
                const stars_str = '⭐'.repeat(stars);

                const embed = new MessageEmbed()
                    .setTitle(fullname)
                    .setURL(player_url)
                    .setThumbnail(thumnbail_url)
                    .setDescription(bio)
                    .addField('Position', position, true)
                    .addField('Height', height, true)
                    .addField('Weight', weight, true)
                    .addField('247 Composite', stars_str)
                    .addField('247 Composite Rating', composite_rating);

                await interaction.reply({ embeds: [embed] });
            }
        } else {
            await interaction.reply('An error occurred, please check your inputs.');
        }
	},
};