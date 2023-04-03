import {QueryRunner} from "typeorm";

function executeQueryWithParams(
    queryRunner: QueryRunner,
    query: string,
    params: Record<string, any> = {}
) {
    const [_query, _params] =
        queryRunner.connection.driver.escapeQueryWithParameters(
            query,
            params,
            {}
        );
    return queryRunner.query(_query, _params);
}

function postgres2Mysql(query: string): string {
    return query
        .replace(/"public"."(\w+)"/g, "`$1`")
        .replace(/"(\w+)"\."(\w+)"/g, "`$1`.`$2`")
        .replace(/"(\w+)"/g, "`$1`");
}

export function queryRunnerFactory(queryRunner: QueryRunner) {
    const isMysql =
        queryRunner.connection.options.type === "mysql" ||
        queryRunner.connection.options.type === "mariadb";
    return function q(
        query: string,
        params: Record<string, any> = {},
        translateDialect = true
    ) {
        const translatedQuery =
            translateDialect && isMysql ? postgres2Mysql(query) : query;
        return executeQueryWithParams(queryRunner, translatedQuery, params);
    };
}
