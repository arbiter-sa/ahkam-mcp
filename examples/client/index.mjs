// Minimal Ahkam MCP client: lists the tools, searches, then opens the first ruling.
// The key is read from the environment and never written to a file:
//   AHKAM_MCP_KEY="<consumer>.k1.<secret>" npm start
// For a sandbox key, also set AHKAM_MCP_URL=https://mcp.ahkam.arbiter.sa/sandbox/mcp
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const key = process.env.AHKAM_MCP_KEY;
if (!key) {
  console.error('Set AHKAM_MCP_KEY to your Ahkam key (<consumer>.<k1|k2>.<secret>).');
  process.exit(1);
}
const url = new URL(process.env.AHKAM_MCP_URL || 'https://mcp.ahkam.arbiter.sa/mcp');

const transport = new StreamableHTTPClientTransport(url, {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});
const client = new Client({ name: 'ahkam-example', version: '1.0.0' });
await client.connect(transport);

try {
  const { tools } = await client.listTools();
  console.log('Tools:', tools.map((t) => t.name).join(', '));

  const search = await client.callTool({
    name: 'search_rulings',
    arguments: { query: 'end of service benefits resignation', filters: { yearFrom: 1440 }, limit: 5 },
  });
  if (search.isError) throw new Error(search.content?.[0]?.text || 'search_rulings failed');

  const items = search.structuredContent?.items ?? [];
  for (const it of items) console.log(`- ${it.title}\n  ${it.url}`);
  console.log(search.structuredContent?.disclaimer?.en ?? '');

  if (items[0]) {
    const ruling = await client.callTool({ name: 'get_ruling', arguments: { id: items[0].id } });
    if (ruling.isError) throw new Error(ruling.content?.[0]?.text || 'get_ruling failed');
    const r = ruling.structuredContent?.item;
    console.log('\nFirst ruling:', r?.title, r?.url, r?.sourceName ? `(${r.sourceName})` : '');
  }
} finally {
  await client.close();
}
