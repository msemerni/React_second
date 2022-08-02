const jwtSecret   = 'OLX'

const express           = require('express');
const express_graphql   = require('express-graphql');

const { buildSchema, printSchema } = require('graphql');
const expand = require('mm-graphql/expand')
const fs     = require('fs')
const uploadPath = `${__dirname}/public/images/`;
const upload  = require('multer')({ dest: uploadPath });

(async () => {

    const {Savable, slice, getModels} = await require('./models.js')()
    const { jwtGQL, jwtCheck } = require('mm-graphql/jwt')

    const {anonSchema, anonResolvers} = require('./anon')({Savable, secret: jwtSecret})

    let schema = buildSchema(`
        type User {
             _id: String
             createdAt: String
             login: String
             nick : String
             avatar: Image
             incomings: [Message]
             phones: [String]
             addresses: [String]
        }

        input UserInput {
             _id: String
             login: String
             nick : String
             avatar: ImageInput

             phones: [String]
             addresses: [String]
        }

        type Image {
            _id: ID,
            text: String,
             createdAt: String
            url: String,
            originalFileName: String,
            userAvatar: User,
            ad: Ad,
            message: Message
            owner: User
        }

        input ImageInput {
            _id: ID,
             createdAt: String
            text: String,
            userAvatar: UserInput
        }

        type Ad {
            _id: ID,
            owner: User
            images: [Image]
            comments: [Comment]
            createdAt: String

            title: String
            description: String,
            tags: [String]
            address: String
            price: Float
        }

        input AdInput {
            _id: ID,
            images: [ImageInput]

            title: String
            description: String,
            tags: [String]
            address: String
            price: Float
        }


        type Comment {
            _id: ID,
            owner: User
            createdAt: String

            text: String
            ad: Ad
            answers: [Comment]
            answerTo: Comment
        }

        input CommentInput {
            _id: ID,
            text: String

            ad: AdInput
            answerTo: CommentInput
        }

        type Message {
            _id: ID,
            owner: User
            createdAt: String

            to: User
            text: String
            image: Image
        }

        input MessageInput {
            _id: ID,

            to: UserInput
            text: String
            image: ImageInput
        }
    `);

    schema = expand(schema)
    console.log(printSchema(schema))

    const app = express();

    app.use(require('cors')())
    app.use(express.static('public'));
    app.use('/graphql', express_graphql(jwtGQL({anonSchema, anonResolvers, schema, createContext: getModels, graphiql: true, secret: jwtSecret})))


    app.post('/upload', upload.single('photo'), async (req, res, next) => {
        let decoded;
        console.log('wtf')
        if (decoded = jwtCheck(req, jwtSecret)){
            console.log('SOME UPLOAD', decoded, req.file)

            let {models: {Image }} = await getModels(decoded.sub)
            let image = await Image.fromFileData(req.file)
            res.end(JSON.stringify({_id: image._id, url: image.url}))
        }
        else {
            res.status(503).send('permission denied')
        }
    })


    app.use(express.static('public'));


    let socketPath = "/home/asmer/node_hosts/marketplace"
    app.listen(socketPath, () => {
        console.log('Express GraphQL Server Now Running On localhost:4000/graphql');
        fs.chmodSync(socketPath, '777');
    });
})()

