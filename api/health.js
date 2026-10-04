// GET /api/health -> tells the app that tag lookup is available on this deployment.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ ok: !!process.env.CR_API_KEY }));
};
