export const DEMO_FIXTURES = {
  highRisk: {
    verdict: 'high-risk' as const,
    riskScore: 92,
    confidence: 'Very High',
    summary: 'This opportunity has multiple red flags suggesting a potential scam. The combination of unrealistic salary, no interview process, Telegram-only contact, and inability to verify the company strongly indicate this is fraudulent.',
    extractedClaims: {
      company: 'Unknown / Not Verifiable',
      role: 'Frontend Intern',
      salary: 'PHP 80,000 per week',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'Direct message only',
    },
    redFlags: [
      'Unrealistically high salary for an internship role (₱4.1M/year equivalent)',
      'No formal interview process mentioned',
      'Telegram-only contact method (bypasses official channels)',
      'Company name not verifiable via web search',
      'No application through standard job board',
      'Pressure to contact immediately via messaging app',
      'Generic messaging suggests mass recruitment attempt',
    ],
    greenFlags: [],
    evidence: [
      {
        source: 'Job Search Analysis',
        snippet: 'Average intern salary for Southeast Asia is $500-$1,500/month, not $80,000/week',
        type: 'Market Data',
        url: undefined,
      },
      {
        source: 'Company Verification',
        snippet: 'No registered company found with provided name in business registries',
        type: 'Company Check',
        url: undefined,
      },
      {
        source: 'Scam Report Database',
        snippet: 'Telegram recruitment scams commonly promise high pay with minimal work',
        type: 'Reputation',
        url: undefined,
      },
    ],
    alternatives: [
      {
        title: 'Frontend Engineer - Entry Level',
        company: 'TechCorp PH',
        salary: '₱50,000 - ₱80,000/month',
      },
      {
        title: 'UI/UX Developer Intern',
        company: 'Digital Solutions Inc',
        salary: '₱25,000 - ₱35,000/month',
      },
      {
        title: 'Junior Web Developer',
        company: 'Acme Tech Solutions',
        salary: '₱60,000 - ₱100,000/month',
      },
    ],
    nextSteps: [
      'Do not respond to the Telegram message or provide any personal information',
      'Report the account to Telegram for suspected fraud',
      'Search for the company name on LinkedIn, Google, and business registries',
      'Browse legitimate job boards like LinkedIn Jobs, indeed.com, or local platforms',
      'Be cautious of offers that promise high pay with minimal qualifications',
    ],
  },
  caution: {
    verdict: 'caution' as const,
    riskScore: 55,
    confidence: 'Medium',
    summary: 'This opportunity has some positive signs but lacks clarity in key areas. The company appears legitimate, but incomplete information about the role, vague requirements, and limited company details warrant further investigation before applying.',
    extractedClaims: {
      company: 'TechStart Solutions',
      role: 'Software Engineer',
      salary: 'Competitive (not specified)',
      location: 'Remote / Hybrid',
      contactMethod: 'Email application',
      applicationPath: 'Online form',
    },
    redFlags: [
      'Salary not specified ("competitive package")',
      'Vague job responsibilities listed',
      'Company description is minimal',
      'Limited information about team structure',
      'No clear career progression mentioned',
      'Application process not transparent',
    ],
    greenFlags: [
      'Company has official website and LinkedIn presence',
      'Multiple job openings suggest stable hiring',
      'Uses standard application channels',
      'Offers benefits package',
      'Remote work option available',
    ],
    evidence: [
      {
        source: 'Company Website',
        snippet: 'Company established 2019, 50-100 employees based in Manila',
        type: 'Company Info',
        url: 'https://techstartsolutions.ph',
      },
      {
        source: 'LinkedIn Search',
        snippet: 'TechStart Solutions has 45 employees on LinkedIn with positive reviews',
        type: 'Social Proof',
        url: 'https://linkedin.com/company/techstart-solutions',
      },
      {
        source: 'Industry Review',
        snippet: 'Mixed reviews on Glassdoor, average rating 3.5/5 stars',
        type: 'Company Reviews',
        url: undefined,
      },
    ],
    alternatives: [
      {
        title: 'Senior Software Engineer',
        company: 'GlobalTech Inc',
        salary: '₱150,000 - ₱200,000/month',
      },
      {
        title: 'Full Stack Developer',
        company: 'Digital Innovation Labs',
        salary: '₱120,000 - ₱160,000/month',
      },
    ],
    nextSteps: [
      'Research the company on Glassdoor and Indeed to read employee reviews',
      'Connect with current/former employees on LinkedIn',
      'Ask specific questions about salary range and role expectations',
      'Request a call with the hiring manager to clarify ambiguities',
      'Compare this offer with similar roles on job boards before applying',
    ],
  },
  safe: {
    verdict: 'safe' as const,
    riskScore: 18,
    confidence: 'High',
    summary: 'This opportunity appears legitimate. The company is well-established with a strong reputation, clear job requirements, transparent salary information, and professional application process. Standard due diligence recommended.',
    extractedClaims: {
      company: 'Microsoft Corporation',
      role: 'Senior Software Engineer',
      salary: '$200,000 - $250,000 + benefits',
      location: 'Seattle, WA (Hybrid)',
      contactMethod: 'LinkedIn Recruiter',
      applicationPath: 'LinkedIn Application Portal',
    },
    redFlags: [],
    greenFlags: [
      'Major established technology company (Fortune 500)',
      'Clear salary transparency',
      'Specific role requirements and responsibilities',
      'Professional recruiter outreach',
      'Uses official company channels',
      'Comprehensive benefits package listed',
      'Multiple offices and team locations',
      'Strong employer reputation',
    ],
    evidence: [
      {
        source: 'Company Profile',
        snippet: 'Microsoft, founded 1975, publicly traded, 220,000+ employees worldwide',
        type: 'Company Info',
        url: 'https://microsoft.com/careers',
      },
      {
        source: 'Glassdoor Reviews',
        snippet: 'Microsoft rated 4.5/5 stars, strong engineering culture, competitive pay',
        type: 'Company Reviews',
        url: 'https://glassdoor.com/microsoft',
      },
      {
        source: 'LinkedIn Recruiter Profile',
        snippet: 'Sarah Chen, Verified Microsoft Recruiter, 500+ connections, 3+ years recruiting',
        type: 'Recruiter Verification',
        url: 'https://linkedin.com/in/sarah-chen-microsoft',
      },
    ],
    alternatives: [
      {
        title: 'Principal Engineer',
        company: 'Google',
        salary: '$220,000 - $280,000 + stock',
      },
      {
        title: 'Engineering Manager',
        company: 'Amazon Web Services',
        salary: '$210,000 - $260,000 + benefits',
      },
    ],
    nextSteps: [
      'Review the complete job description on the official careers portal',
      'Research the specific team and manager on LinkedIn',
      'Prepare technical interview materials',
      'Connect with current Microsoft employees for insights',
      'Prepare questions about team, projects, and growth opportunities',
    ],
  },
}

export function getFixtureByVerdict(verdict: 'safe' | 'caution' | 'high-risk') {
  switch (verdict) {
    case 'safe':
      return DEMO_FIXTURES.safe
    case 'caution':
      return DEMO_FIXTURES.caution
    case 'high-risk':
      return DEMO_FIXTURES.highRisk
  }
}

export function getAllFixtures() {
  return [DEMO_FIXTURES.highRisk, DEMO_FIXTURES.caution, DEMO_FIXTURES.safe]
}
