/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("wb_tariffs", (table) => {
        table.increments("id").primary();
        table.date("date").notNullable();
        table.string("warehouse_name").notNullable();
        table.string("geo_name").notNullable();
        table.decimal("box_delivery_base", 10, 2).notNullable();
        table.decimal("box_delivery_coef_expr", 10, 2).notNullable();
        table.decimal("box_delivery_liter", 10, 2).notNullable();
        table.decimal("box_delivery_marketplace_base", 10, 2).notNullable();
        table.decimal("box_delivery_marketplace_coef_expr", 10, 2).notNullable();
        table.decimal("box_delivery_marketplace_liter", 10, 2).notNullable();
        table.decimal("box_storage_base", 10, 2).notNullable();
        table.decimal("box_storage_coef_expr", 10, 2).notNullable();
        table.decimal("box_storage_liter", 10, 2).notNullable();
        table.string("box_delivery_and_storage_expr").nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());

        // Индексы для оптимизации запросов
        table.index(["date"]);
        table.index(["warehouse_name"]);
        table.index(["geo_name"]);
        table.index(["box_delivery_coef_expr"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("wb_tariffs");
}