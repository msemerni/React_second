shop
===

**Mock Back for ecommerce-like service**

Main GraphQL
----

```
        type User {
             _id: String
             createdAt: String
             login: String
             nick : String
             avatar: Image
        }

        input UserInput {
             _id: String
             login: String
             nick : String
             avatar: ImageInput
        }

        type Image {
            _id: ID,
            text: String,
            url: String,
            originalFileName: String,
            userAvatar: User,
            good: Good
            category: Category
            owner: User
        }

        input ImageInput {
            _id: ID,
            text: String,
            userAvatar: UserInput,
            good: GoodInput
            category: CategoryInput
        }

        type Category {
            _id: ID,
            name: String!,
            goods: [Good]
            image: Image
        }

        input CategoryInput {
            _id: ID,
            name: String!,
            goods: [ID]
            image: ImageInput
        }

        type Good {
            _id: ID,
            name: String!,
            description: String
            price: Float
            orderGoods: [OrderGood]
            categories: [Category]
            images: [Image]
        }

        input GoodInput {
            _id: ID,
            name: String!,
            description: String
            price: Float
            categories: [CategoryInput]
            images: [ImageInput]
        }

        type OrderGood {
            _id: ID,
            price: Float,
            count: Float,
            good: Good,
            order: Order
        }

        input OrderGoodInput {
            _id: ID,
            count: Int!,
            good: [GoodInput],
            order: [OrderInput]
        }

        type Order {
            _id: ID
            total: Float
            orderGoods: [OrderGood]
        }

        input OrderInput {
            _id: ID
            orderGoods: [OrderGoodInput]
        }

type Query {
  UserFind(query: String): [User]
  UserCount(query: String): Int
  UserFindOne(query: String): User
  ImageFind(query: String): [Image]
  ImageCount(query: String): Int
  ImageFindOne(query: String): Image
  GoodFind(query: String): [Good]
  GoodCount(query: String): Int
  GoodFindOne(query: String): Good
  CategoryFind(query: String): [Category]
  CategoryCount(query: String): Int
  CategoryFindOne(query: String): Category
  OrderGoodFind(query: String): [OrderGood]
  OrderGoodCount(query: String): Int
  OrderGoodFindOne(query: String): OrderGood
  OrderFind(query: String): [Order]
  OrderCount(query: String): Int
  OrderFindOne(query: String): Order
}

type Mutation {
  UserDelete(user: UserInput): User
  UserUpsert(user: UserInput): User
  ImageDelete(image: ImageInput): Image
  ImageUpsert(image: ImageInput): Image
  GoodDelete(good: GoodInput): Good
  GoodUpsert(good: GoodInput): Good
  CategoryDelete(category: CategoryInput): Category
  CategoryUpsert(category: CategoryInput): Category
  OrderGoodDelete(orderGood: OrderGoodInput): OrderGood
  OrderGoodUpsert(orderGood: OrderGoodInput): OrderGood
  OrderDelete(order: OrderInput): Order
  OrderUpsert(order: OrderInput): Order
}


```

Anon graphql
-----

```
        type Query {
            login(login: String!, password: String!): String
        }
        type Mutation {
            createUser(login: String!, password: String!): User
            changePassword(login: String!, password: String!, newPassword: String!): User
        }

        type User {
             _id: String
             login: String
        }
```
