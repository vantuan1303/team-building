const Company = require('../models/company.model')
const User = require('../models/user.model')
const mongoose = require('mongoose')

const postCompany = async (req, res, next) => {
    let { name, address, emailDomain } = req.body
    const signedUser = req.user
    try {
        if (signedUser.company.id) throw "One person - one company"
        if (emailDomain) {
            if (signedUser.role != "admin") {
                emailDomain = signedUser.email.split('@')[1]
            }
            if (emailDomain.trim().toLowerCase() === "gmail.com") throw "Can not create company with this email domain"
        }

        let company
        if (signedUser.role != "admin") {
            company = await Company.create({ name, address, emailDomain, members: [signedUser._id] })

            signedUser.company = { id: company._id, role: "manager" }
            await signedUser.save()
        } else {
            company = await Company.create({ name, address, emailDomain })
        }

        res.json({ message: `Create company ${company.name} successfully!`, company })
    } catch (error) {
        next(error)
    }
}

const deleteCompany = async (req, res, next) => {
    const { companyId } = req.params
    try {
        const [company, user] = await Promise.all([
            Company.findByIdAndDelete(companyId),
            User.updateMany(
                { "company.id": companyId },
                { $unset: { "company.id": companyId }, },
            )
        ])

        if (!company)
            throw "Can not find company with id: " + companyId

        res.json({ message: "Delete company successfully!" })
    } catch (error) {

        next(error)
    }
}

const updateCompany = async (req, res, next) => {
    const companyId = req.params.companyId
    const { name, address } = req.body

    const query = {
        ...(name && { name }),
        ...(address && { address }),
    }
    try {
        const company = await Company.findByIdAndUpdate(
            companyId, query, { new: true }
        )

        if (!company) throw "Can not find company"

        res.json({ message: `Update company ${company.name} successfully!`, company })
    } catch (error) {
        next(error)
    }
}

const getCompanies = async (_req, res, next) => {
    try {
        const companies = await Company.find(
            {},
            "name address emailDomain createdAt"
        )

        if (!companies) throw "Can not show company"

        res.json({ companies })
    } catch (error) {
        next(error)
    }
}

const getCompany = async (req, res, next) => {
    const { companyId } = req.params

    try {
        const company = await Company.findById(companyId)

        if (!company) throw "Wrong company id"

        res.json({ company })
    } catch (error) {
        next(error)
    }
}

const getCompanyByEmailDomain = async (req, res, next) => {
    const emailDomain = req.params.emailDomain
    try {
        const company = await Company.findOne({ emailDomain }).select('name')

        if (!company) throw "Can not find company with this email domain"

        res.json({ company })
    } catch (error) {
        next(error)
    }
}

const addMembers = async (req, res, next) => {
    const { companyId } = req.params
    const { userIds } = req.body

    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            let arrayUserIds = userIds
            if (typeof userIds === 'string') {
                arrayUserIds = userIds.split(',').map(item => {
                    return item.trim()
                })
            }

            const users = await User.find({ _id: { $in: arrayUserIds }, 'company.id': { $exists: false } })

            if (users.length === 0) throw "Can not find any user"

            const validUserIds = users.map(user => user._id)

            const [_, company] = await Promise.all([
                User.updateMany({ _id: { $in: validUserIds }, 'company.id': { $exists: false } },
                    { $set: { "company.id": companyId, "company.role": "employee" } })
                    .select('members')
                    .session(session),

                Company.findOneAndUpdate(
                    { _id: companyId },
                    { $addToSet: { members: { $each: validUserIds } } },
                    { new: true }
                ).session(session)
            ])

            if (!company) throw "Can not find company"

            res.json({
                message: `Add member to company ${company.name} successfully!`, company
            })
        })
    } catch (error) {
        next(error)
    }
}

const removeMember = async (req, res, next) => {
    const { companyId } = req.params
    const { userId } = req.body

    const session = await mongoose.startSession()

    try {
        await session.withTransaction(async () => {
            const [company, _] = await Promise.all([
                Company.findByIdAndUpdate(companyId, { $pull: { members: userId } }).session(session),
                User.findByIdAndUpdate(userId, { $unset: { company: '' } }).session(session)
            ])
    
            if (!company)
                throw "Can not find company"
    
            res.json({ message: `Remove member successfully!` })
        })
    } catch (error) {
        next(error)
    }
}

const getUsersInCompany = async (req, res, next) => {
    const { companyId } = req.params
    try {
        const company = await Company.findById(companyId).select('members')
        if (!company) throw "Can not find company"

        res.json({ users: company.members })
    } catch (error) {
        next(error)
    }
}

const changeUserRole = async (req, res, next) => {
    const { companyId } = req.params
    const { userId, role } = req.body
    const signedUser = req.user

    if (signedUser.role != "admin" && role === "admin") {
        //Only admin can make user become admin. If not, role = manager
        role = "manager"
    }

    try {
        const company = await Company.findById(companyId)

        if (!company) throw "Can not find company"

        const user = await User.findOneAndUpdate({ _id: userId, "company.id": companyId }, { "company.role": role })

        if (!user) throw "Can not find user"

        res.json({
            result: 'ok',
            message: `${user.name} is now ${role} of company: ${company.name}!`,
        })
    } catch (error) {
        next(error)
    }
}

const upgradeVip = async (req, res, next) => {
    const { companyId } = req.params
    const { vip } = req.body

    try {
        const value = vip.trim().toLowerCase()
        let limited = {}

        switch (value) {
            case "vip1":
                limited = {
                    members: 100,
                    teams: 10,
                    space: 100,
                    projects: 9999,
                    groupJobs: 9999,
                    jobs: 9999,
                }
                break
            case "vip2":
                limited = {
                    members: 200,
                    teams: 30,
                    space: 1000,
                    projects: 9999,
                    groupJobs: 9999,
                    jobs: 9999,
                }
                break
            case "vip3":
                limited = {
                    members: 9999,
                    teams: 9999,
                    space: 5000,
                    projects: 9999,
                    groupJobs: 9999,
                    jobs: 9999,
                }
                break
            default:
                limited = {
                    members: 10,
                    teams: 2,
                    space: 5,
                    projects: 1,
                    groupJobs: 5,
                    jobs: 20,
                }
                break
        }

        const company = await Company.findByIdAndUpdate(
            companyId,
            { limited, lastUpgradeVip: Date.now() },
            { new: true }
        ).select("limited lastUpgradeVip")

        if (!company) throw "Can not find company with id: " + companyId

        res.json({
            message: `Update company ${company.name} to ${vip} successfully`,
            company
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    postCompany,
    updateCompany,
    getCompany,
    getUsersInCompany,
    deleteCompany,
    getCompanies,
    getCompanyByEmailDomain,
    addMembers,
    removeMember,
    changeUserRole,
    upgradeVip
}