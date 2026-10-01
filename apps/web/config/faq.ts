export type FaqItem = { question: string; answer: string };

// Condensed from https://docs.prismio.org/faq. Keep answers in sync with that page.
export const faqItems: FaqItem[] = [
  {
    question: "What is Prismio?",
    answer:
      "Prismio is a self-hosted, statically typed systems programming language. It compiles to native machine code through LLVM, uses the Adaptive Inference Framework (AIF) to decide and explain where values live in memory, and calls C directly without wrapper glue.",
  },
  {
    question: "Is Prismio production-ready?",
    answer:
      "No. Version 0.1 is active compiler development. Implemented features are tested, but syntax, runtime contracts, AIF policy and ABI details may change. Use it for compiler and language development and controlled experiments.",
  },
  {
    question: "Is the Prismio compiler written in Prismio?",
    answer:
      "Yes. A committed LLVM IR seed breaks the initial bootstrapping cycle, and later generations compile the Prismio compiler source. The repository checks multiple generations and fixed points.",
  },
  {
    question: "Does Prismio use garbage collection?",
    answer:
      "There is no single implicit tracing-GC model. The compiler enforces moves and borrows for move-only values, while the experimental AIF classifies allocations across stack, region, unique, reference-counted and cycle-aware tiers.",
  },
  {
    question: "How do I install Prismio?",
    answer:
      "Run curl -fsSL https://prismio.org/install.sh | sh, or build from source at github.com/prismio-lang/prismio. The install page lists supported platforms.",
  },
  {
    question: "Does Prismio interoperate with C?",
    answer:
      "Yes. Prismio code can call C functions and pass C structs directly, and a build.ums manifest can compile your own C sources and link libraries into a program.",
  },
];
