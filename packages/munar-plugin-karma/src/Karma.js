import { UserModel } from 'munar-core'

export default class Karma {
  static timestamps = true

  static schema = {
    target: UserModel.ref({ index: true }),
    giver: UserModel.ref({ index: true }),
    amount: { type: Number, default: 1 },
    reason: String
  }
}
