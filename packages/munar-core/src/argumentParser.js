import joi from 'joi'
import pify from 'pify'
import joinList from 'join-component'

const parser = joi.extend([
  {
    base: joi.string().replace(/^@/, ''),
    name: 'user',
    rules: []
  }
])

const validate = pify(joi.validate)

parser.parse = (input, schema) => {
  return validate(
    input,
    parser.array()
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
  )
}

export default parser
