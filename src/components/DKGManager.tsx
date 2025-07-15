import { useState } from 'react';
import { createKnowledgeAsset, getKnowledgeAsset, queryKnowledgeGraph } from '../services/dkgService';

const DKGManager = ({ content }: { content: any }) => {
  const [ual, setUal] = useState('');
  const [result, setResult] = useState<any>(null);
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example asset content (should be linked to a DID in your real workflow)
//   const exampleContent = {
//     '@context': 'https://schema.org',
//     '@type': 'Dataset',
//     name: 'Cultural Heritage Dataset',
//     description: 'A dataset representing cultural heritage objects',
//     creator: 'HeliXID User',
//     provenance: 'Created via HeliXID DKGManager',
//     did: ual // Optionally link to a DID
//   };

  // Create a knowledge asset and fetch its provenance graph
  const handleCreate = async () => {
    setLoading(true); setError(null); setResult(null); setProvenance(null);
    try {
      const res = await createKnowledgeAsset(content, { epochsNum: 6 });
      setUal(res.UAL);
      setResult(res);
      // Fetch provenance graph (assertion) after creation
      const asset = await getKnowledgeAsset(res.UAL);
      setProvenance(asset.assertion);
    } catch (err: any) {
      setError(err.message || 'Error creating asset');
    } finally {
      setLoading(false);
    }
  };

  // Fetch provenance graph for an existing UAL
  const handleProvenance = async () => {
    setLoading(true); setError(null); setProvenance(null);
    try {
      const asset = await getKnowledgeAsset(ual);
      setProvenance(asset.assertion);
    } catch (err: any) {
      setError(err.message || 'Error fetching provenance');
    } finally {
      setLoading(false);
    }
  };

  // Example SPARQL query for cultural heritage (customize as needed)
  const handleCulturalHeritageQuery = async () => {
    setLoading(true); setError(null); setResult(null);
    const sparql = `
      PREFIX schema: <http://schema.org/>
      SELECT ?dataset ?name ?description WHERE {
        ?dataset a schema:Dataset ;
                schema:name ?name ;
                schema:description ?description .
        FILTER(CONTAINS(LCASE(?description), "heritage"))
      }
    `;
    try {
      const res = await queryKnowledgeGraph(sparql);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Error querying cultural heritage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#f9f9f9', borderRadius: 8 }}>
      <h2>OriginTrail DKG Manager</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleCreate} disabled={loading} style={{ marginRight: 8 }}>
          Create Knowledge Asset & Trace Provenance
        </button>
        <input
          value={ual}
          onChange={e => setUal(e.target.value)}
          placeholder="UAL (Unique Asset Locator)"
          style={{ width: 320, marginRight: 8 }}
        />
        <button onClick={handleProvenance} disabled={loading || !ual} style={{ marginRight: 8 }}>
          Trace Provenance
        </button>
        <button onClick={handleCulturalHeritageQuery} disabled={loading}>
          Query Cultural Heritage
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <h4>Result:</h4>
          <pre style={{ background: '#eee', padding: 12, borderRadius: 4 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {provenance && (
        <div style={{ marginTop: 16 }}>
          <h4>Provenance Graph (Assertion):</h4>
          <pre style={{ background: '#eee', padding: 12, borderRadius: 4 }}>{JSON.stringify(provenance, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DKGManager;