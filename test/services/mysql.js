import mysql from 'mysql'

class mysqlProvider {
    runQuery (sql, params = [], single = true) {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        })


        return new Promise((resolve, reject) => {
                connection.query(sql, params, (err, results) => {
                if(err) {
                    console.log(err);
                    console.log('something went wront');
                }
                let returnedResult = []

                if (single) {
                    returnedResult = {}
                }

                if (results !== undefined && results.length) {
            returnedResult = results
            if (single) {
                returnedResult = results[0]
            }
        }

        resolve(returnedResult)
        connection.end();
    })
    })
    }

    async findOneByColumn (table, column, value) {
    const sql = 'select * from ' + table + ' where ' + column + ' = ? limit 1'

    return this.runQuery(sql, [value], 1)
}

    update (table, changes, where) {
        const sql = `update ${table} set ? where ?`
        return this.runQuery(sql, [changes, where])
    }

    statement (sql) {
        return this.runQuery(sql)
    }
}

export default mysqlProvider
