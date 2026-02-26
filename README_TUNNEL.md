Expose the app publicly without GitHub login

This project includes a convenience script that uses localtunnel to provide a public URL for port 3000.

Usage:

1. Start the dev server (in one terminal):

```bash
npm run dev
```

2. Start the public tunnel (in another terminal):

```bash
npm run tunnel
```

3. The command prints a public URL you can open in any browser. That URL does not require GitHub authentication and forwards traffic to your local server.

Notes:
- `npx localtunnel` may download a small binary the first time and requires outbound network access.
- If you need a custom subdomain, pass `--subdomain myname` to the command: `npx localtunnel --port 3000 --subdomain fitway-demo` (availability not guaranteed).
- For production or longer-lived tunnels, consider deploying to a public host or using an ngrok account (ngrok may require auth token).

Note: Basic-auth tunnel protection was available earlier but has been removed. The tunnel URL is publicly accessible without username/password.