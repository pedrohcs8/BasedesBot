const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  inlineCode
} = require('discord.js')

const userSchema = require('@schemas/userSchema')

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { publicIPV4, replaceLine, findPort, configureSubdomain }= require('@root/util/Utils')
const fs = require('fs')

module.exports = {
  subsincluded: true,
  data: new SlashCommandBuilder()
    .setName('controlserver')
    .setDescription('Controle Seu Servidor!')
    .addSubcommand((options) =>
      options
        .setName("createserver")
        .setDescription("Use este comando para iniciar seu servidor")
        .addStringOption((options) => options.setName("versão").setDescription("versão escolhida para o servidor").setRequired(true))
        .addStringOption((options) =>
          options
            .setName("modoonline")
            .setDescription("Configure seu servidor para rodar no modo original ou pirata.")
            .addChoices( { name: "Original", value: 'TRUE' }, { name: "Pirata", value: 'FALSE' } )
            .setRequired(true)
        )
    )
    .addSubcommand((options) =>
        options
          .setName("deleteserver")
          .setDescription("Deleta seu servidor atual")
    )
    .addSubcommand((options) =>
      options
        .setName("startserver")
        .setDescription("Inicie Seu Servidor a qualquer momento!")
    )
    .addSubcommand((options) =>
      options
        .setName("stopserver")
        .setDescription("Pare seu servidor a qualquer momento!")
    )
    .addSubcommand((options) =>
      options
        .setName("sendcommand")
        .setDescription("Mande um comando como OP no seu servidor")
        .addStringOption((options) => options.setName("comando").setDescription("Comando que será mandado").setRequired(true))
    )
    .addSubcommand((options) =>
      options
        .setName("changemotd")
        .setDescription("Mude o motd, ou seja, a descrição que fica debaixo de seu servidor.")
        .addStringOption((options) => options.setName("newmotd").setDescription('Seu novo motd').setRequired(true))
    ),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    const { options, user } = interaction

    const data = await userSchema.findOne({ userId: user.id })

    if (!data) {
      return interaction.reply("Você não está cadastrado no sistema. Use /register")
    }

    await interaction.deferReply();

    switch(options.getSubcommand()) {
      case 'createserver': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem acesso à esse comando, entre em contato com um administrador e pague seu plano.")
        }

        if (data.serverCreated) {
          return interaction.editReply("Você já criou um servidor!")
        }

        const version = options.getString("versão")
        const regexVersion = version.match(/[1-9]+/g)

        if (!regexVersion.length == 3) {
          interaction.editReply("Versão inválida.")
        }

        let java_version = ''
        const parsedVersion = parseInt(regexVersion.join(''))

        if (parsedVersion < 1165) {
          java_version = "java8-multiarch"
        } else if (parsedVersion >= 1165 && parsedVersion < 1179) {
          java_version = "java11"
        } else if (parsedVersion >= 1180 && parsedVersion < 1200) {
          java_version = "java17"
        } else {
          java_version = "java21"
        }

        let port;

        const portData = await findPort()

        console.log(portData)

        if (portData == undefined) {
          port = 25576
        } else {
          port = portData
        }

        const ip = await publicIPV4()

        const onlinemode = options.getString('modoonline')

        try {
          await exec(`docker run -t -i -d -v /home/pedrohcs8/${port}:/data -e VERSION=${version} -e ONLINE_MODE=${onlinemode} -e MEMORY=512m -p ${port}:${port} -e SERVER_PORT=${port} -e EULA=TRUE --name ${port} itzg/minecraft-server:${java_version}`)

          await configureSubdomain(user.username.toLowerCase(), port, ip)
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu, contate um administrador.`)
        }

        await userSchema.findOneAndUpdate({ userId: user.id }, { serverCreated: true, serverPort: port })

        return interaction.editReply(`Server criado com sucesso, em alguns momentos você poderá acessá-lo pelo link: ${user.username}.basedes.com`)
      }

      case 'deleteserver': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem permissão para iniciar um servidor, use o comando /register e siga os passsos para alugar seu servidor.")
        }

        if (!data.serverCreated) {
          return interaction.editReply("Você ainda não criou seu servidor! Use o comando /controlserver createserver para criá-lo.")
        }

        try {
          await exec(`docker stop ${data.serverPort}`)
          await exec(`docker rm ${data.serverPort}`)

          fs.rmdir(`/home/pedrohcs8/${data.serverPort}`);
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu, contate um administrador.`)
        }

        await userSchema.findOneAndUpdate({ userId: user.id }, { serverCreated: false, serverPort: null })

        await interaction.editReply("Servidor deletado com sucesso!")
      }

      case 'startserver': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem permissão para iniciar um servidor, use o comando /register e siga os passsos para alugar seu servidor.")
        }

        if (!data.serverCreated) {
          return interaction.editReply("Você ainda não criou seu servidor! Use o comando /controlserver createserver para criá-lo.")
        }

        try {
          await exec(`docker start ${data.serverPort}`)
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu, contate um administrador.`)
        }

        return interaction.editReply("Servidor iniciado com sucesso")
      }

      case 'stopserver': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem permissão para parar um servidor, use o comando /register e siga os passsos para alugar seu servidor.")
        }

        if (!data.serverCreated) {
          return interaction.editReply("Você ainda não criou seu servidor! Use o comando /controlserver createserver para criá-lo.")
        }

        try {
          await exec(`docker stop ${data.serverPort}`)
        } catch(e) {
          console.log(e)
          return interaction.editReply(`Um erro ocorreu, contate um administrador.`)
        }

        return interaction.editReply('Servidor parado com sucesso!')
      }

      case 'sendcommand': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem permissão para usar um servidor, use o comando /register e siga os passsos para alugar seu servidor.")
        }

        if (!data.serverCreated) {
          return interaction.editReply("Você ainda não criou seu servidor! Use o comando /controlserver createserver para criá-lo.")
        }

        let command

        command = options.getString("comando")

        if (command.charAt(0) == '/') {
          command = command.replace('/', '')
        }

        let out;

        try {
          const { stdout, stderr } = await exec(`docker exec ${data.serverPort} rcon-cli ${command}`)
          out = stdout
        } catch(e) {
          console.log(e)

          if (e.contains("not running")) {
            return interaction.reply("Seu servidor não está rodando, inicie ele primeiro")
          }

          return interaction.editReply(`Um erro ocorreu, contate um administrador.`)
        }

        if (out == null) {
          return interaction.editReply(`Talvez este comando não tenha funcionado, não tive nenhum retorno.`)
        }

        return interaction.editReply(`Comando realizado com sucesso! Retorno: ${inlineCode(out)}`)
      }

      case 'changemotd': {
        if (!data.allowed) {
          return interaction.editReply("Você não tem permissão para usar um servidor, use o comando /register e siga os passsos para alugar seu servidor.")
        }

        if (!data.serverCreated) {
          return interaction.editReply("Você ainda não criou seu servidor! Use o comando /controlserver createserver para criá-lo.")
        }

        const newMotd = options.getString('newmotd')

        replaceLine(`/home/pedrohcs8/${data.serverPort}/server.properties`, 'motd', `motd=${newMotd}`)

        interaction.editReply("Motd alterado com sucesso! Reinicie o servidor para ver o resultado.")
      }
    }
  },
}
