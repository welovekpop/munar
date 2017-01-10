import { UserModel } from 'munar-core'

export default class BlacklistedMedia {
  static collection = 'media_blacklist'
  static timestamps = true

  static schema = {
    user: UserModel.ref({ index: true }),
    sourceType: String,
    sourceID: String,
    reason: String
  }
}
