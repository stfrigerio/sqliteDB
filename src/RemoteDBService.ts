export class RemoteDBService {
	constructor(private apiBaseUrl: string) {}

	async getQuery<T extends Record<string, any>>(sql: string, params: any[] = []): Promise<T[]> {
		const res = await fetch(`${this.apiBaseUrl}/query`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sql, params }),
		});
		if (!res.ok) throw new Error(await res.text());
		return await res.json();
	}

	async runQuery(sql: string, params: any[] = []): Promise<void> {
		const res = await fetch(`${this.apiBaseUrl}/execute`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sql, params }),
		});
		if (!res.ok) throw new Error(await res.text());
	}
}
