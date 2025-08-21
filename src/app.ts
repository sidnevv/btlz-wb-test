import env from '#config/env/env.js';
import knex from '#postgres/knex.js';
import { TariffJob } from '#jobs/tariffJob.js';
import { GoogleSheetsJob } from '#jobs/googleSheetsJob.js';

async function waitForPostgres(maxRetries = 30, delay = 1000): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await knex.raw('SELECT 1');
            console.log('Successfully connected to PostgreSQL');
            return;
        } catch (error: any) {
            retries++;
            console.log(`Waiting for PostgreSQL... (attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Failed to connect to PostgreSQL after maximum retries');
}

function validateWBToken(token: string | undefined): boolean {
    if (!token || token === 'your_wb_api_token_here') {
        console.log('WB_API_TOKEN not provided or is placeholder');
        return false;
    }

    console.log('WB token format appears valid');
    return true;
}

async function bootstrap() {
    try {
        console.log('Starting application...');

        console.log('Waiting for PostgreSQL to be ready...');
        await waitForPostgres();

        console.log('Running migrations...');
        await knex.migrate.latest();

        console.log('Running seeds...');
        await knex.seed.run();

        console.log("All migrations and seeds have been run");

        const hasValidWBToken = validateWBToken(env.WB_API_TOKEN);

        if (hasValidWBToken) {
            try {
                const tariffJob = new TariffJob(env.WB_API_TOKEN);
                await tariffJob.runNow();
                tariffJob.start();
            } catch (error: any) {
                console.log('WB API test failed:', error.message);
                console.log('WB tariff jobs will not run');
            }
        }

        if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.SPREADSHEET_IDS) {
            try {
                const googleSheetsJob = new GoogleSheetsJob(
                    env.WB_API_TOKEN,
                    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    env.GOOGLE_PRIVATE_KEY,
                    env.SPREADSHEET_IDS.split(',')
                );
                googleSheetsJob.start();
            } catch (error: any) {
                console.log('Google Sheets job failed to start:', error.message);
            }
        }

        console.log('Application started successfully');

    } catch (error: any) {
        console.error('Failed to start application:', error.message);
        process.exit(1);
    }
}

bootstrap();