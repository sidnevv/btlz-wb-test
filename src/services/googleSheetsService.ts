import { google } from 'googleapis';
import { TariffRecord } from '#types/index.js';

export class GoogleSheetsService {
    private sheets: any;
    private spreadsheetIds: string[];

    constructor(serviceAccountEmail: string, privateKey: string, spreadsheetIds: string[]) {
        const auth = new google.auth.JWT(
            serviceAccountEmail,
            undefined,
            privateKey.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        this.sheets = google.sheets({ version: 'v4', auth });
        this.spreadsheetIds = spreadsheetIds;
    }

    async updateSpreadsheets(tariffs: TariffRecord[]): Promise<void> {
        const data = this.prepareDataForSheets(tariffs);

        for (const spreadsheetId of this.spreadsheetIds) {
            try {
                await this.updateSpreadsheet(spreadsheetId, data);
                console.log(`Successfully updated spreadsheet: ${spreadsheetId}`);
            } catch (error: any) {
                console.error(`Error updating spreadsheet ${spreadsheetId}:`, error.message);
            }
        }
    }

    private prepareDataForSheets(tariffs: TariffRecord[]): any[][] {
        const headers = [
            'Date',
            'Warehouse',
            'Region',
            'Delivery Base',
            'Delivery Coef',
            'Delivery Liter',
            'Marketplace Base',
            'Marketplace Coef',
            'Marketplace Liter',
            'Storage Base',
            'Storage Coef',
            'Storage Liter',
            'Delivery & Storage Expr'
        ];

        const rows = tariffs.map(tariff => [
            tariff.date,
            tariff.warehouse_name,
            tariff.geo_name,
            tariff.box_delivery_base,
            tariff.box_delivery_coef_expr,
            tariff.box_delivery_liter,
            tariff.box_delivery_marketplace_base,
            tariff.box_delivery_marketplace_coef_expr,
            tariff.box_delivery_marketplace_liter,
            tariff.box_storage_base,
            tariff.box_storage_coef_expr,
            tariff.box_storage_liter,
            tariff.box_delivery_and_storage_expr
        ]);

        return [headers, ...rows];
    }

    private async updateSpreadsheet(spreadsheetId: string, data: any[][]): Promise<void> {
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'stocks_coefs!A:Z',
            valueInputOption: 'RAW',
            requestBody: {
                values: data
            }
        });
    }
}