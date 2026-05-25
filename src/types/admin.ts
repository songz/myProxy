import { Mapping, Domain, AccessToken, TokenRule } from './general'

type ServiceKey = {
  id?: string
  key: string
  value: string
  service: string
}

type DB = {
  serviceKeys: ServiceKey[]
  mappings: Mapping[]
  availableDomains: Domain[]
  accessTokens: AccessToken[]
  tokenRules: TokenRule[]
}

export { ServiceKey, DB }
