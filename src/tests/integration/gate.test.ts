import { startAppServer } from '../../server/server'
import { gateAdapter } from '../helpers/gateAdapter'

const TEST_PORT = process.env.PORT || 50607
const ADMIN = process.env.ADMIN || 'hjhj'

describe('/api/gate', () => {
  let server

  beforeAll(async () => {
    server = await startAppServer(TEST_PORT, ADMIN)
  })

  afterAll(() => {
    server.close()
  })

  it('should return empty blacklist initially', async () => {
    const res = await gateAdapter('/blacklist', 'GET')
    expect(res.status).toEqual(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should add an IP to the blacklist', async () => {
    const res = await gateAdapter('/blacklist', 'POST', { ip: '1.2.3.4' })
    expect(res.status).toEqual(200)
    const data = await res.json()
    expect(data.ip).toEqual('1.2.3.4')

    const listRes = await gateAdapter('/blacklist', 'GET')
    const list = await listRes.json()
    expect(list).toContain('1.2.3.4')

    await gateAdapter('/blacklist/1.2.3.4', 'DELETE')
  })

  it('should return 400 when ip is missing', async () => {
    const res = await gateAdapter('/blacklist', 'POST', {})
    expect(res.status).toEqual(400)
  })

  it('should remove an IP from the blacklist', async () => {
    await gateAdapter('/blacklist', 'POST', { ip: '5.6.7.8' })
    const deleteRes = await gateAdapter('/blacklist/5.6.7.8', 'DELETE')
    expect(deleteRes.status).toEqual(200)
    const data = await deleteRes.json()
    expect(data.ip).toEqual('5.6.7.8')

    const listRes = await gateAdapter('/blacklist', 'GET')
    const list = await listRes.json()
    expect(list).not.toContain('5.6.7.8')
  })

  it('should not duplicate IPs in the blacklist', async () => {
    await gateAdapter('/blacklist', 'POST', { ip: '9.9.9.9' })
    await gateAdapter('/blacklist', 'POST', { ip: '9.9.9.9' })

    const listRes = await gateAdapter('/blacklist', 'GET')
    const list = await listRes.json()
    const count = list.filter((ip: string) => ip === '9.9.9.9').length
    expect(count).toEqual(1)

    await gateAdapter('/blacklist/9.9.9.9', 'DELETE')
  })
})
