module.exports = {

    development: {

        migrations: { tableName: 'knex_migrations' },
        seeds: { tableName: './seeds' },

        client: 'mysql',
        connection: {

            host: 'localhost',
            port: '8889',

            user: 'root',
            password: 'root',

            database: 'birdbase',
            charset: 'utf8',

        }

    }

};
