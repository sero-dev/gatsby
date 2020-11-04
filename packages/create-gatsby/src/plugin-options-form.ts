import { stripIndent } from "common-tags"
import terminalLink from "terminal-link"
import Joi from "joi"
import pluginSchemas from "./plugin-schemas.json"
import cmses from "./cmses.json"
import styles from "./styles.json"
import c from "ansi-colors"

const supportedOptionTypes = [`string`, `boolean`, `number`]
export type PluginName = keyof typeof pluginSchemas

type Schema = Joi.Description & {
  // Limitation in Joi typings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flags?: Record<string, any>
}

interface IFormPrompt {
  type: string
  name: string
  multiple: boolean
  message: string
  choices: Array<{ name: string; initial: unknown; message: string }>
}

function getName(key: string): string | undefined {
  const plugins = [cmses, styles] // "features" doesn't map to names
  for (const types of plugins) {
    if (key in types) {
      return types[key as keyof typeof types]
    }
  }
  return key
}

function docsLink(pluginName: string): string {
  return c.blueBright(
    terminalLink(
      `the plugin docs`,
      `https://www.gatsbyjs.com/plugins/${pluginName}/`,
      { fallback: (_, url) => url }
    )
  )
}

export const makePluginConfigQuestions = (
  selectedPlugins: Array<PluginName>
): Array<IFormPrompt> => {
  const formPrompts: Array<IFormPrompt> = []

  selectedPlugins.forEach((pluginName: PluginName): void => {
    const schema = pluginSchemas[pluginName]
    if (typeof schema === `string` || !(`keys` in schema)) {
      return
    }
    const options: Record<string, Schema> | undefined = schema?.keys
    const choices: Array<{
      name: string
      initial: string
      message: string
    }> = []

    Object.entries(options).forEach(([name, option]) => {
      if (option?.flags?.presence !== `required`) {
        return
      }
      choices.push({
        name,
        initial:
          option.flags?.default &&
          supportedOptionTypes.includes(typeof option.flags?.default)
            ? option.flags?.default.toString()
            : undefined,
        message: name,
      })
    })

    if (choices.length) {
      formPrompts.push({
        type: `form`,
        name: pluginName,
        multiple: true,
        message: stripIndent`
          Configure the ${getName(pluginName)} plugin. 
          See ${docsLink(pluginName)} for help.
          ${
            choices.length > 1
              ? c.green(
                  `Use arrow keys to move between fields, and enter to finish`
                )
              : ``
          }
          `,
        choices,
      })
    }
  })
  return formPrompts
}
