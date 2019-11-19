
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function signup(parent, args, context, info) {
    const password = await bcrypt.hash(args.password, 10)
    const user = await context.prisma.createUser({ ...args, password})

    const token = jwt.sign({userId: user.id}, APP_SECRET)

    return {
        token, 
        user
    }
}

async function login(parent, {email, password}, context, info) {
    const user = await context.prisma.user({email: email})
    if (!user) {
        throw new Error("No such User")
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        throw new Error("Password invalid")
    }
    
    const token = jwt.sign({userId: user.id}, APP_SECRET)

    return {
        token,
        user
    }
}

function post(root, {url, description}, context, info) {
    const userId = getUserId(context)
    return context.prisma.createLink({
        url: url,
        description: description,
        postedBy: {
            connect: {
                id: userId
            }
        }
    })
}

async function vote(parent, {linkId}, context, info) {
    const userId = getUserId();

    const linkExist = await context.prisma.$exists.vote({
        user: {id: userId},
        link: {id: linkId}
    })
    if (linkExist) {
        throw new Error(`Already voted for link ${linkId}`)
    }

    return context.prisma.createVote({
        user: {connect: { id: userId}},
        link: {connect: { id: linkId}}
    })
}

module.exports = {
    signup, 
    login,
    post,
    vote
}