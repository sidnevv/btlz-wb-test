import { WBService } from '#services/wbService.js';
import { CronJob } from 'cron';

export class TariffJob {
    private wbService: WBService;

    constructor(apiToken: string) {
        this.wbService = new WBService(apiToken);
    }

    start(): void {
        const job = new CronJob('0 * * * *', async () => {
            try {
                console.log('Starting tariff update job...');
                const tariffs = await this.wbService.fetchTariffs();
                await this.wbService.saveTariffs(tariffs);
                console.log("Tariff update job completed successfully");
            } catch (error: any) {
                console.error('Tariff update job failed:', error.message);
            }
        });

        job.start();
        console.log('Tariff job started. Will run every hour at minute 0.');
    }

    async runNow(): Promise<void> {
        try {
            console.log('Running tariff job immediately...');
            const tariffs = await this.wbService.fetchTariffs();
            await this.wbService.saveTariffs(tariffs);
            console.log('Immediate tariff job completed successfully');
        } catch (error: any) {
            console.error('Immediate tariff job failed:', error.message);
            throw error;
        }
    }
}