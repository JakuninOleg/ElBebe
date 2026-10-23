export async function officeApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/_emdash/api/plugins/el-bebe-office${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-EmDash-Request': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok || result.success === false) {
    if (response.status === 401 || response.status === 403) throw new Error('Для этого раздела войдите под учётной записью администратора садика.');
    throw new Error(result.error?.message || 'Не удалось выполнить действие. Попробуйте ещё раз.');
  }
  return result.data as T;
}
