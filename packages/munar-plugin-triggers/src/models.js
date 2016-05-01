import { UserModel } from 'munar-core'

export class TriggerModel {
  static timestamps = true

  static schema = {
    _id: String,
    response: String,
    user: UserModel.ref()
  }
}
