class HireProofApi {
  constructor() {
    this.name = 'hireProofApi'
    this.displayName = 'HireProof API'
    this.documentationUrl = 'https://hireproof.tech/docs/authentication'
    this.properties = [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: true,
        description: 'Use an account-issued or private self-hosted HireProof API key. Demo fixtures still require an API key.',
      },
      {
        displayName: 'Base URL',
        name: 'baseUrl',
        type: 'string',
        default: 'https://hireproof.tech',
        required: true,
        description: 'HireProof deployment URL without a trailing slash.',
      },
    ]
    this.authenticate = {
      type: 'generic',
      properties: {
        headers: {
          'x-api-key': '={{$credentials.apiKey}}',
        },
      },
    }
    this.test = {
      request: {
        baseURL: '={{$credentials.baseUrl}}',
        url: '/api/health',
        method: 'GET',
      },
    }
  }
}

module.exports = {
  HireProofApi,
}
