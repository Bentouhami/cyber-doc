import "dotenv/config";

import pg from "pg";

const ROW_COUNT = 250_000;
const SAMPLE_COUNT = 7;

type ExplainRoot = {
  Plan: ExplainNode;
  "Execution Time": number;
};

type ExplainNode = {
  "Node Type": string;
  "Index Name"?: string;
  Plans?: ExplainNode[];
};

type Scenario = {
  name: string;
  sql: string;
};

const scenarios: Scenario[] = [
  {
    name: "recent-page",
    sql: `SELECT id FROM activity_logs_benchmark
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "date-range",
    sql: `SELECT id FROM activity_logs_benchmark
      WHERE created_at >= now() - interval '6 hours'
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "user-filter",
    sql: `SELECT id FROM activity_logs_benchmark
      WHERE user_id_fk = 'user-42'
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "activity-type-filter",
    sql: `SELECT id FROM activity_logs_benchmark
      WHERE activity_type_id_fk = 7
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "resource-type-filter",
    sql: `SELECT id FROM activity_logs_benchmark
      WHERE resource_type = 'document'
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "deep-offset-page",
    sql: `SELECT id FROM activity_logs_benchmark
      ORDER BY created_at DESC, id DESC OFFSET 100000 LIMIT 100`,
  },
  {
    name: "contains-search",
    sql: `SELECT id FROM activity_logs_benchmark
      WHERE resource_type ILIKE '%99999%' OR resource_id ILIKE '%99999%'
      ORDER BY created_at DESC, id DESC LIMIT 100`,
  },
  {
    name: "count-all",
    sql: "SELECT count(*) FROM activity_logs_benchmark",
  },
  {
    name: "count-date-range",
    sql: `SELECT count(*) FROM activity_logs_benchmark
      WHERE created_at >= now() - interval '6 hours'`,
  },
  {
    name: "count-user-filter",
    sql: `SELECT count(*) FROM activity_logs_benchmark
      WHERE user_id_fk = 'user-42'`,
  },
  {
    name: "count-activity-type-filter",
    sql: `SELECT count(*) FROM activity_logs_benchmark
      WHERE activity_type_id_fk = 7`,
  },
  {
    name: "count-resource-type-filter",
    sql: `SELECT count(*) FROM activity_logs_benchmark
      WHERE resource_type = 'document'`,
  },
];

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function collectPlanEvidence(node: ExplainNode, evidence = new Set<string>()) {
  evidence.add(node["Index Name"] ?? node["Node Type"]);
  for (const child of node.Plans ?? []) {
    collectPlanEvidence(child, evidence);
  }
  return [...evidence].sort();
}

async function explain(client: pg.Client, sql: string) {
  const result = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
  const rawPlan = result.rows[0]["QUERY PLAN"] as ExplainRoot[] | string;
  const plan = (typeof rawPlan === "string" ? JSON.parse(rawPlan) : rawPlan)[0];
  return {
    executionMs: plan["Execution Time"],
    evidence: collectPlanEvidence(plan.Plan),
  };
}

async function measure(client: pg.Client) {
  const results = [];
  for (const scenario of scenarios) {
    await explain(client, scenario.sql);
    const samples = [];
    let evidence: string[] = [];
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const measurement = await explain(client, scenario.sql);
      samples.push(measurement.executionMs);
      evidence = measurement.evidence;
    }
    results.push({ name: scenario.name, medianMs: median(samples), evidence });
  }
  return results;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`CREATE TEMP TABLE activity_logs_benchmark (
      id text PRIMARY KEY,
      user_id_fk text NOT NULL,
      activity_type_id_fk integer NOT NULL,
      resource_type text,
      resource_id text,
      created_at timestamp(3) NOT NULL
    )`);
    await client.query(`INSERT INTO activity_logs_benchmark (
      id, user_id_fk, activity_type_id_fk, resource_type, resource_id, created_at
    )
    SELECT
      lpad(value::text, 16, '0'),
      'user-' || (value % 1000),
      1 + (value % 20),
      (ARRAY['document', 'template', 'user', 'persona'])[1 + (value % 4)],
      'resource-' || value,
      now() - ((${ROW_COUNT} - value) * interval '1 second')
    FROM generate_series(1, ${ROW_COUNT}) AS value`);
    await client.query("ANALYZE activity_logs_benchmark");

    const before = await measure(client);

    await client.query(`CREATE INDEX activity_logs_benchmark_created_id_idx
      ON activity_logs_benchmark (created_at DESC, id DESC)`);
    await client.query(`CREATE INDEX activity_logs_benchmark_user_created_id_idx
      ON activity_logs_benchmark (user_id_fk, created_at DESC, id DESC)`);
    await client.query(`CREATE INDEX activity_logs_benchmark_type_created_id_idx
      ON activity_logs_benchmark (activity_type_id_fk, created_at DESC, id DESC)`);
    await client.query(`CREATE INDEX activity_logs_benchmark_resource_created_id_idx
      ON activity_logs_benchmark (resource_type, created_at DESC, id DESC)`);
    await client.query("ANALYZE activity_logs_benchmark");

    const after = await measure(client);
    const indexSizes = await client.query(`SELECT indexrelid::regclass::text AS name,
      pg_relation_size(indexrelid)::int AS bytes
      FROM pg_index
      WHERE indrelid = 'activity_logs_benchmark'::regclass
      ORDER BY name`);

    console.log(JSON.stringify({ rowCount: ROW_COUNT, sampleCount: SAMPLE_COUNT, before, after, indexSizes: indexSizes.rows }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Activity-log benchmark failed");
  process.exitCode = 1;
});
