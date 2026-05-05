import type { PluginPageProps } from "../lib/aquaPluginTypes";
import { containerFor } from "../server/foundationAdapter";

export default async function FormsListPage(props: PluginPageProps) {
  const c = containerFor({ agencyId: props.agencyId, clientId: props.clientId, storage: props.storage, install: props.install });
  const forms = await c.forms.list();
  return (
    <section className="forms-list">
      <header><h1>Forms</h1><p>{forms.length} total ({forms.filter(f => f.status === "published").length} published).</p></header>
      <ul className="forms-grid">
        {forms.map(f => (
          <li key={f.id}>
            <article>
              <header>
                <h3>{f.name}</h3>
                <span className={`forms-pill forms-pill-${f.status}`}>{f.status}</span>
              </header>
              {f.description && <p className="forms-meta">{f.description}</p>}
              <p className="forms-meta">{f.fields.length} field{f.fields.length === 1 ? "" : "s"} · {f.submissionCount} submission{f.submissionCount === 1 ? "" : "s"}</p>
              <p className="forms-meta">Submit action: {f.submitAction.kind}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
