import { gql, ApolloServer, UserInputError } from 'apollo-server'
import { v1 as uuid } from 'uuid'


const people = [
  { firstName: "John", lastName: "Doe", age: 50, country: "Uruguay", street: "street 1" },
  { firstName: "Tom", lastName: "Doe", age: 12, eyeColor: "blue", country: "Argentina", street: "street 2" },
  { firstName: "Steve", lastName: "Pim", age: 20, country: "Argentina", street: "street 5" },
  { firstName: "Max", lastName: "Sur", age: 10, eyeColor: "green", country: "Brazil", street: "street 4" }]


//Define types
const typeDefs = gql`
  enum YesNo{
    YES
    NO
  }

  type Address {
    country:String!
    street: String!
  }


  type Person {
    firstName: String!
    lastName:String!
    age: Int!
    eyeColor: String
    canVote:Boolean!
    address: Address!
  }

  type Query {
    personCount: Int!
    allPersons(eyeColor:YesNo):[Person]!
    findPerson(name:String!) : Person
  }

  type Mutation {
    addPerson(firstName:String! 
      lastName:String! 
      age: Int! 
      eyeColor: String) :Person

    editEyeColor(
      firstName:String!
      eyeColor:String!):Person
  }
`

//Defines from where the queries will retrieve the data and mutations
const resolvers = {
  Query: {
    personCount: () => people.length,
    allPersons: (root, args) => {
      if (!args.eyeColor) return people

      const byEyeColor = (person) => args.eyeColor === "YES" ? person.eyeColor : !person.eyeColor


      return people.filter(byEyeColor)


    },

    findPerson: (root, args) => people.find(({ firstName }) => (args.name === firstName))
  },
  // Person: {  //Once we extract one Person the person resolver is trigger by defualt
  //   firstName: (root) => root.firstName, //root is what was resolved before(return a person.firstName)
  //   lastName: (root) => root.lastName,
  //   age: (root) => root.age,
  //   eyeColor: (root) => root.eyeColor
  // }

  Mutation: {
    addPerson: (root, args) => {
      if (people.find(p => p.firstName === args.firstName)) {
        throw new UserInputError('First name must be unique', { invalidArgs: args.firstName })
      }
      const person = { ...args, id: uuid() }

      people.push(person)
      return person
    },

    editEyeColor: (root, args) => {
      const { firstName, eyeColor } = args
      const person = people.find(p => p.firstName === firstName)
      if (person) {
        person.eyeColor = eyeColor
        return person
      } else{
        throw new UserInputError('First name not found in people', { invalidArgs: firstName})
      }

    }
  },

  //Add runtime fields to person based on other fields
  Person: {
    canVote: (root) => root.age > 18,
    address: (root) => { return { street: root.street, country: root.country } }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})