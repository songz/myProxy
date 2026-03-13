// React and ReactDOM are loaded from CDN as globals

const handleDelete = data => {
  if (confirm('Are you sure want to delete this domain?')) {
    fetch(`/api/mappings/${data.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ data }),
      headers: { 'Content-Type': 'application/json' }
    }).then(() => window.location.reload())
  }
}

const MappingGroup = ({ mappings }) => {
  const port = mappings[0].port
  const anyRunning = mappings.some(m => m.status === 'running')
  const iconColor = anyRunning
    ? 'rgba(50,255,50,0.5)'
    : 'rgba(255,50,50,0.5)'

  return (
    <li className="list-group-item">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: mappings.length > 1 ? '4px' : '0' }}>
        <i
          className="fa fa-circle mr-2"
          style={{ fontSize: '15px', color: iconColor }}
        ></i>
        <small className="form-text text-muted" style={{ margin: 0 }}>
          PORT: {port}
        </small>
      </div>
      {mappings.map(data => (
        <div
          key={data.id}
          style={{ display: 'flex', alignItems: 'center', marginLeft: '22px' }}
        >
          <a className="font-weight-bold mr-1" href={`https://${data.fullDomain}`}>
            {data.fullDomain}
          </a>
          <a
            className="fa fa-file-text-o ml-1"
            style={{ fontSize: '15px', color: 'rgba(255,50,50,0.5)' }}
            href={`/api/logs/error/${data.fullDomain}`}
          ></a>
          <a
            className="fa fa-file-text-o ml-1"
            style={{ fontSize: '15px', color: 'rgba(40,167,70,0.5)' }}
            href={`/api/logs/out/${data.fullDomain}`}
          ></a>
          <button
            className="btn btn-sm btn-outline-danger ml-2"
            type="button"
            onClick={() => handleDelete(data)}
          >
            Delete
          </button>
        </div>
      ))}
    </li>
  )
}

const App = () => {
  const [mappings, setMappings] = React.useState([])
  const [domains, setDomains] = React.useState([])
  const [selectedHost, setSelectedHost] = React.useState('')
  const [subDomain, setSubDomain] = React.useState('')
  const [port, setPort] = React.useState('')
  const [ip, setIp] = React.useState('')

  React.useEffect(() => {
    fetch('/api/mappings')
      .then(r => r.json())
      .then(data => {
        setMappings(
          data
            .reverse()
            .filter(e => e.domain && e.port && e.id && e.fullDomain && e.status)
        )
      })

    fetch('/api/availableDomains')
      .then(r => r.json())
      .then(data => {
        const sortedDomains = data.map(el => el.domain).sort()
        setDomains(sortedDomains)
        setSelectedHost(sortedDomains[0] || '')
      })
  }, [])

  const handleCreate = () => {
    fetch('/api/mappings', {
      method: 'POST',
      body: JSON.stringify({ domain: selectedHost, subDomain, port, ip }),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      if (res.status === 400) {
        return res.json().then(response => alert(response.message))
      }
      window.location.reload()
    })
    setPort('')
    setIp('')
    setSubDomain('')
  }

  return (
    <>
      <div className="d-flex justify-content-between">
        <div className="input-group mr-3 mb-2" style={{ minWidth: '250px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Subdomain"
            value={subDomain}
            onChange={e => setSubDomain(e.target.value)}
          />
          <div className="input-group-append">
            <button
              type="button"
              className="btn btn-outline-info dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {selectedHost}
            </button>
            <div className="dropdown-menu">
              {domains.map(domain => (
                <button
                  key={domain}
                  className="dropdown-item"
                  type="button"
                  onClick={() => setSelectedHost(domain)}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="input-group mr-3 mb-2">
          <div className="input-group-prepend">
            <span className="input-group-text">Port</span>
          </div>
          <input
            className="form-control"
            type="text"
            placeholder="Optional"
            value={port}
            onChange={e => setPort(e.target.value)}
          />
        </div>
        <div className="input-group mr-3 mb-2">
          <div className="input-group-prepend">
            <span className="input-group-text">IP</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Optional"
            value={ip}
            onChange={e => setIp(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-outline-primary mb-2"
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
      <small className="form-text text-muted">
        Port Number is not required. If you must, please make it &gt; 3001
      </small>
      <hr />
      <div className="row">
        <div className="col-12">
          <ul className="list-group">
            {Object.values(
              mappings.reduce((groups, mapping) => {
                const key = `${mapping.ip || ''}:${mapping.port}`
                if (!groups[key]) groups[key] = []
                groups[key].push(mapping)
                return groups
              }, {})
            ).map(group => (
              <MappingGroup key={`${group[0].ip || ''}:${group[0].port}`} mappings={group} />
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.render(<App />, rootEl)
}
