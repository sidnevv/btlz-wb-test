import axios from 'axios';
import { WBApiResponse, WBWarehouseTariff, TariffRecord } from '#types/index.js';
import knex from '#postgres/knex.js';

export class WBService {
    private readonly apiUrl = 'https://common-api.wildberries.ru/api/v1/tariffs/box';
    private readonly apiToken: string;

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    async fetchTariffs(date?: string): Promise<WBWarehouseTariff[]> {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];

            console.log(`Fetching tariffs for date: ${targetDate}`);
            console.log(`Using WB token: ${this.apiToken.substring(0, 10)}...`);

            const response = await axios.get<WBApiResponse>(this.apiUrl, {
                params: {
                    date: targetDate
                },
                headers: {
                    'Authorization': this.apiToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000,
                validateStatus: (status) => status < 500
            });

            console.log(`API Response status: ${response.status}`);

            if (response.status === 401) {
                throw new Error('Invalid WB API token: 401 Unauthorized');
            }

            if (response.status === 403) {
                throw new Error('Access forbidden: 403 Forbidden - check token permissions');
            }

            if (response.status === 429) {
                throw new Error('Rate limit exceeded: 429 Too Many Requests');
            }

            if (!response.data?.response?.data?.warehouseList) {
                throw new Error('Invalid API response structure');
            }

            const tariffs = response.data.response.data.warehouseList;
            console.log(`Successfully fetched ${tariffs.length} tariffs`);

            if (tariffs.length > 0) {
                console.log(`Sample: ${tariffs[0].warehouseName} - ${tariffs[0].geoName}`);
            }

            return tariffs;

        } catch (error: any) {
            console.error('Error fetching WB tariffs:', error.message);
            if (error.response) {
                console.error('API Error details:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            throw error;
        }
    }

    private parseNumber(value: string): number {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }

    async saveTariffs(tariffs: WBWarehouseTariff[], targetDate?: string): Promise<void> {
        const date = targetDate || new Date().toISOString().split('T')[0];

        try {
            await knex.transaction(async (trx) => {
                await trx('wb_tariffs')
                    .where('date', date)
                    .del();

                const records: Omit<TariffRecord, 'id' | 'created_at' | 'updated_at'>[] =
                    tariffs.map(tariff => ({
                        date: date,
                        warehouse_name: tariff.warehouseName || '',
                        geo_name: tariff.geoName || '',
                        box_delivery_base: this.parseNumber(tariff.boxDeliveryBase),
                        box_delivery_coef_expr: this.parseNumber(tariff.boxDeliveryCoefExpr),
                        box_delivery_liter: this.parseNumber(tariff.boxDeliveryLiter),
                        box_delivery_marketplace_base: this.parseNumber(tariff.boxDeliveryMarketplaceBase),
                        box_delivery_marketplace_coef_expr: this.parseNumber(tariff.boxDeliveryMarketplaceCoefExpr),
                        box_delivery_marketplace_liter: this.parseNumber(tariff.boxDeliveryMarketplaceLiter),
                        box_storage_base: this.parseNumber(tariff.boxStorageBase),
                        box_storage_coef_expr: this.parseNumber(tariff.boxStorageCoefExpr),
                        box_storage_liter: this.parseNumber(tariff.boxStorageLiter),
                        box_delivery_and_storage_expr: tariff.boxDeliveryAndStorageExpr || null,
                        created_at: new Date(),
                        updated_at: new Date()
                    }));

                await trx('wb_tariffs').insert(records);
            });

            console.log(`Successfully saved ${tariffs.length} tariffs for date: ${date}`);
        } catch (error: any) {
            console.error('Error saving tariffs to database:', error.message);
            throw error;
        }
    }

    async getTodayTariffs(): Promise<TariffRecord[]> {
        const today = new Date().toISOString().split('T')[0];

        const result = await knex('wb_tariffs')
            .where('date', today)
            .orderBy('box_delivery_coef_expr', 'asc');

        return result as TariffRecord[];
    }
}