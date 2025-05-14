const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits
} = require('discord.js')

const userSchema = require('@schemas/userSchema')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admincontrol')
    .setDescription('Faça seu cadastro')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((options) =>
      options
        .setName("stopserver")
        .setDescription("Para o servidor do membro e revoga seu acesso")
        .addMentionableOption((options) => options.setName("alvo").setDescription("Membro alvo"))
    )
    .addSubcommand((options) =>
      options
        .setName("removeserver")
        .setDescription("Remove o server do membro e revoga seu acesso")
        .addMentionableOption((options) => options.setName("alvo").setDescription("Membro alvo"))
    ),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */

  async execute(interaction) {
    const { options } = interaction

    const target_user = options.getUser('alvo')
    const data = await userSchema.findOne({ userId: target_user.id })

    switch(options.getSubcommand) {
      case 'stopserver': {
        try {
          await exec(`docker stop ${data.serverPort}`)
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu.`)
        }

        await userSchema.findOneAndUpdate({ userId: target_user.id }, { allowed: false })

        interaction.editReply('Servidor parado com sucesso.')
      }

      case 'removeserver': {
        try {
          await exec(`docker stop ${data.serverPort}`)
          await exec(`docker rm ${data.serverPort}`)

          fs.rmdir(`/home/pedrohcs8/${data.serverPort}`);
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu.`)
        }

        await userSchema.findOneAndUpdate({ userId: target_user.id }, { allowed: false })

        interaction.editReply(`Servidor removido com sucesso.`)
      }
    }
  },
}
