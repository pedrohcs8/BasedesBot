const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} = require('discord.js')

const userSchema = require('@schemas/userSchema')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Faça seu cadastro'),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */

  async execute(interaction) {
    const { options, user } = interaction

    if (await userSchema.findOne({ userId: user.id }) != null) {
      return interaction.reply(`Você já está cadastrado no sistema.`)
    }

    await userSchema.create({ username: user.username, userId: user.id, serverPort: 0, serverCreated: false, allowed: false })
    interaction.reply("Cadastrado com sucesso")
  },
}
