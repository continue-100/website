# Security Policy

## Reporting a vulnerability

Please report security problems privately. **Do not open a public GitHub issue for them.**

Email **security@prismio.org** with:

- a clear description of the problem,
- the steps to reproduce it,
- the affected site or page and its URL,
- any proof-of-concept code, logs, or screenshots,
- the impact you think it has, and how to reach you.

## Scope

This policy covers the sites in this repository:

- `prismio.org`
- `docs.prismio.org`
- `developers.prismio.org`
- `packages.prismio.org`
- `play.prismio.org`

and the code that builds them. Examples of in-scope problems: cross-site scripting, injection
through a page or API route, leaked secrets or personal data, a dependency vulnerability that
affects the built sites, and a way to publish content on the sites without authorization.

Out of scope:

- Problems in the Prismio compiler, runtime, or tooling. Report those through the
  [compiler repository's security policy](https://github.com/prismio-lang/prismio/blob/main/SECURITY.md).
- Findings that need physical access, social engineering, or a compromised device.
- Automated scanner output with no demonstrated impact.
- Denial-of-service through volumetric traffic.
- Vulnerabilities in third-party services, such as GitHub, the JetBrains Marketplace, or the
  hosting provider. Report those to the service.

## What to expect

Prismio is maintained by one person, so response times are best-effort. The aim is to:

- acknowledge a report within 3 days,
- give an initial assessment within 7 days,
- agree a disclosure timeline with you before anything is made public.

## Responsible disclosure

Please do not disclose a problem publicly until it has been verified, a fix or mitigation
exists, and a disclosure date has been agreed. Good-faith research that follows this policy
will not be met with legal action.

## Supported versions

Only the sites as currently deployed from `main` are supported.
