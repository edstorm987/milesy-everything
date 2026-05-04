import type { PluginPageProps } from "../lib/aquaPluginTypes";
import { containerFor } from "../server/foundationAdapter";

export default async function CampaignsPage(props: PluginPageProps) {
  const c = containerFor({ agencyId: props.agencyId, storage: props.storage, install: props.install });
  const campaigns = await c.campaigns.list();
  return (
    <section className="marketing-campaigns">
      <header><h1>Campaigns</h1><p>{campaigns.length} total.</p></header>
      <ul className="marketing-list">
        {campaigns.map(cmp => (
          <li key={cmp.id}>
            <article>
              <header>
                <h3>{cmp.name}</h3>
                <span className={`marketing-pill marketing-pill-${cmp.status}`}>{cmp.status}</span>
              </header>
              <p className="marketing-meta">{cmp.channel}</p>
              {cmp.budgetCents !== undefined && (
                <p className="marketing-meta">Budget: {(cmp.budgetCents / 100).toFixed(2)} {cmp.currency}</p>
              )}
              {cmp.goalKpi && cmp.goalTarget !== undefined && (
                <p className="marketing-meta">
                  Goal: {cmp.goalKpi} ≥ {cmp.goalTarget}
                  {cmp.resultActual !== undefined && ` · current ${cmp.resultActual}`}
                </p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
