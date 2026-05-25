import { Mapping, Domain, AccessToken } from './general'

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
  blacklistedIPs: string[]
}

export { ServiceKey, DB }
