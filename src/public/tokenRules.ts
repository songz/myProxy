/* global helper */

type TokenRule = {
  id: string
  tokenId: string
  fullDomain: string
  path: string
}

const rulesList: HTMLElement = helper.getElement('.rulesList')
const tokenSelect = helper.getElement('.tokenSelect') as HTMLSelectElement
const domainInput = helper.getElement('.domainInput') as HTMLInputElement
const pathInput = helper.getElement('.pathInput') as HTMLInputElement
const submitBtn: HTMLElement = helper.getElement('.createRule')

class TokenRuleItem {
  constructor(data: TokenRule, tokenName: string) {
    const item = document.createElement('li')
    item.classList.add('list-group-item', 'd-flex', 'align-items-center')
    rulesList.appendChild(item)
    const pathSuffix = data.path !== '/' ? data.path : ''
    item.innerHTML = `
      <div style="width: 100%">
        <div style="color:#0066FF;">
          <span class="font-weight-bold">${data.fullDomain}${pathSuffix}</span>
          <small class="form-text text-muted ml-1">Token: ${tokenName}</small>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger deleteButton" type="button">Delete</button>
    `
    const delBtn = helper.getElement('.deleteButton', item)
    delBtn.onclick = (): void => {
      if (confirm('Delete this rule?')) {
        fetch(`/api/tokenRules/${data.id}`, { method: 'DELETE' }).then(() => {
          window.location.reload()
        })
      }
    }
  }
}

fetch('/api/accessTokens')
  .then(r => r.json())
  .then((data: AccessToken[]) => {
    tokenSelect.innerHTML = data
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join('')
  })

fetch('/api/tokenRules')
  .then(r => r.json())
  .then((rules: TokenRule[]) => {
    fetch('/api/accessTokens')
      .then(r => r.json())
      .then((tkns: AccessToken[]) => {
        rulesList.innerHTML = ''
        rules.forEach(rule => {
          const token = tkns.find(t => t.id === rule.tokenId)
          new TokenRuleItem(rule, token ? token.name : rule.tokenId)
        })
      })
  })

submitBtn.onclick = (): void => {
  const tokenId = tokenSelect.value
  const fullDomain = domainInput.value.trim()
  const path = pathInput.value.trim() || '/'
  if (!tokenId || !fullDomain) {
    alert('Token and domain are required')
    return
  }
  fetch('/api/tokenRules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, fullDomain, path })
  }).then(() => {
    window.location.reload()
  })
}
