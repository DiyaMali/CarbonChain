import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import { seedIfNeeded } from "./services/ledgerService";
import { USE_DEMO_LEDGER } from "./config/contract";

// Global styling observer: any "Anti-Gravity" phrase in headings (H1, H2, H3) rendered in italicized Cormorant Garamond
function styleAntiGravityInHeadings() {
  if (typeof document === "undefined") return;
  const headings = document.querySelectorAll("h1, h2, h3");
  headings.forEach((heading) => {
    heading.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.includes("Anti-Gravity")) {
        const span = document.createElement("span");
        span.innerHTML = node.nodeValue.replace(
          /(Anti-Gravity)/g,
          '<span class="anti-gravity">$1</span>'
        );
        node.parentNode.replaceChild(span, node);
      }
    });
  });
}

if (typeof window !== "undefined") {
  const observer = new MutationObserver(() => styleAntiGravityInHeadings());
  window.addEventListener("DOMContentLoaded", () => {
    styleAntiGravityInHeadings();
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

async function bootstrap() {
  if (USE_DEMO_LEDGER) {
    await seedIfNeeded();
  }
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();

