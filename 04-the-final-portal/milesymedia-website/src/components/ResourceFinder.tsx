"use client";

// T4 unify-fix — Resource Finder. Single search input that filters
// across every Resource in the catalog (tools / blogs / videos /
// FAQs). Type chips below the input let the user narrow to one
// kind. Empty state and "no results" copy keep the page honest
// when the catalog grows past what one screen can show.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  RESOURCES,
  TYPE_META,
  searchResources,
  type Resource,
  type ResourceType,
} from "@/lib/resources/catalog";

type FilterValue = ResourceType | "all";

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "all",   label: "All" },
  { value: "tool",  label: TYPE_META.tool.plural },
  { value: "blog",  label: TYPE_META.blog.plural },
  { value: "video", label: TYPE_META.video.plural },
  { value: "faq",   label: TYPE_META.faq.plural },
];

export function ResourceFinder() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const results = useMemo(
    () => searchResources(query, filter),
    [query, filter],
  );

  const grouped = useMemo(() => {
    const out: Record<ResourceType, Resource[]> = {
      tool: [], blog: [], video: [], faq: [],
    };
    for (const r of results) out[r.type].push(r);
    return out;
  }, [results]);

  const totalLabel = `${results.length} result${results.length === 1 ? "" : "s"}`;

  return (
    <div className="mm-finder">
      <div className="mm-finder-bar">
        <span className="mm-finder-icon" aria-hidden>🔍</span>
        <input
          type="search"
          className="mm-finder-input"
          placeholder="Search tools, playbooks, videos, FAQs…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            type="button"
            className="mm-finder-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mm-finder-chips" role="tablist">
        {FILTERS.map(f => {
          const count = f.value === "all"
            ? RESOURCES.length
            : RESOURCES.filter(r => r.type === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              className={`mm-finder-chip${filter === f.value ? " is-on" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="mm-finder-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mm-finder-meta">
        <span>{totalLabel}{query ? ` for “${query}”` : ""}</span>
        {(query || filter !== "all") && (
          <button
            type="button"
            className="mm-finder-reset"
            onClick={() => { setQuery(""); setFilter("all"); }}
          >
            Reset
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mm-finder-empty">
          <p>
            Nothing matches <strong>“{query}”</strong> yet.
          </p>
          <p className="muted">
            The catalogue is growing fast — try a broader term, or{" "}
            <a href="mailto:hello@milesymedia.co?subject=Resource%20request">
              tell us what you were looking for
            </a>
            .
          </p>
        </div>
      ) : (
        (Object.keys(grouped) as ResourceType[])
          .filter(type => grouped[type].length > 0)
          .map(type => (
            <section key={type} className="mm-finder-group">
              <h3>
                <span aria-hidden>{TYPE_META[type].icon}</span>{" "}
                {TYPE_META[type].plural}{" "}
                <span className="mm-finder-group-count">
                  ({grouped[type].length})
                </span>
              </h3>
              <div className="mm-finder-grid">
                {grouped[type].map(r => (
                  <Link
                    key={r.id}
                    href={r.href}
                    className={`mm-finder-card${r.status === "live" ? " is-live" : ""}`}
                  >
                    <span className="mm-finder-card-status">
                      {r.status === "live" ? "Available" : "Coming soon"}
                    </span>
                    <span className="mm-finder-card-title">{r.title}</span>
                    <span className="mm-finder-card-excerpt">{r.excerpt}</span>
                    <span className="mm-finder-card-tags">
                      {r.tags.slice(0, 4).map(t => (
                        <span key={t} className="mm-finder-tag">
                          {t}
                        </span>
                      ))}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
