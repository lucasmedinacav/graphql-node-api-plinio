import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import schema from './graphql/schema';
class App {
    public express: express.Application;
    nodeEnv = process.env.NODE_ENV;

    constructor() {
        this.express = express();
        this.middleware();
    }

    private middleware(): void {      
        this.express.use('/graphql', graphqlHTTP({
            schema: schema,
            graphiql: this.nodeEnv != 'production'
        }))
    }
}

export default new App().express;