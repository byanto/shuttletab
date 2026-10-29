import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL: string;
  ADMIN_PIN?: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

interface SyncRequestBody {
  payload: Record<string, unknown>;
}

const COURT_ID = 'lapangan-01';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only handles route /api/sync in Worker.
    // All other React files (HTML/JS/CSS/PWA) served as static assets
    if (url.pathname === '/api/sync') {
      const sql = neon(env.DATABASE_URL);

      try {
        // 1. PUBLIC READ
        if (request.method === 'GET') {
          const rows = await sql`
            SELECT payload, updated_at 
            FROM shuttletab_state 
            WHERE court_id = ${COURT_ID}
          `;
          return Response.json(rows[0] || { payload: {}, updated_at: null });
        }

        // 2. ADMIN WRITE (When "Sinkronkan ke Neon" is clicked)
        if (request.method === 'PUT') {
          const clientPin = request.headers.get('x-admin-pin');
          const serverPin = env.ADMIN_PIN || '1234';

          if (!clientPin || clientPin !== serverPin) {
            return Response.json(
              { error: 'PIN Admin salah atau tidak valid!' },
              { status: 401 }
            );
          }

          const body = await request.json();
          const updated = await sql`
            UPDATE shuttletab_state
            SET payload = ${JSON.stringify(body.payload)}::jsonb,
                updated_at = NOW()
            WHERE court_id = ${COURT_ID}
            RETURNING updated_at
          `;

          return Response.json({
            success: true,
            updated_at: updated[0]?.updated_at
          });
        }

        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return Response.json({ error: err.message }, { status: 500 });
      }
    }

    // Fallback to React SPA for other routes
    return env.ASSETS.fetch(request);
  }
};