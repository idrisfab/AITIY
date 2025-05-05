# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our codebase seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email us at security@attiy.com** with details of the vulnerability
3. Include the following information in your report:
   - Type of vulnerability
   - Full path to source file(s) related to the issue
   - Steps to reproduce
   - Potential impact
   - If applicable, any mitigations or potential fixes

We will acknowledge your email within 48 hours and provide a detailed response about the next steps in handling your report. We may ask for additional information or guidance.

## Security Measures Implemented

### Input Validation & Sanitization
- All user input is validated using Zod schema validation
- Input sanitization middleware prevents XSS attacks
- Markdown and HTML content is sanitized before storage and rendering

### Authentication & Authorization
- JWT tokens with appropriate expiry
- Secure password hashing with bcrypt
- Fine-grained access control system for all resources
- Role-based permissions for team resources

### Protection Against Common Attacks
- CSRF protection using anti-CSRF tokens
- Rate limiting to prevent brute force attacks
- Secure HTTP headers set for all responses
- Database query parameterization to prevent SQL injection

### Data Security
- API keys are encrypted at rest
- Sensitive data is not logged
- Personal data is handled according to privacy policy

### Dependency Management
- Regular dependency updates
- Automated security scanning with GitHub Actions
- NPM audit and Snyk scanning for vulnerable dependencies

## Development Practices

### Security Testing
- Run `npm run security:audit` locally before committing changes
- Automated security scanning in CI/CD pipeline
- Manual code reviews with security focus

### Dependency Updates
- Dependencies are regularly updated
- Security-critical updates are applied promptly
- Major version upgrades are tested thoroughly before deployment

## Responsible Disclosure

We appreciate the work of security researchers who help keep our project secure. We are committed to working with the security community to verify and respond to security issues.

After reporting a vulnerability, we will:

1. Confirm receipt of your report
2. Verify the vulnerability and determine its impact
3. Release a patch and apply it to production
4. Publicly disclose the vulnerability after it has been addressed

We do not offer a bug bounty program at this time but will acknowledge security researchers who report valid vulnerabilities in our security changelog. 