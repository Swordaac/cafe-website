export function notFound(_req, res) {
    res.status(404).json({ error: 'Not Found' });
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof Error) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
}
//# sourceMappingURL=errorHandler.js.map