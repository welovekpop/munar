import joi from '@hapi/joi'
import joinList from 'join-component'

const parser = joi.extend({
  type: 'user',
  base: joi.string().replace(/^@/, ''),
  rules: {}
})

parser.parse = (input, schema) => {
  return parser.array()
    .required()
    .ordered(schema)
    .items(parser.any()) // Accept excess arguments.
    .error((errors) => {
      const missing = errors.find((err) => err.type === 'array.includesRequiredKnowns')

      if (missing) {
        return new Error(`Missing parameters: ${joinList(missing.context.knownMisses)}`)
      }

      return errors
    })
    .validateAsync(input)
}

export default parser
