const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits
} = require('discord.js')

const userSchema = require('@schemas/userSchema')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liberaracesso')
    .setDescription('Libera o acesso do membro ao serviço')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addMentionableOption((options) =>
      options
        .setName("membro")
        .setDescription("Membro a ser liberado")
        .setRequired(true)
    ),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */

  async execute(interaction) {
    const { options } = interaction

    const targetMember = options.getMember("membro")

    await userSchema.findOneAndUpdate({ userId: targetMember.user.id }, { allowed: true })
    interaction.reply("Liberado com sucesso")
  },
}
