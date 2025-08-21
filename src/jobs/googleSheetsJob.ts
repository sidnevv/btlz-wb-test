import { WBService } from '#services/wbService.js';
import { GoogleSheetsService } from '#services/googleSheetsService.js';
import { CronJob } from 'cron';

export class GoogleSheetsJob {
    private wbService: WBService;
    private googleSheetsService: GoogleSheetsService;

    constructor(
        wbApiToken: string,
        googleServiceAccountEmail: string,
        googlePrivateKey: string,
        spreadsheetIds: string[]
    ) {
        this.wbService = new WBService(wbApiToken);
        this.googleSheetsService = new GoogleSheetsService(
            googleServiceAccountEmail,
            googlePrivateKey,
            spreadsheetIds
        );
    }

    start(): void {
        const job = new CronJob('*/30 * * * *', async () => {
            try {
                console.log('Starting Google Sheets update job...');
                const tariffs = await this.wbService.getTodayTariffs();
                await this.googleSheetsService.updateSpreadsheets(tariffs);
                console.log('Google Sheets update job completed successfully');
            } catch (error: any) {
                console.error('Google Sheets update job failed:', error.message);
            }
        });

        job.start();
        console.log('Google Sheets job started. Will run every 30 minutes.');
    }
}