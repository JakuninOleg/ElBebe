const response = await fetch(`http://127.0.0.1:${process.env.PORT || 4321}/healthz`, { signal: AbortSignal.timeout(4000) });
if (!response.ok || (await response.json()).ok !== true) process.exitCode = 1;
