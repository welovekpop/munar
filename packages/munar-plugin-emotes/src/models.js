import { UserModel } from 'munar-core'

export class EmoteModel {
  static timestamps = true

  static schema = {
    _id: String,
    url: String,
    addedBy: UserModel.ref()
  }
}
