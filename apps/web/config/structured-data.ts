import {faqItems} from "@/config/faq";
import {siteConfig} from "@/config/site";

export const PRISMIO_ORG_ID =
  "https://prismio.org/#organization";

export const PRISMIO_WEBSITE_ID =
  "https://prismio.org/#website";

// Evaluated at build time; the site is statically rendered, so this is the deploy date.
const BUILD_DATE = new Date().toISOString();

export const SAKSHAM_PERSON_ID =
  "https://prismio.org/team/saksham-jaiswal/#person";

export const prismioStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": PRISMIO_ORG_ID,
      "name": "Prismio",
      "url": "https://prismio.org/",
      "description":
        "Prismio is an open-source systems programming language that compiles to native machine code through LLVM.",
      "founder": {
        "@id": SAKSHAM_PERSON_ID
      },
      "logo": "https://prismio.org/icons/prismio.png",
      "sameAs": [
        siteConfig.github,
        siteConfig.githubOrg,
        siteConfig.discord
      ]
    },
    {
      "@type": "WebSite",
      "@id": PRISMIO_WEBSITE_ID,
      "name": "Prismio",
      "url": "https://prismio.org/",
      "description": siteConfig.description,
      "inLanguage": "en",
      "publisher": {
        "@id": PRISMIO_ORG_ID
      },
      "dateModified": BUILD_DATE
    },
    {
      "@type": "Person",
      "@id": SAKSHAM_PERSON_ID,
      "name": "Saksham Jaiswal",
      "url":
        "https://prismio.org/team/saksham-jaiswal/",
      "jobTitle": "Creator & Lead Developer",
      "worksFor": {
        "@id": PRISMIO_ORG_ID
      },
      "sameAs": [
        "https://github.com/saksham1319",
        "https://www.linkedin.com/in/saksham6975/"
      ]
    }
  ]
};

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(({question, answer}) => ({
    "@type": "Question",
    "name": question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": answer
    }
  }))
};
