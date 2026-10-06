import React from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

export default function StubPage({ title, phase, description }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="w-12 h-12 rounded border border-forest/30 bg-cream text-forest flex items-center justify-center mx-auto mb-4">
        <Clock className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-semibold text-charcoal mb-2">{title}</h1>
      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 mb-4">
        Scheduled for {phase}
      </span>
      <p className="text-sm text-charcoal-muted max-w-md mx-auto mb-8">
        {description || "This feature is part of the upcoming implementation phase according to the build prompt plan."}
      </p>
      <Link to="/" className="btn-outline">
        &larr; Back to Landing Page
      </Link>
    </div>
  );
}
