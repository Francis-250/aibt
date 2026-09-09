import prisma from "@/lib/prisma";
import { createModel } from "@/actions/admin";
import { PageHeader } from "@/components/dashboard-ui";
export default async function Page() {
  const models = await prisma.mLModel.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader
        eyebrow="AI governance"
        title="Prediction models"
        description="Track model versions, algorithms, lifecycle state, features, and validation metrics."
      />
      <form
        action={createModel}
        className="mb-8 flex flex-wrap gap-3 rounded border bg-white p-5"
      >
        <input
          required
          name="name"
          placeholder="Model name"
          className="rounded border px-3 py-2"
        />
        <input
          required
          name="version"
          placeholder="Version"
          className="rounded border px-3 py-2"
        />
        <input
          required
          name="algorithm"
          placeholder="Algorithm"
          className="rounded border px-3 py-2"
        />
        <button className="rounded bg-slate-900 px-4 py-2 font-bold text-white">
          Register active model
        </button>
      </form>
      <div className="grid gap-4">
        {models.map((m) => (
          <article key={m.id} className="rounded border bg-white p-6">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">
                  {m.name} <span className="text-slate-400">v{m.version}</span>
                </h2>
                <p className="mt-1 text-sm text-slate-500">{m.algorithm}</p>
              </div>
              <span className="rounded bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                {m.status}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Features:{" "}
              {Array.isArray(m.featureNames)
                ? m.featureNames.join(", ")
                : "Configured"}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
