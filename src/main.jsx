import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import { seedIfNeeded } from "./services/ledgerService";
import { USE_DEMO_LEDGER } from "./config/contract";

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
